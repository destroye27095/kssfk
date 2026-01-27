/**
 * KSFP Environment Service
 * Auto-analyze school environment (noise, congestion, air quality, compound size)
 * Produces environment_score (0-100) and environment_type
 */

const fs = require('fs');
const path = require('path');

class EnvironmentService {
    /**
     * Environment type thresholds
     */
    static THRESHOLDS = {
        CALM: { min: 75, max: 100 },      // Score 75-100
        MODERATE: { min: 50, max: 74 },   // Score 50-74
        BUSY: { min: 0, max: 49 }         // Score 0-49
    };

    /**
     * Calculate environment score based on indicators
     * @param {Object} indicators - {zone_type, compound_size_acres, has_green_space, noise_level, congestion}
     * @returns {Object} {environment_score, environment_type, breakdown}
     */
    static calculateEnvironmentScore(indicators) {
        let score = 50; // Base score
        const breakdown = {};

        // 1. ZONE TYPE BONUS (rural = quiet, urban = noisy)
        const zoneBonus = this.calculateZoneBonus(indicators.zone_type);
        score += zoneBonus;
        breakdown.zone_bonus = zoneBonus;

        // 2. COMPOUND SIZE (larger = better environment for students)
        const sizeScore = this.calculateCompoundSizeScore(indicators.compound_size_acres);
        score += sizeScore;
        breakdown.compound_size_score = sizeScore;

        // 3. GREEN SPACE (trees, gardens = air quality, peace)
        const greenScore = indicators.has_green_space ? 10 : -5;
        score += greenScore;
        breakdown.green_space_score = greenScore;

        // 4. NOISE LEVEL (admin-reported or estimated)
        const noiseScore = this.calculateNoiseScore(indicators.noise_level);
        score += noiseScore;
        breakdown.noise_score = noiseScore;

        // 5. CONGESTION (student density, traffic nearby)
        const congestionScore = this.calculateCongestionScore(indicators.congestion);
        score += congestionScore;
        breakdown.congestion_score = congestionScore;

        // Normalize score to 0-100
        score = Math.max(0, Math.min(100, score));

        // Classify environment type
        const environmentType = this.classifyEnvironment(score);

        return {
            environment_score: Math.round(score),
            environment_type: environmentType,
            breakdown: breakdown,
            calculated_at: new Date().toISOString()
        };
    }

    /**
     * Calculate zone type bonus
     * @param {string} zoneType - 'URBAN' | 'RURAL' | 'ASAL'
     * @returns {number} Score adjustment
     */
    static calculateZoneBonus(zoneType) {
        const bonuses = {
            'ASAL': 15,     // Most peaceful (remote, low congestion)
            'RURAL': 20,    // Peaceful environment
            'URBAN': -15    // Busy, noisy, congested
        };

        return bonuses[zoneType] || 0;
    }

    /**
     * Calculate compound size score
     * Larger compounds allow for better student environment
     * @param {number} sizeAcres - School compound size in acres
     * @returns {number} Score adjustment
     */
    static calculateCompoundSizeScore(sizeAcres) {
        if (!sizeAcres || sizeAcres <= 0) return -10; // No data = penalty
        if (sizeAcres >= 5) return 15;   // >=5 acres = excellent space
        if (sizeAcres >= 2) return 10;   // 2-5 acres = good space
        if (sizeAcres >= 1) return 5;    // 1-2 acres = adequate
        return 0;                         // <1 acre = no bonus
    }

    /**
     * Calculate noise level impact on environment
     * @param {string} noiseLevel - 'LOW' | 'MODERATE' | 'HIGH'
     * @returns {number} Score adjustment
     */
    static calculateNoiseScore(noiseLevel) {
        const scores = {
            'LOW': 15,       // Quiet = great for learning
            'MODERATE': 0,   // Normal = no bonus/penalty
            'HIGH': -20      // Noisy = bad for concentration
        };

        return scores[noiseLevel] || 0;
    }

    /**
     * Calculate congestion impact
     * Based on school size, proximity to main road, student density
     * @param {string} congestion - 'LOW' | 'MODERATE' | 'HIGH'
     * @returns {number} Score adjustment
     */
    static calculateCongestionScore(congestion) {
        const scores = {
            'LOW': 10,       // Spacious, not crowded
            'MODERATE': 0,   // Average congestion
            'HIGH': -15      // Crowded = learning disruption
        };

        return scores[congestion] || 0;
    }

    /**
     * Classify environment type based on final score
     * @param {number} score - Final environment score (0-100)
     * @returns {string} 'CALM' | 'MODERATE' | 'BUSY'
     */
    static classifyEnvironment(score) {
        if (score >= this.THRESHOLDS.CALM.min) return 'CALM';
        if (score >= this.THRESHOLDS.MODERATE.min) return 'MODERATE';
        return 'BUSY';
    }

    /**
     * Estimate noise level from zone type and location
     * @param {string} zoneType
     * @param {Object} location - {near_main_road, near_market, near_industrial}
     * @returns {string} 'LOW' | 'MODERATE' | 'HIGH'
     */
    static estimateNoiseLevel(zoneType, location = {}) {
        let noiseLevel = 'LOW'; // Default for rural/ASAL

        if (zoneType === 'URBAN') {
            noiseLevel = 'HIGH'; // Urban areas = high noise
        }

        // Proximity to roads/markets increases noise
        if (location.near_main_road) noiseLevel = 'HIGH';
        if (location.near_market) noiseLevel = 'MODERATE';
        if (location.near_industrial) noiseLevel = 'HIGH';

        return noiseLevel;
    }

    /**
     * Estimate congestion from school enrollment
     * @param {number} studentCount
     * @param {number} compoundSizeAcres
     * @returns {string} 'LOW' | 'MODERATE' | 'HIGH'
     */
    static estimateCongestion(studentCount, compoundSizeAcres) {
        if (!studentCount || studentCount <= 0) return 'MODERATE';

        // Student density: students per acre
        const density = studentCount / (compoundSizeAcres || 1);

        if (density > 500) return 'HIGH';      // >500 students/acre = crowded
        if (density > 250) return 'MODERATE';  // 250-500 students/acre = normal
        return 'LOW';                          // <250 students/acre = spacious
    }

    /**
     * Get environmental description for parents
     * @param {string} environmentType
     * @returns {string}
     */
    static getEnvironmentDescription(environmentType) {
        const descriptions = {
            'CALM': 'Peaceful, focused learning environment with minimal distractions',
            'MODERATE': 'Normal school environment with some activity and noise',
            'BUSY': 'Active environment with higher noise and congestion levels'
        };

        return descriptions[environmentType] || 'Environment data pending';
    }

    /**
     * Log environment analysis
     * @param {string} schoolId
     * @param {Object} analysisResult
     */
    static logEnvironmentAnalysis(schoolId, analysisResult) {
        try {
            const logPath = path.join(__dirname, '../../logs/environment.log');
            const logEntry = JSON.stringify({
                timestamp: new Date().toISOString(),
                school_id: schoolId,
                ...analysisResult,
                event: 'ENVIRONMENT_ANALYZED'
            }) + '\n';

            fs.appendFileSync(logPath, logEntry);
        } catch (error) {
            console.error('Environment logging error:', error);
        }
    }

    /**
     * Full environment analysis pipeline
     * @param {Object} schoolData - {zone_type, compound_size_acres, has_green_space, student_count}
     * @returns {Object} Complete environment analysis
     */
    static analyzeEnvironment(schoolData) {
        const {
            zone_type,
            compound_size_acres,
            has_green_space = false,
            student_count = 0,
            location = {}
        } = schoolData;

        // Estimate values if not provided
        const noiseLevel = this.estimateNoiseLevel(zone_type, location);
        const congestion = this.estimateCongestion(student_count, compound_size_acres);

        // Calculate composite score
        const result = this.calculateEnvironmentScore({
            zone_type,
            compound_size_acres,
            has_green_space,
            noise_level: noiseLevel,
            congestion: congestion
        });

        // Add description
        result.description = this.getEnvironmentDescription(result.environment_type);

        return result;
    }
}

module.exports = EnvironmentService;
