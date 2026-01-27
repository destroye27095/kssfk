/**
 * KSFP Location Service
 * Auto-detect school location, county, zone type
 * Handles GPS coordinates, ASAL classification, urban/rural designation
 */

const fs = require('fs');
const path = require('path');

class LocationService {
    /**
     * ASAL (Arid and Semi-Arid Lands) zones per government
     * Free fees policy applies automatically
     */
    static ASAL_COUNTIES = [
        'Turkana',
        'Marsabit',
        'Mandera',
        'Wajir',
        'Garissa',
        'Samburu',
        'Isiolo',
        'Lamu',
        'Tana River'
    ];

    /**
     * Urban city centers with high congestion
     */
    static URBAN_ZONES = [
        'Nairobi',
        'Mombasa',
        'Kisumu',
        'Nakuru',
        'Eldoret',
        'Kigali',
        'Thika',
        'Uasin Gishu'
    ];

    /**
     * Auto-detect school zone type based on county
     * @param {Object} schoolData - {county, latitude, longitude}
     * @returns {Object} {zone_type, is_asal, fees_policy}
     */
    static detectZoneType(schoolData) {
        const { county, latitude, longitude } = schoolData;

        // Check if ASAL zone
        const isASAL = this.ASAL_COUNTIES.includes(county);
        
        // Determine zone type
        let zoneType = 'RURAL';
        let isUrban = false;

        if (this.URBAN_ZONES.includes(county)) {
            zoneType = 'URBAN';
            isUrban = true;
        } else if (isASAL) {
            zoneType = 'ASAL';
        }

        // ASAL → automatic free fees (government policy)
        const feesPolicy = isASAL ? 'FREE' : 'STANDARD';

        return {
            zone_type: zoneType,
            is_asal: isASAL,
            is_urban: isUrban,
            fees_policy: feesPolicy,
            county: county,
            latitude: latitude,
            longitude: longitude,
            detected_at: new Date().toISOString()
        };
    }

    /**
     * Validate GPS coordinates
     * @param {number} latitude - Must be -4.67 to 5.00 (Kenya bounds)
     * @param {number} longitude - Must be 28.33 to 41.91 (Kenya bounds)
     * @returns {boolean}
     */
    static validateGPS(latitude, longitude) {
        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        // Kenya geographic bounds
        const minLat = -4.67;
        const maxLat = 5.00;
        const minLon = 28.33;
        const maxLon = 41.91;

        return (
            !isNaN(lat) &&
            !isNaN(lon) &&
            lat >= minLat &&
            lat <= maxLat &&
            lon >= minLon &&
            lon <= maxLon
        );
    }

    /**
     * Get human-readable location from coordinates
     * (In production: use reverse geocoding API like Google Maps)
     * @param {number} latitude
     * @param {number} longitude
     * @returns {Object} {county, sub_county, address}
     */
    static async reverseGeocode(latitude, longitude) {
        try {
            // This is a placeholder - in production use Google Maps Geocoding API
            // or OpenStreetMap Nominatim API
            
            // For now, return basic location info
            return {
                latitude: latitude,
                longitude: longitude,
                address: `Location at ${latitude}, ${longitude}`,
                county: 'Unknown', // Will be populated by school admin
                sub_county: 'Unknown',
                confidence: 0.5
            };
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return {
                latitude: latitude,
                longitude: longitude,
                address: 'Location coordinates recorded',
                error: error.message
            };
        }
    }

    /**
     * Classify rural vs urban based on GPS
     * Uses population density proxy (in production)
     * @param {number} latitude
     * @param {number} longitude
     * @returns {string} 'URBAN' | 'RURAL' | 'ASAL'
     */
    static classifyByGPS(latitude, longitude) {
        // In production: call actual population density API
        // For now: rough approximation based on Nairobi metro area
        
        const nairobiLat = -1.2865;
        const nairobiLon = 36.8172;
        
        // Distance from Nairobi CBD
        const distance = this.haversineDistance(
            latitude,
            longitude,
            nairobiLat,
            nairobiLon
        );

        // If within 15km of Nairobi CBD, it's urban
        if (distance < 15) {
            return 'URBAN';
        }

        // Otherwise rural (or check county if ASAL)
        return 'RURAL';
    }

    /**
     * Calculate distance between two points (Haversine formula)
     * @param {number} lat1
     * @param {number} lon1
     * @param {number} lat2
     * @param {number} lon2
     * @returns {number} Distance in kilometers
     */
    static haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     * @param {number} degrees
     * @returns {number}
     */
    static toRad(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Get all locations (counties) for dropdown
     * @returns {Array} [{county, zone_type, is_asal}]
     */
    static getAllCounties() {
        const counties = [
            'Nairobi', 'Kiambu', 'Machakos', 'Kajiado', 'Narok',
            'Muranga', 'Nyeri', 'Kirinyaga', 'Embu', 'Meru',
            'Tharaka Nithi', 'Isiolo', 'Samburu', 'Marsabit', 'Turkana',
            'Mandera', 'Wajir', 'Garissa', 'Tana River', 'Lamu',
            'Kilifi', 'Mombasa', 'Kwale', 'Kisumu', 'Siaya',
            'Lakeregion', 'Nakuru', 'Uasin Gishu', 'Elgeyo-Marakwet',
            'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma',
            'Busia', 'Trans Nzoia', 'Nandi'
        ];

        return counties.map(county => ({
            county: county,
            zone_type: this.detectZoneType({ county }).zone_type,
            is_asal: this.ASAL_COUNTIES.includes(county)
        }));
    }

    /**
     * Log location detection for audit
     * @param {string} schoolId
     * @param {Object} locationData
     */
    static logLocationDetection(schoolId, locationData) {
        try {
            const logPath = path.join(__dirname, '../../logs/location.log');
            const logEntry = JSON.stringify({
                timestamp: new Date().toISOString(),
                school_id: schoolId,
                ...locationData,
                event: 'LOCATION_DETECTED'
            }) + '\n';

            fs.appendFileSync(logPath, logEntry);
        } catch (error) {
            console.error('Location logging error:', error);
        }
    }

    /**
     * Validate location data completeness
     * @param {Object} locationData - {latitude, longitude, county}
     * @returns {Object} {valid, errors}
     */
    static validateLocationData(locationData) {
        const errors = [];

        if (!locationData.latitude || !locationData.longitude) {
            errors.push('GPS coordinates missing');
        } else if (!this.validateGPS(locationData.latitude, locationData.longitude)) {
            errors.push('GPS coordinates outside Kenya bounds');
        }

        if (!locationData.county) {
            errors.push('County is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = LocationService;
