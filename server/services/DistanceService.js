/**
 * KSFP Distance Service
 * Calculate distance between parent location and school
 * Estimate travel time and transport costs
 */

const fs = require('fs');
const path = require('path');
const LocationService = require('./LocationService');

class DistanceService {
    /**
     * Average walking/travel speeds in Kenya (km/h)
     */
    static SPEEDS = {
        walking: 4,           // 4 km/h average walking
        cycling: 12,          // 12 km/h cycling
        matatu: 25,           // 25 km/h average (traffic, stops)
        motorcycle: 40,       // 40 km/h motorcycle taxi
        private_car: 50,      // 50 km/h private car (mixed traffic)
        highway: 80            // 80 km/h on highway
    };

    /**
     * Transport cost per km (estimate for Kenya)
     */
    static COSTS_PER_KM = {
        walking: 0,            // Free
        cycling: 0,            // Free
        matatu: 3,             // ~3 KES per km
        motorcycle: 5,         // ~5 KES per km
        private_car: 10        // ~10 KES per km (fuel)
    };

    /**
     * Calculate distance between parent and school
     * @param {number} parentLat - Parent latitude
     * @param {number} parentLon - Parent longitude
     * @param {number} schoolLat - School latitude
     * @param {number} schoolLon - School longitude
     * @returns {number} Distance in kilometers
     */
    static calculateDistance(parentLat, parentLon, schoolLat, schoolLon) {
        return LocationService.haversineDistance(
            parentLat,
            parentLon,
            schoolLat,
            schoolLon
        );
    }

    /**
     * Estimate travel time based on distance and transport mode
     * @param {number} distance - Distance in km
     * @param {string} mode - 'walking' | 'cycling' | 'matatu' | 'motorcycle' | 'private_car' | 'highway'
     * @returns {Object} {time_minutes, time_display}
     */
    static estimateTravelTime(distance, mode = 'matatu') {
        const speed = this.SPEEDS[mode] || this.SPEEDS.matatu;
        const timeHours = distance / speed;
        const timeMinutes = Math.round(timeHours * 60);

        // Add buffer time for traffic/stops/waiting
        let bufferMinutes = 0;
        if (mode === 'matatu') bufferMinutes = 10;    // Stops, waiting
        if (mode === 'motorcycle') bufferMinutes = 5;
        if (mode === 'private_car') bufferMinutes = 5; // Traffic

        const totalMinutes = timeMinutes + bufferMinutes;

        // Format for display
        let timeDisplay = '';
        if (totalMinutes < 60) {
            timeDisplay = `${totalMinutes} minutes`;
        } else {
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            timeDisplay = `${hours}h ${mins}m`;
        }

        return {
            time_minutes: totalMinutes,
            time_display: timeDisplay,
            mode: mode
        };
    }

    /**
     * Estimate daily transport cost
     * @param {number} distance - Distance in km
     * @param {string} mode - Transport mode
     * @param {number} daysPerWeek - School days per week (usually 5)
     * @returns {Object} {daily_cost, weekly_cost, monthly_cost, currency}
     */
    static estimateTransportCost(distance, mode = 'matatu', daysPerWeek = 5) {
        const costPerKm = this.COSTS_PER_KM[mode] || 0;
        
        // Round trip (to school + back home)
        const roundTripDistance = distance * 2;
        
        // Daily cost (one trip: morning only, or assume one way)
        const dailyCost = roundTripDistance * costPerKm;
        
        // Weekly cost (5 school days)
        const weeklyCost = dailyCost * daysPerWeek;
        
        // Monthly cost (4 weeks)
        const monthlyCost = weeklyCost * 4;

        return {
            distance_km: distance,
            daily_cost: Math.round(dailyCost),
            weekly_cost: Math.round(weeklyCost),
            monthly_cost: Math.round(monthlyCost),
            mode: mode,
            currency: 'KES'
        };
    }

    /**
     * Get travel recommendation based on distance
     * @param {number} distance - Distance in km
     * @returns {Object} {recommended_mode, reason, cost_estimate, time_estimate}
     */
    static getTravelRecommendation(distance) {
        let recommendedMode = 'matatu';
        let reason = 'Cost-effective public transport';

        if (distance < 2) {
            recommendedMode = 'walking';
            reason = 'Close to school, walkable distance';
        } else if (distance < 5) {
            recommendedMode = 'cycling';
            reason = 'Cycling is practical and healthy';
        } else if (distance > 30) {
            recommendedMode = 'motorcycle';
            reason = 'Faster than matatu for long distance';
        }

        return {
            recommended_mode: recommendedMode,
            reason: reason,
            cost_estimate: this.estimateTransportCost(distance, recommendedMode),
            time_estimate: this.estimateTravelTime(distance, recommendedMode)
        };
    }

    /**
     * Get distance category for parent filtering
     * @param {number} distance - Distance in km
     * @returns {string} 'VERY_CLOSE' | 'CLOSE' | 'MODERATE' | 'FAR' | 'VERY_FAR'
     */
    static getDistanceCategory(distance) {
        if (distance < 1) return 'VERY_CLOSE';
        if (distance < 5) return 'CLOSE';
        if (distance < 15) return 'MODERATE';
        if (distance < 30) return 'FAR';
        return 'VERY_FAR';
    }

    /**
     * Get distance description for parents
     * @param {number} distance - Distance in km
     * @returns {string}
     */
    static getDistanceDescription(distance) {
        const category = this.getDistanceCategory(distance);
        
        const descriptions = {
            'VERY_CLOSE': `${distance.toFixed(1)} km - Walking distance`,
            'CLOSE': `${distance.toFixed(1)} km - Short commute`,
            'MODERATE': `${distance.toFixed(1)} km - Reasonable commute`,
            'FAR': `${distance.toFixed(1)} km - Long daily commute`,
            'VERY_FAR': `${distance.toFixed(1)} km - Very long distance`
        };

        return descriptions[category] || 'Distance information pending';
    }

    /**
     * Calculate distance from parent location (GPS) to multiple schools
     * Return sorted by distance (nearest first)
     * @param {number} parentLat
     * @param {number} parentLon
     * @param {Array} schools - [{id, name, latitude, longitude}]
     * @returns {Array} Schools with calculated distances, sorted nearest first
     */
    static sortSchoolsByDistance(parentLat, parentLon, schools) {
        const schoolsWithDistance = schools.map(school => ({
            ...school,
            distance_km: this.calculateDistance(
                parentLat,
                parentLon,
                school.latitude,
                school.longitude
            ),
            travel_time: this.estimateTravelTime(
                this.calculateDistance(parentLat, parentLon, school.latitude, school.longitude),
                'matatu'
            ),
            distance_category: this.getDistanceCategory(
                this.calculateDistance(parentLat, parentLon, school.latitude, school.longitude)
            )
        }));

        // Sort by distance (nearest first)
        return schoolsWithDistance.sort((a, b) => a.distance_km - b.distance_km);
    }

    /**
     * Filter schools by distance range
     * @param {Array} schools - Schools with distance_km calculated
     * @param {number} maxDistance - Maximum distance in km
     * @returns {Array} Filtered schools
     */
    static filterByDistance(schools, maxDistance) {
        return schools.filter(school => school.distance_km <= maxDistance);
    }

    /**
     * Log distance calculation
     * @param {string} schoolId
     * @param {Object} distanceData
     */
    static logDistanceCalculation(schoolId, distanceData) {
        try {
            const logPath = path.join(__dirname, '../../logs/distance.log');
            const logEntry = JSON.stringify({
                timestamp: new Date().toISOString(),
                school_id: schoolId,
                ...distanceData,
                event: 'DISTANCE_CALCULATED'
            }) + '\n';

            fs.appendFileSync(logPath, logEntry);
        } catch (error) {
            console.error('Distance logging error:', error);
        }
    }

    /**
     * Calculate distance statistics for a school
     * (average distance from all parent accesses)
     * @param {Array} accessLogs - [{parent_lat, parent_lon, timestamp}]
     * @param {Object} school - {latitude, longitude}
     * @returns {Object} {avg_distance, max_distance, min_distance, parent_count}
     */
    static calculateDistanceStatistics(accessLogs, school) {
        if (!accessLogs || accessLogs.length === 0) {
            return {
                avg_distance: 0,
                max_distance: 0,
                min_distance: 0,
                parent_count: 0
            };
        }

        const distances = accessLogs.map(log =>
            this.calculateDistance(
                log.parent_lat,
                log.parent_lon,
                school.latitude,
                school.longitude
            )
        );

        const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
        const maxDistance = Math.max(...distances);
        const minDistance = Math.min(...distances);

        return {
            avg_distance: Math.round(avgDistance * 10) / 10,
            max_distance: Math.round(maxDistance * 10) / 10,
            min_distance: Math.round(minDistance * 10) / 10,
            parent_count: accessLogs.length,
            coverage_area_km: maxDistance
        };
    }
}

module.exports = DistanceService;
