/**
 * Intelligence Routes
 * Endpoints for location detection, environment analysis, security assessment,
 * distance calculation, ratings, teacher stats, and comprehensive school profiles
 */

const express = require('express');
const router = express.Router();
const IntelligenceController = require('../controllers/intelligence.controller');

// ============================================
// SCHOOL PROFILE & SEARCH
// ============================================

/**
 * GET /api/schools/:id/profile
 * Fetch complete school profile with all intelligence data
 * 
 * Query Parameters (optional):
 *   - parent_lat: Parent latitude (for distance calculation)
 *   - parent_lon: Parent longitude (for distance calculation)
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     id, name, county, zone_type, latitude, longitude,
 *     fees: { annual_tuition, fees_policy },
 *     student_count, teacher_stats, student_teacher_ratio,
 *     environment_score, environment_type, compound_size_acres,
 *     security_score, security_level, risk_zone, has_fence/guards/cctv,
 *     distance_km, travel_time, transport_cost,
 *     courses: [],
 *     rating: { overall_score, star_rating, confidence_level, valid_until }
 *   }
 * }
 */
router.get('/schools/:id/profile', IntelligenceController.getSchoolProfile);

/**
 * GET /api/intelligence/schools/search
 * Search and filter schools by criteria
 * 
 * Query Parameters:
 *   - env: CALM | MODERATE | BUSY
 *   - security: HIGH | MEDIUM | LOW
 *   - rating_min: Minimum star rating (0-5)
 *   - distance_max: Maximum distance in km
 *   - county: Filter by county
 *   - fees_max: Maximum annual tuition
 *   - curriculum: STEM | ARTS | SCIENCE
 * 
 * Example: /api/intelligence/schools/search?env=CALM&security=HIGH&rating_min=3.5
 */
router.get('/intelligence/schools/search', IntelligenceController.searchSchools);

// ============================================
// LOCATION INTELLIGENCE
// ============================================

/**
 * POST /api/intelligence/schools/:id/detect-location
 * Auto-detect and classify school location (zone, ASAL status, etc.)
 * 
 * Body:
 * {
 *   latitude: float,
 *   longitude: float,
 *   accuracy_meters: int (optional)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   location: {
 *     latitude, longitude, county, zone_type,
 *     is_asal: boolean,
 *     fees_policy: 'FREE' | 'PAID'
 *   }
 * }
 * 
 * Philosophy: "ASAL zones automatically get FREE fees - no debate"
 */
router.post('/intelligence/schools/:id/detect-location', IntelligenceController.detectLocation);

// ============================================
// ENVIRONMENT INTELLIGENCE
// ============================================

/**
 * POST /api/intelligence/schools/:id/analyze-environment
 * Analyze and score school environment (noise, congestion, facilities)
 * 
 * Body:
 * {
 *   compound_size_acres: float,
 *   has_green_space: boolean,
 *   noise_level: 'LOW' | 'MODERATE' | 'HIGH',
 *   congestion_level: 'LOW' | 'MODERATE' | 'HIGH'
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   analysis: {
 *     environment_score: 0-100,
 *     environment_type: 'CALM' | 'MODERATE' | 'BUSY',
 *     breakdown: { zone_bonus, compound_score, noise_score, congestion_score }
 *   }
 * }
 */
router.post('/intelligence/schools/:id/analyze-environment', IntelligenceController.analyzeEnvironment);

// ============================================
// SECURITY INTELLIGENCE
// ============================================

/**
 * POST /api/intelligence/schools/:id/assess-security
 * Assess and score school security (fence, guards, CCTV, risk zones)
 * 
 * Body:
 * {
 *   has_fence: boolean,
 *   has_guards: boolean,
 *   has_cctv: boolean,
 *   guard_count: int,
 *   fence_condition: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   assessment: {
 *     security_score: 0-100,
 *     security_level: 'HIGH' | 'MEDIUM' | 'LOW',
 *     risk_zone: 'HIGH' | 'MEDIUM' | 'LOW',
 *     recommendations: []
 *   }
 * }
 * 
 * Philosophy: "HIGH-risk zones require guards. Period. -20 penalty if missing."
 */
router.post('/intelligence/schools/:id/assess-security', IntelligenceController.assessSecurity);

// ============================================
// DISTANCE & ACCESSIBILITY
// ============================================

/**
 * GET /api/intelligence/schools/:id/distance
 * Calculate distance and travel time from parent location to school
 * 
 * Query Parameters:
 *   - parent_lat: Parent latitude (required)
 *   - parent_lon: Parent longitude (required)
 * 
 * Response:
 * {
 *   success: true,
 *   distance: {
 *     distance_km: float,
 *     distance_category: 'VERY_CLOSE' | 'CLOSE' | 'MODERATE' | 'FAR' | 'VERY_FAR',
 *     travel_options: {
 *       walking: { time_minutes, time_display, daily_cost, monthly_cost, recommended },
 *       matatu: { ... },
 *       private_car: { ... }
 *     },
 *     recommendation: 'Use matatu - cheapest option'
 *   }
 * }
 * 
 * Formula: Haversine distance = 6371 × acos(...)
 * Costs: walking 0, matatu 3 KES/km, motorcycle 5, car 10
 */
router.get('/intelligence/schools/:id/distance', IntelligenceController.calculateDistance);

// ============================================
// INTELLIGENT RATING
// ============================================

/**
 * POST /api/intelligence/schools/:id/calculate-rating
 * Calculate composite intelligence-based rating for school
 * 
 * Algorithm:
 * overall_score = (
 *   (fee_score * 25%) +
 *   (environment_score * 15%) +
 *   (security_score * 15%) +
 *   (teacher_quality * 20%) +
 *   (curriculum * 15%) +
 *   (accessibility * 10%)
 * ) / 100
 * 
 * Star Rating:
 * 85-100 → ★★★★★ (5.0) - Excellent
 * 70-84 → ★★★★☆ (4.5) - Good
 * 60-69 → ★★★★ (4.0) - Average
 * 50-59 → ★★★☆ (3.5) - Below Average
 * 40-49 → ★★★ (3.0) - Poor
 * 25-39 → ★★☆ (2.5) - Very Poor
 * 15-24 → ★★ (2.0) - Critical
 * <15 → ★ (1.0) - Failing
 * 
 * Response:
 * {
 *   success: true,
 *   rating: {
 *     overall_score: 0-100,
 *     star_rating: 1-5,
 *     confidence_level: 'HIGH' | 'MEDIUM' | 'LOW',
 *     valid_until: 'YYYY-MM-DD',
 *     component_breakdown: {
 *       fee_affordability: { score, weight },
 *       environment_quality: { score, weight },
 *       security_level: { score, weight },
 *       teacher_quality: { score, weight },
 *       curriculum_offerings: { score, weight },
 *       accessibility: { score, weight }
 *     }
 *   }
 * }
 * 
 * Philosophy: "Transparent scoring - every parent sees exactly how we calculated it"
 */
router.post('/intelligence/schools/:id/calculate-rating', IntelligenceController.calculateRating);

// ============================================
// AUDIT & TRANSPARENCY
// ============================================

/**
 * GET /api/intelligence/schools/:id/audit-log
 * Fetch immutable audit trail for a school
 * 
 * Query Parameters:
 *   - limit: Number of events to return (default: 100)
 * 
 * Response:
 * {
 *   success: true,
 *   count: int,
 *   events: [
 *     {
 *       event_type: 'LOCATION_DETECTED' | 'ENVIRONMENT_ANALYZED' | 'SECURITY_ASSESSED' | 'RATING_CALCULATED',
 *       event_description: string,
 *       timestamp: ISO8601,
 *       source: 'AUTO_DETECTION' | 'ADMIN_SUBMISSION' | 'API_CALL',
 *       details: {...}
 *     }
 *   ]
 * }
 * 
 * Philosophy: "So no one can say the system manipulated our rating - it's all here in the log"
 */
router.get('/intelligence/schools/:id/audit-log', IntelligenceController.getAuditLog);

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * POST /api/intelligence/schools/bulk/calculate-ratings
 * Admin endpoint to recalculate ratings for all schools
 * (Typically run once per term)
 */
router.post('/intelligence/schools/bulk/calculate-ratings', async (req, res) => {
    try {
        // This would call the stored procedure RecalculateSchoolRating()
        // for all schools in the database
        return res.json({
            success: true,
            message: 'Rating calculations queued for all schools'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;
