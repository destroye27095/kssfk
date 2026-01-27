// PHASE 5: PERFORMANCE ANALYSIS SERVICE
// Kenya School Fee Platform (KSFP)
// Date: January 27, 2026

const PerformanceTracking = require('../models/PerformanceTracking');
const StaffHierarchy = require('../models/StaffHierarchy');

class PerformanceAnalysisService {
    constructor(db) {
        this.db = db;
        this.performanceTracking = new PerformanceTracking(db);
        this.staffHierarchy = new StaffHierarchy(db);
    }

    // Calculate comprehensive school performance
    async calculateSchoolPerformance(schoolId, trackingPeriod, calculatedBy = 'system') {
        try {
            // Get school data
            const schoolData = await this.getSchoolData(schoolId);

            // Calculate component scores
            const components = await this.calculatePerformanceComponents(schoolId, schoolData);

            // Calculate overall score
            const overallScore = this.calculateOverallScore(components);

            // Calculate expected score and deviation
            const expectedScore = await this.performanceTracking.calculateExpectedScore(schoolId, trackingPeriod);
            const deviation = overallScore - expectedScore;

            // Determine if alert is needed
            const performanceAlert = this.shouldTriggerAlert(deviation, components);
            const improvementRequired = this.requiresImprovement(components);

            // Create performance record
            const performanceData = {
                school_id: schoolId,
                tracking_period: trackingPeriod,
                overall_score: overallScore,
                expected_score: expectedScore,
                performance_deviation: deviation,
                ...components,
                performance_alert: performanceAlert,
                alert_reason: performanceAlert ? this.getAlertReason(deviation, components) : null,
                improvement_required: improvementRequired,
                improvement_areas: improvementRequired ? this.getImprovementAreas(components) : null,
                calculated_by: calculatedBy
            };

            const result = await this.performanceTracking.create(performanceData);

            return {
                ...result,
                components,
                analysis: {
                    overall_score: overallScore,
                    expected_score: expectedScore,
                    deviation: deviation,
                    performance_alert: performanceAlert,
                    improvement_required: improvementRequired
                }
            };
        } catch (error) {
            console.error('Error calculating school performance:', error);
            throw error;
        }
    }

    // Get comprehensive school data for analysis
    async getSchoolData(schoolId) {
        try {
            const schoolQuery = `
                SELECT s.*, sa.institution_type, sa.total_staff_count, sa.academic_staff_count
                FROM schools s
                LEFT JOIN school_administration sa ON s.id = sa.school_id
                WHERE s.id = ?
            `;
            const [schoolRows] = await this.db.execute(schoolQuery, [schoolId]);
            const school = schoolRows[0];

            if (!school) {
                throw new Error('School not found');
            }

            // Get staff data
            const staffSummary = await this.staffHierarchy.getStaffSummary(schoolId);

            // Get transition data
            const transitionQuery = `
                SELECT
                    COUNT(*) as total_transitions,
                    COUNT(CASE WHEN transition_success = TRUE THEN 1 END) as successful_transitions,
                    AVG(CASE WHEN transition_success = TRUE THEN 1 ELSE 0 END) as success_rate
                FROM transition_records
                WHERE school_id = ? AND transition_year = YEAR(CURDATE())
            `;
            const [transitionRows] = await this.db.execute(transitionQuery, [schoolId]);
            const transitions = transitionRows[0];

            return {
                school,
                staff: staffSummary,
                transitions
            };
        } catch (error) {
            console.error('Error getting school data:', error);
            throw error;
        }
    }

    // Calculate individual performance components
    async calculatePerformanceComponents(schoolId, schoolData) {
        const components = {};

        // Academic Performance (40% weight)
        components.academic_performance = await this.calculateAcademicPerformance(schoolId, schoolData);

        // Teacher Performance (30% weight)
        components.teacher_performance = await this.calculateTeacherPerformance(schoolId, schoolData);

        // Infrastructure Score (15% weight)
        components.infrastructure_score = await this.calculateInfrastructureScore(schoolId, schoolData);

        // Student Satisfaction (15% weight)
        components.student_satisfaction = await this.calculateStudentSatisfaction(schoolId, schoolData);

        // Additional metrics
        components.total_teachers = schoolData.staff.total_staff || 0;
        components.qualified_teachers = await this.getQualifiedTeacherCount(schoolId);
        components.teacher_student_ratio = schoolData.school.student_count && schoolData.staff.total_staff ?
            schoolData.school.student_count / schoolData.staff.total_staff : 0;
        components.total_students = schoolData.school.student_count || 0;
        components.graduation_rate = schoolData.transitions.success_rate * 100 || 0;
        components.transition_success_rate = schoolData.transitions.success_rate * 100 || 0;

        return components;
    }

    // Calculate academic performance
    async calculateAcademicPerformance(schoolId, schoolData) {
        try {
            // Base score from transition success
            let score = (schoolData.transitions.success_rate || 0) * 100;

            // Adjust based on teacher qualifications
            const qualifiedTeachers = await this.getQualifiedTeacherCount(schoolId);
            const totalTeachers = schoolData.staff.total_staff || 1;
            const qualificationRate = (qualifiedTeachers / totalTeachers) * 100;

            // Qualification bonus
            if (qualificationRate >= 80) score += 10;
            else if (qualificationRate >= 60) score += 5;
            else if (qualificationRate < 40) score -= 10;

            // Teacher-student ratio bonus
            const ratio = schoolData.school.student_count / totalTeachers;
            if (ratio <= 20) score += 5;
            else if (ratio <= 30) score += 2;
            else if (ratio > 45) score -= 5;

            return Math.max(0, Math.min(100, score));
        } catch (error) {
            console.error('Error calculating academic performance:', error);
            return 75; // Default
        }
    }

    // Calculate teacher performance
    async calculateTeacherPerformance(schoolId, schoolData) {
        try {
            const staffSummary = schoolData.staff;

            // Base score from average performance
            let score = staffSummary.avg_performance_score || 75;

            // Adjust for experience
            if (staffSummary.avg_experience_years >= 10) score += 5;
            else if (staffSummary.avg_experience_years >= 5) score += 2;

            // Adjust for senior staff ratio
            const seniorRatio = staffSummary.senior_staff / staffSummary.total_staff;
            if (seniorRatio >= 0.3) score += 5;
            else if (seniorRatio >= 0.2) score += 2;

            // Adjust for department heads
            if (staffSummary.department_heads > 0) score += 3;

            return Math.max(0, Math.min(100, score));
        } catch (error) {
            console.error('Error calculating teacher performance:', error);
            return 75;
        }
    }

    // Calculate infrastructure score
    async calculateInfrastructureScore(schoolId, schoolData) {
        try {
            // This would integrate with Phase 4 environment/security data
            const infrastructureQuery = `
                SELECT
                    AVG(security_score) as security_score,
                    AVG(environment_score) as environment_score
                FROM school_ratings
                WHERE school_id = ?
                ORDER BY created_at DESC
                LIMIT 5
            `;
            const [infraRows] = await this.db.execute(infrastructureQuery, [schoolId]);
            const infra = infraRows[0];

            if (infra.security_score && infra.environment_score) {
                return (infra.security_score + infra.environment_score) / 2;
            }

            // Default based on institution type
            const defaults = {
                university: 85,
                college: 80,
                vocational: 75,
                senior_school: 78,
                junior_school: 75
            };

            return defaults[schoolData.school.institution_type] || 75;
        } catch (error) {
            console.error('Error calculating infrastructure score:', error);
            return 75;
        }
    }

    // Calculate student satisfaction
    async calculateStudentSatisfaction(schoolId, schoolData) {
        try {
            // This would integrate with survey data in a real system
            // For now, base on transition success and other factors

            let score = 75; // Base score

            // Adjust based on transition success
            const transitionRate = schoolData.transitions.success_rate || 0;
            score += (transitionRate - 0.8) * 50; // Bonus/penalty around 80%

            // Adjust based on teacher performance
            const teacherPerf = await this.calculateTeacherPerformance(schoolId, schoolData);
            score += (teacherPerf - 75) * 0.3; // Small adjustment

            return Math.max(0, Math.min(100, score));
        } catch (error) {
            console.error('Error calculating student satisfaction:', error);
            return 75;
        }
    }

    // Get qualified teacher count
    async getQualifiedTeacherCount(schoolId) {
        try {
            const query = `
                SELECT COUNT(*) as qualified_count
                FROM staff_hierarchy
                WHERE school_id = ? AND is_active = TRUE
                AND (qualification LIKE '%PhD%' OR qualification LIKE '%Masters%' OR qualification LIKE '%Bachelor%')
            `;
            const [rows] = await this.db.execute(query, [schoolId]);
            return rows[0].qualified_count || 0;
        } catch (error) {
            console.error('Error getting qualified teacher count:', error);
            return 0;
        }
    }

    // Calculate overall performance score
    calculateOverallScore(components) {
        // Weighted average based on component scores
        const weights = {
            academic_performance: 0.40,    // 40%
            teacher_performance: 0.30,     // 30%
            infrastructure_score: 0.15,    // 15%
            student_satisfaction: 0.15     // 15%
        };

        let totalScore = 0;
        let totalWeight = 0;

        for (const [component, weight] of Object.entries(weights)) {
            if (components[component] !== undefined) {
                totalScore += components[component] * weight;
                totalWeight += weight;
            }
        }

        return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 75;
    }

    // Determine if performance alert should be triggered
    shouldTriggerAlert(deviation, components) {
        // Trigger alert if:
        // 1. Deviation is more than 15 points below expected
        // 2. Any component score is below 60
        // 3. Overall score is below 65

        if (deviation < -15) return true;
        if (components.academic_performance < 60) return true;
        if (components.teacher_performance < 60) return true;
        if (this.calculateOverallScore(components) < 65) return true;

        return false;
    }

    // Determine if improvement is required
    requiresImprovement(components) {
        // Require improvement if any component is below 70
        return Object.values(components).some(score =>
            typeof score === 'number' && score < 70
        );
    }

    // Get alert reason
    getAlertReason(deviation, components) {
        const reasons = [];

        if (deviation < -15) {
            reasons.push(`Performance ${Math.abs(deviation)} points below expected`);
        }

        if (components.academic_performance < 60) {
            reasons.push('Academic performance below 60');
        }

        if (components.teacher_performance < 60) {
            reasons.push('Teacher performance below 60');
        }

        if (components.infrastructure_score < 60) {
            reasons.push('Infrastructure score below 60');
        }

        if (components.student_satisfaction < 60) {
            reasons.push('Student satisfaction below 60');
        }

        return reasons.join('; ');
    }

    // Get improvement areas
    getImprovementAreas(components) {
        const areas = [];

        if (components.academic_performance < 70) {
            areas.push('Academic performance');
        }

        if (components.teacher_performance < 70) {
            areas.push('Teacher development and training');
        }

        if (components.infrastructure_score < 70) {
            areas.push('Infrastructure and facilities');
        }

        if (components.student_satisfaction < 70) {
            areas.push('Student support and satisfaction');
        }

        return areas.join('; ');
    }

    // Generate performance report
    async generatePerformanceReport(schoolId, reportType = 'comprehensive') {
        try {
            const reports = {
                comprehensive: async () => {
                    const latest = await this.performanceTracking.getBySchoolId(schoolId, 1);
                    const trends = await this.performanceTracking.getPerformanceTrends(schoolId, 12);
                    const schoolData = await this.getSchoolData(schoolId);

                    return {
                        type: 'comprehensive',
                        generated_at: new Date(),
                        school: schoolData.school,
                        latest_performance: latest[0] || null,
                        trends: trends,
                        analysis: await this.analyzePerformanceTrends(trends)
                    };
                },

                trends: async () => {
                    const trends = await this.performanceTracking.getPerformanceTrends(schoolId, 24);
                    return {
                        type: 'trends',
                        generated_at: new Date(),
                        trends: trends,
                        analysis: await this.analyzePerformanceTrends(trends)
                    };
                },

                alerts: async () => {
                    const alerts = await this.performanceTracking.getPerformanceAlerts();
                    const schoolAlerts = alerts.filter(alert => alert.school_id === schoolId);

                    return {
                        type: 'alerts',
                        generated_at: new Date(),
                        alerts: schoolAlerts,
                        recommendations: await this.generateAlertRecommendations(schoolAlerts)
                    };
                }
            };

            if (!reports[reportType]) {
                throw new Error(`Unknown report type: ${reportType}`);
            }

            return await reports[reportType]();
        } catch (error) {
            console.error('Error generating performance report:', error);
            throw error;
        }
    }

    // Analyze performance trends
    async analyzePerformanceTrends(trends) {
        if (trends.length < 2) {
            return { message: 'Insufficient data for trend analysis' };
        }

        const latest = trends[trends.length - 1];
        const previous = trends[trends.length - 2];

        const scoreChange = latest.overall_score - previous.overall_score;
        const deviationChange = latest.performance_deviation - previous.performance_deviation;

        let trend = 'stable';
        if (scoreChange > 5) trend = 'improving';
        else if (scoreChange < -5) trend = 'declining';

        return {
            trend: trend,
            score_change: scoreChange,
            deviation_change: deviationChange,
            latest_score: latest.overall_score,
            latest_deviation: latest.performance_deviation,
            periods_analyzed: trends.length,
            recommendation: this.getTrendRecommendation(trend, latest)
        };
    }

    // Get trend-based recommendation
    getTrendRecommendation(trend, latestPerformance) {
        switch (trend) {
            case 'improving':
                return 'Continue current improvement strategies';
            case 'declining':
                return 'Review recent changes and implement corrective actions';
            case 'stable':
                if (latestPerformance.overall_score >= 80) {
                    return 'Maintain high performance standards';
                } else {
                    return 'Implement improvement initiatives';
                }
            default:
                return 'Monitor performance closely';
        }
    }

    // Generate alert recommendations
    async generateAlertRecommendations(alerts) {
        const recommendations = [];

        for (const alert of alerts) {
            if (alert.performance_deviation < -15) {
                recommendations.push({
                    alert_id: alert.id,
                    priority: 'high',
                    issue: 'Significant performance decline',
                    actions: [
                        'Conduct comprehensive performance review',
                        'Identify root causes of decline',
                        'Develop improvement action plan',
                        'Schedule follow-up monitoring'
                    ]
                });
            }

            if (alert.academic_performance < 60) {
                recommendations.push({
                    alert_id: alert.id,
                    priority: 'high',
                    issue: 'Low academic performance',
                    actions: [
                        'Review curriculum delivery',
                        'Assess teacher training needs',
                        'Implement academic support programs',
                        'Monitor student progress closely'
                    ]
                });
            }

            if (alert.teacher_performance < 60) {
                recommendations.push({
                    alert_id: alert.id,
                    priority: 'medium',
                    issue: 'Teacher performance concerns',
                    actions: [
                        'Conduct teacher performance evaluations',
                        'Provide professional development opportunities',
                        'Review teacher workload and support',
                        'Implement mentorship programs'
                    ]
                });
            }
        }

        return recommendations;
    }

    // Bulk performance calculation for multiple schools
    async bulkCalculatePerformance(schoolIds, trackingPeriod, calculatedBy = 'system') {
        try {
            const results = {
                successful: 0,
                failed: 0,
                errors: []
            };

            for (const schoolId of schoolIds) {
                try {
                    await this.calculateSchoolPerformance(schoolId, trackingPeriod, calculatedBy);
                    results.successful++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        school_id: schoolId,
                        error: error.message
                    });
                }
            }

            return {
                ...results,
                message: `Calculated performance for ${results.successful} schools successfully`
            };
        } catch (error) {
            console.error('Error in bulk performance calculation:', error);
            throw error;
        }
    }

    // Get performance benchmarks
    async getPerformanceBenchmarks(institutionType = null) {
        try {
            let query = `
                SELECT
                    sa.institution_type,
                    AVG(pt.overall_score) as avg_score,
                    MIN(pt.overall_score) as min_score,
                    MAX(pt.overall_score) as max_score,
                    COUNT(*) as school_count
                FROM performance_tracking pt
                JOIN school_administration sa ON pt.school_id = sa.school_id
                WHERE pt.tracking_period = (
                    SELECT MAX(tracking_period)
                    FROM performance_tracking
                )
            `;

            const params = [];
            if (institutionType) {
                query += ' AND sa.institution_type = ?';
                params.push(institutionType);
            }

            query += ' GROUP BY sa.institution_type';

            const [rows] = await this.db.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error getting performance benchmarks:', error);
            throw error;
        }
    }
}

module.exports = PerformanceAnalysisService;