/**
 * Intelligence Controller
 * Handles all school intelligence features: location detection, environment analysis,
 * security assessment, distance calculation, teacher stats, courses, and composite ratings
 * 
 * Philosophy: "Auto-detect conditions, make transparent scoring, maintain immutable audits"
 */

const fs = require('fs');
const path = require('path');
const LocationService = require('../services/LocationService');
const EnvironmentService = require('../services/EnvironmentService');
const DistanceService = require('../services/DistanceService');
const SecurityService = require('../services/SecurityService');
const ScoringEngine = require('../services/ScoringEngine');
const TeacherStats = require('../models/TeacherStats');
const Courses = require('../models/Courses');

class IntelligenceController {
    /**
     * Get complete school profile with all intelligence data
     * GET /api/schools/:id/profile
     */
    static async getSchoolProfile(req, res) {
        try {
            const { id } = req.params;

            // Fetch school from database
            const school = await req.app.locals.db.get(
                `SELECT * FROM schools WHERE id = ?`,
                [id]
            );

            if (!school) {
                return res.status(404).json({
                    success: false,
                    error: 'School not found'
                });
            }

            // Fetch all related intelligence data
            const location = await req.app.locals.db.get(
                `SELECT * FROM school_locations WHERE school_id = ?`,
                [id]
            );

            const environment = await req.app.locals.db.get(
                `SELECT * FROM school_environment WHERE school_id = ?`,
                [id]
            );

            const security = await req.app.locals.db.get(
                `SELECT * FROM school_security WHERE school_id = ?`,
                [id]
            );

            const rating = await req.app.locals.db.get(
                `SELECT * FROM school_ratings WHERE school_id = ?`,
                [id]
            );

            const teachers = await req.app.locals.db.get(
                `SELECT * FROM teacher_statistics WHERE school_id = ?`,
                [id]
            );

            const courses = await req.app.locals.db.all(
                `SELECT * FROM school_courses WHERE school_id = ?`,
                [id]
            );

            const accessibility = await req.app.locals.db.get(
                `SELECT * FROM school_accessibility WHERE school_id = ?`,
                [id]
            );

            // Calculate distance from parent location (if provided)
            let distanceData = {};
            if (req.query.parent_lat && req.query.parent_lon) {
                const distance = DistanceService.calculateDistance(
                    parseFloat(req.query.parent_lat),
                    parseFloat(req.query.parent_lon),
                    location?.latitude,
                    location?.longitude
                );

                distanceData = {
                    distance_km: distance,
                    travel_time: DistanceService.estimateTravelTime(distance, 'matatu'),
                    transport_cost: DistanceService.estimateTransportCost(distance, 'matatu', 5)
                };
            }

            // Compose complete profile
            const profile = {
                id: school.id,
                name: school.school_name,
                county: school.county,
                zone_type: location?.zone_type || 'URBAN',
                latitude: location?.latitude,
                longitude: location?.longitude,
                fees: {
                    annual_tuition: school.annual_tuition,
                    fees_policy: location?.fees_policy || 'PAID'
                },
                student_count: school.student_count,
                teacher_stats: {
                    total_teachers: teachers?.total_teachers || 0,
                    qualified_teachers: teachers?.qualified_teachers || 0,
                    stem_percentage: teachers?.stem_percentage || 0,
                    science_percentage: teachers?.science_percentage || 0,
                    arts_percentage: teachers?.arts_percentage || 0
                },
                student_teacher_ratio: teachers?.student_teacher_ratio || 0,
                teacher_quality_score: teachers?.quality_score || 0,
                environment_score: environment?.environment_score || 0,
                environment_type: environment?.environment_type || 'MODERATE',
                environment_description: EnvironmentService.getEnvironmentDescription(
                    environment?.environment_type
                ),
                compound_size_acres: environment?.compound_size_acres || 0,
                has_green_space: environment?.has_green_space === 1,
                noise_level: environment?.noise_level || 'MODERATE',
                security_score: security?.security_score || 0,
                security_level: security?.security_level || 'MEDIUM',
                risk_zone: security?.risk_zone || 'MEDIUM',
                has_fence: security?.has_fence === 1,
                has_guards: security?.has_guards === 1,
                has_cctv: security?.has_cctv === 1,
                distance_km: distanceData.distance_km || accessibility?.average_distance_km || 0,
                travel_time: distanceData.travel_time || { time_display: '-- min' },
                transport_cost: distanceData.transport_cost || { monthly_cost: 0 },
                courses: courses || [],
                rating: rating ? {
                    overall_score: rating.overall_score,
                    star_rating: rating.star_rating,
                    confidence_level: rating.confidence_level,
                    valid_until: rating.valid_until,
                    component_breakdown: JSON.parse(rating.component_breakdown || '{}')
                } : {
                    overall_score: 0,
                    star_rating: 0,
                    confidence_level: 'LOW',
                    valid_until: new Date().toISOString().split('T')[0],
                    component_breakdown: {}
                },
                phone: school.phone || '--',
                email: school.email || '--',
                website: school.website || '--'
            };

            return res.json({
                success: true,
                data: profile
            });

        } catch (error) {
            console.error('Error fetching school profile:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Calculate or recalculate school rating
     * POST /api/intelligence/schools/:id/calculate-rating
     */
    static async calculateRating(req, res) {
        try {
            const { id } = req.params;

            // Fetch all school data
            const school = await req.app.locals.db.get(
                `SELECT * FROM schools WHERE id = ?`,
                [id]
            );

            if (!school) {
                return res.status(404).json({
                    success: false,
                    error: 'School not found'
                });
            }

            // Fetch intelligence data
            const location = await req.app.locals.db.get(
                `SELECT * FROM school_locations WHERE school_id = ?`, [id]
            );
            const environment = await req.app.locals.db.get(
                `SELECT * FROM school_environment WHERE school_id = ?`, [id]
            );
            const security = await req.app.locals.db.get(
                `SELECT * FROM school_security WHERE school_id = ?`, [id]
            );
            const teachers = await req.app.locals.db.get(
                `SELECT * FROM teacher_statistics WHERE school_id = ?`, [id]
            );
            const courses = await req.app.locals.db.all(
                `SELECT * FROM school_courses WHERE school_id = ?`, [id]
            );
            const accessibility = await req.app.locals.db.get(
                `SELECT * FROM school_accessibility WHERE school_id = ?`, [id]
            );

            // Compose school data for scoring
            const schoolData = {
                id,
                name: school.school_name,
                fees: {
                    annual_tuition: school.annual_tuition,
                    monthly_average: school.annual_tuition / 12
                },
                environment_score: environment?.environment_score || 50,
                environment_type: environment?.environment_type || 'MODERATE',
                security_score: security?.security_score || 50,
                security_level: security?.security_level || 'MEDIUM',
                teacher_quality_score: teachers?.quality_score || 50,
                curriculum_courses: courses || [],
                distance_km: accessibility?.average_distance_km || 10,
                student_count: school.student_count || 400,
                teacher_count: teachers?.total_teachers || 20,
                is_asal: location?.is_asal === 1,
                county: school.county,
                has_fence: security?.has_fence === 1,
                has_guards: security?.has_guards === 1,
                has_cctv: security?.has_cctv === 1
            };

            // Calculate composite score
            const rating = ScoringEngine.calculateCompositeScore(schoolData);

            // Save rating to database
            const validUntil = ScoringEngine.getValidUntil();
            await req.app.locals.db.run(
                `INSERT OR REPLACE INTO school_ratings 
                (school_id, overall_score, star_rating, confidence_level, valid_until, 
                 component_breakdown, calculated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    rating.overall_score,
                    rating.star_rating,
                    rating.confidence_level,
                    validUntil,
                    JSON.stringify(rating.component_breakdown),
                    new Date().toISOString()
                ]
            );

            // Log rating calculation
            ScoringEngine.logRating(id, {
                overall_score: rating.overall_score,
                star_rating: rating.star_rating,
                confidence_level: rating.confidence_level,
                components: rating.component_breakdown
            });

            return res.json({
                success: true,
                message: `School rating calculated successfully`,
                rating
            });

        } catch (error) {
            console.error('Error calculating rating:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Detect and update school location/zone
     * POST /api/intelligence/schools/:id/detect-location
     */
    static async detectLocation(req, res) {
        try {
            const { id } = req.params;
            const { latitude, longitude } = req.body;

            if (!latitude || !longitude) {
                return res.status(400).json({
                    success: false,
                    error: 'Latitude and longitude required'
                });
            }

            // Validate GPS
            const validation = LocationService.validateGPS(latitude, longitude);
            if (!validation.valid) {
                return res.status(400).json({
                    success: false,
                    error: validation.errors.join(', ')
                });
            }

            // Detect zone
            const locationData = {
                latitude,
                longitude,
                accuracy_meters: req.body.accuracy_meters || 50
            };

            const detection = LocationService.detectZoneType(locationData);

            // Fetch county info
            const zoneInfo = LocationService.reverseGeocode(latitude, longitude);

            // Update/insert location record
            await req.app.locals.db.run(
                `INSERT OR REPLACE INTO school_locations 
                (school_id, latitude, longitude, county, zone_type, is_asal, fees_policy, 
                 accuracy_meters, detected_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    latitude,
                    longitude,
                    zoneInfo.county,
                    detection.zone_type,
                    detection.is_asal ? 1 : 0,
                    detection.fees_policy,
                    locationData.accuracy_meters,
                    new Date().toISOString()
                ]
            );

            // Log detection
            LocationService.logLocationDetection(id, detection);

            return res.json({
                success: true,
                message: 'Location detected successfully',
                location: {
                    latitude,
                    longitude,
                    county: zoneInfo.county,
                    zone_type: detection.zone_type,
                    is_asal: detection.is_asal,
                    fees_policy: detection.fees_policy
                }
            });

        } catch (error) {
            console.error('Error detecting location:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Analyze and update school environment
     * POST /api/intelligence/schools/:id/analyze-environment
     */
    static async analyzeEnvironment(req, res) {
        try {
            const { id } = req.params;

            // Fetch school data
            const school = await req.app.locals.db.get(
                `SELECT * FROM schools WHERE id = ?`, [id]
            );
            const location = await req.app.locals.db.get(
                `SELECT * FROM school_locations WHERE school_id = ?`, [id]
            );

            const schoolData = {
                zone_type: location?.zone_type || 'URBAN',
                student_count: school.student_count || 400,
                compound_size_acres: req.body.compound_size_acres || 2,
                has_green_space: req.body.has_green_space === true,
                noise_level: req.body.noise_level || 'MODERATE',
                congestion_level: req.body.congestion_level || 'MODERATE'
            };

            const analysis = EnvironmentService.analyzeEnvironment(schoolData);

            // Save to database
            await req.app.locals.db.run(
                `INSERT OR REPLACE INTO school_environment 
                (school_id, environment_score, environment_type, compound_size_acres, 
                 has_green_space, noise_level, congestion_level, analyzed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    analysis.environment_score,
                    analysis.environment_type,
                    schoolData.compound_size_acres,
                    schoolData.has_green_space ? 1 : 0,
                    schoolData.noise_level,
                    schoolData.congestion_level,
                    new Date().toISOString()
                ]
            );

            // Log analysis
            EnvironmentService.logEnvironmentAnalysis(id, analysis);

            return res.json({
                success: true,
                message: 'Environment analyzed successfully',
                analysis
            });

        } catch (error) {
            console.error('Error analyzing environment:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Assess and update school security
     * POST /api/intelligence/schools/:id/assess-security
     */
    static async assessSecurity(req, res) {
        try {
            const { id } = req.params;

            // Fetch school location for risk zone
            const location = await req.app.locals.db.get(
                `SELECT county FROM school_locations WHERE school_id = ?`, [id]
            );

            const securityData = {
                county: location?.county || 'NAIROBI',
                has_fence: req.body.has_fence === true,
                has_guards: req.body.has_guards === true,
                has_cctv: req.body.has_cctv === true,
                guard_count: req.body.guard_count || 0,
                fence_condition: req.body.fence_condition || 'GOOD'
            };

            const assessment = SecurityService.calculateSecurityScore(securityData);

            // Save to database
            await req.app.locals.db.run(
                `INSERT OR REPLACE INTO school_security 
                (school_id, security_score, security_level, risk_zone, 
                 has_fence, has_guards, has_cctv, guard_count, assessed_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id,
                    assessment.security_score,
                    assessment.security_level,
                    assessment.risk_zone,
                    securityData.has_fence ? 1 : 0,
                    securityData.has_guards ? 1 : 0,
                    securityData.has_cctv ? 1 : 0,
                    securityData.guard_count,
                    new Date().toISOString()
                ]
            );

            // Log assessment
            SecurityService.logSecurityAssessment(id, assessment);

            return res.json({
                success: true,
                message: 'Security assessed successfully',
                assessment
            });

        } catch (error) {
            console.error('Error assessing security:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Calculate distance from parent location to school
     * GET /api/intelligence/schools/:id/distance?parent_lat=X&parent_lon=Y
     */
    static async calculateDistance(req, res) {
        try {
            const { id } = req.params;
            const { parent_lat, parent_lon } = req.query;

            if (!parent_lat || !parent_lon) {
                return res.status(400).json({
                    success: false,
                    error: 'Parent latitude and longitude required'
                });
            }

            // Fetch school location
            const location = await req.app.locals.db.get(
                `SELECT latitude, longitude FROM school_locations WHERE school_id = ?`, [id]
            );

            if (!location) {
                return res.status(404).json({
                    success: false,
                    error: 'School location not found'
                });
            }

            const distance = DistanceService.calculateDistance(
                parseFloat(parent_lat),
                parseFloat(parent_lon),
                location.latitude,
                location.longitude
            );

            const walkingTime = DistanceService.estimateTravelTime(distance, 'walking');
            const matatuTime = DistanceService.estimateTravelTime(distance, 'matatu');
            const carTime = DistanceService.estimateTravelTime(distance, 'private_car');

            const walkingCost = DistanceService.estimateTransportCost(distance, 'walking', 5);
            const matatiuCost = DistanceService.estimateTransportCost(distance, 'matatu', 5);
            const carCost = DistanceService.estimateTransportCost(distance, 'private_car', 5);

            return res.json({
                success: true,
                distance: {
                    distance_km: parseFloat(distance.toFixed(2)),
                    distance_category: DistanceService.getDistanceCategory(distance),
                    distance_description: DistanceService.getDistanceDescription(distance),
                    travel_options: {
                        walking: {
                            time_minutes: walkingTime.time_minutes,
                            time_display: walkingTime.time_display,
                            daily_cost: walkingCost.daily_cost,
                            monthly_cost: walkingCost.monthly_cost,
                            recommended: distance < 2
                        },
                        matatu: {
                            time_minutes: matatuTime.time_minutes,
                            time_display: matatuTime.time_display,
                            daily_cost: matatiuCost.daily_cost,
                            monthly_cost: matatiuCost.monthly_cost,
                            recommended: distance >= 2 && distance <= 20
                        },
                        private_car: {
                            time_minutes: carTime.time_minutes,
                            time_display: carTime.time_display,
                            daily_cost: carCost.daily_cost,
                            monthly_cost: carCost.monthly_cost,
                            recommended: distance > 20
                        }
                    },
                    recommendation: DistanceService.getTravelRecommendation(distance)
                }
            });

        } catch (error) {
            console.error('Error calculating distance:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Filter/search schools
     * GET /api/intelligence/schools/search?env=CALM&security=HIGH&rating_min=3.5&distance_max=20
     */
    static async searchSchools(req, res) {
        try {
            const {
                env,
                security,
                rating_min = 0,
                distance_max = 50,
                county,
                fees_max,
                curriculum
            } = req.query;

            let query = `
                SELECT s.*, 
                       sr.overall_score, sr.star_rating,
                       sl.zone_type, sl.county, sl.is_asal,
                       se.environment_score, se.environment_type,
                       ss.security_score, ss.security_level,
                       ts.quality_score, ts.student_teacher_ratio
                FROM schools s
                LEFT JOIN school_ratings sr ON s.id = sr.school_id
                LEFT JOIN school_locations sl ON s.id = sl.school_id
                LEFT JOIN school_environment se ON s.id = se.school_id
                LEFT JOIN school_security ss ON s.id = ss.school_id
                LEFT JOIN teacher_statistics ts ON s.id = ts.school_id
                WHERE 1=1
            `;
            const params = [];

            if (rating_min) {
                query += ` AND sr.star_rating >= ?`;
                params.push(rating_min);
            }

            if (env) {
                query += ` AND se.environment_type = ?`;
                params.push(env);
            }

            if (security) {
                query += ` AND ss.security_level = ?`;
                params.push(security);
            }

            if (county) {
                query += ` AND sl.county = ?`;
                params.push(county);
            }

            if (fees_max) {
                query += ` AND s.annual_tuition <= ?`;
                params.push(fees_max);
            }

            query += ` ORDER BY sr.star_rating DESC`;

            const schools = await req.app.locals.db.all(query, params);

            return res.json({
                success: true,
                count: schools.length,
                schools: schools.map(s => ({
                    id: s.id,
                    name: s.school_name,
                    county: s.county,
                    zone_type: s.zone_type,
                    fees: s.annual_tuition,
                    environment_type: s.environment_type,
                    security_level: s.security_level,
                    star_rating: s.star_rating || 0,
                    teacher_ratio: s.student_teacher_ratio
                }))
            });

        } catch (error) {
            console.error('Error searching schools:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get audit log for a school
     * GET /api/intelligence/schools/:id/audit-log
     */
    static async getAuditLog(req, res) {
        try {
            const { id } = req.params;
            const { limit = 100 } = req.query;

            const events = await req.app.locals.db.all(
                `SELECT * FROM audit_logs 
                 WHERE school_id = ? 
                 ORDER BY event_timestamp DESC 
                 LIMIT ?`,
                [id, parseInt(limit)]
            );

            return res.json({
                success: true,
                count: events.length,
                events: events.map(e => ({
                    event_type: e.event_type,
                    event_description: e.event_description,
                    timestamp: e.event_timestamp,
                    source: e.data_source,
                    details: JSON.parse(e.event_details || '{}')
                }))
            });

        } catch (error) {
            console.error('Error fetching audit log:', error);
            return res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}

module.exports = IntelligenceController;
