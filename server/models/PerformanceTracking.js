// PHASE 5: PERFORMANCE TRACKING MODEL
// Kenya School Fee Platform (KSFP)
// Date: January 27, 2026

const fs = require('fs').promises;
const path = require('path');

class PerformanceTracking {
    constructor(db) {
        this.db = db;
        this.dataFile = path.join(__dirname, '../../data/performance_tracking.json');
        this.initializeDataFile();
    }

    async initializeDataFile() {
        try {
            await fs.access(this.dataFile);
        } catch {
            await fs.writeFile(this.dataFile, JSON.stringify([], null, 2));
        }
    }

    // Create performance tracking record
    async create(performanceData) {
        try {
            const {
                school_id,
                tracking_period,
                overall_score,
                expected_score,
                performance_deviation,
                academic_performance = 0.00,
                teacher_performance = 0.00,
                infrastructure_score = 0.00,
                student_satisfaction = 0.00,
                total_teachers = 0,
                qualified_teachers = 0,
                teacher_student_ratio = 0.00,
                teacher_turnover_rate = 0.00,
                total_students = 0,
                student_teacher_ratio = 0.00,
                graduation_rate = 0.00,
                transition_success_rate = 0.00,
                performance_alert = false,
                alert_reason = null,
                improvement_required = false,
                improvement_areas = null,
                calculated_by
            } = performanceData;

            // Calculate performance deviation if not provided
            const actualDeviation = performance_deviation !== undefined ?
                performance_deviation : (overall_score - (expected_score || 0));

            const query = `
                INSERT INTO performance_tracking (
                    school_id, tracking_period, overall_score, expected_score, performance_deviation,
                    academic_performance, teacher_performance, infrastructure_score, student_satisfaction,
                    total_teachers, qualified_teachers, teacher_student_ratio, teacher_turnover_rate,
                    total_students, student_teacher_ratio, graduation_rate, transition_success_rate,
                    performance_alert, alert_reason, improvement_required, improvement_areas, calculated_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await this.db.execute(query, [
                school_id, tracking_period, overall_score, expected_score, actualDeviation,
                academic_performance, teacher_performance, infrastructure_score, student_satisfaction,
                total_teachers, qualified_teachers, teacher_student_ratio, teacher_turnover_rate,
                total_students, student_teacher_ratio, graduation_rate, transition_success_rate,
                performance_alert, alert_reason, improvement_required, improvement_areas, calculated_by
            ]);

            return {
                id: result.insertId,
                success: true,
                message: 'Performance tracking record created successfully'
            };
        } catch (error) {
            console.error('Error creating performance tracking record:', error);
            throw error;
        }
    }

    // Get performance by school and period
    async getBySchoolAndPeriod(schoolId, trackingPeriod) {
        try {
            const query = `
                SELECT pt.*, s.name as school_name, s.location as school_location
                FROM performance_tracking pt
                JOIN schools s ON pt.school_id = s.id
                WHERE pt.school_id = ? AND pt.tracking_period = ?
            `;
            const [rows] = await this.db.execute(query, [schoolId, trackingPeriod]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error getting performance by school and period:', error);
            throw error;
        }
    }

    // Get all performance records for a school
    async getBySchoolId(schoolId, limit = 10) {
        try {
            const query = `
                SELECT * FROM performance_tracking
                WHERE school_id = ?
                ORDER BY tracking_period DESC
                LIMIT ?
            `;
            const [rows] = await this.db.execute(query, [schoolId, limit]);
            return rows;
        } catch (error) {
            console.error('Error getting performance by school:', error);
            throw error;
        }
    }

    // Get latest performance for all schools
    async getLatestForAllSchools() {
        try {
            const query = `
                SELECT
                    pt.*,
                    s.name as school_name,
                    s.location as school_location,
                    s.level as school_level
                FROM performance_tracking pt
                JOIN schools s ON pt.school_id = s.id
                WHERE pt.tracking_period = (
                    SELECT MAX(tracking_period)
                    FROM performance_tracking pt2
                    WHERE pt2.school_id = pt.school_id
                )
                ORDER BY pt.overall_score DESC
            `;
            const [rows] = await this.db.execute(query);
            return rows;
        } catch (error) {
            console.error('Error getting latest performance for all schools:', error);
            throw error;
        }
    }

    // Calculate performance deviation
    async calculateDeviation(schoolId, trackingPeriod) {
        try {
            // Get current performance
            const current = await this.getBySchoolAndPeriod(schoolId, trackingPeriod);
            if (!current) {
                throw new Error('Performance record not found');
            }

            // Calculate expected score based on historical data and school type
            const expectedScore = await this.calculateExpectedScore(schoolId, trackingPeriod);
            const deviation = current.overall_score - expectedScore;

            // Update the record
            const query = `
                UPDATE performance_tracking
                SET expected_score = ?, performance_deviation = ?, updated_at = CURRENT_TIMESTAMP
                WHERE school_id = ? AND tracking_period = ?
            `;

            await this.db.execute(query, [expectedScore, deviation, schoolId, trackingPeriod]);

            return {
                school_id: schoolId,
                tracking_period: trackingPeriod,
                actual_score: current.overall_score,
                expected_score: expectedScore,
                deviation: deviation,
                success: true
            };
        } catch (error) {
            console.error('Error calculating performance deviation:', error);
            throw error;
        }
    }

    // Calculate expected score based on historical data
    async calculateExpectedScore(schoolId, currentPeriod) {
        try {
            // Get historical performance (last 5 periods)
            const query = `
                SELECT overall_score
                FROM performance_tracking
                WHERE school_id = ?
                ORDER BY tracking_period DESC
                LIMIT 5
            `;
            const [rows] = await this.db.execute(query, [schoolId]);

            if (rows.length === 0) {
                // No historical data, use school type average
                return await this.getSchoolTypeAverage(schoolId);
            }

            // Calculate weighted average (more recent = higher weight)
            let totalScore = 0;
            let totalWeight = 0;

            rows.forEach((row, index) => {
                const weight = rows.length - index; // Recent = higher weight
                totalScore += row.overall_score * weight;
                totalWeight += weight;
            });

            const historicalAverage = totalScore / totalWeight;

            // Expected score is historical average + 2% improvement trend
            return Math.min(100, historicalAverage * 1.02);
        } catch (error) {
            console.error('Error calculating expected score:', error);
            return 75.0; // Safe default
        }
    }

    // Get average performance by school type
    async getSchoolTypeAverage(schoolId) {
        try {
            const query = `
                SELECT AVG(pt.overall_score) as avg_score
                FROM performance_tracking pt
                JOIN schools s ON pt.school_id = s.id
                WHERE s.level = (SELECT level FROM schools WHERE id = ?)
                AND pt.tracking_period = (
                    SELECT MAX(tracking_period)
                    FROM performance_tracking pt2
                    WHERE pt2.school_id = pt.school_id
                )
            `;
            const [rows] = await this.db.execute(query, [schoolId]);
            return rows[0]?.avg_score || 75.0;
        } catch (error) {
            console.error('Error getting school type average:', error);
            return 75.0;
        }
    }

    // Get performance trends for a school
    async getPerformanceTrends(schoolId, periods = 12) {
        try {
            const query = `
                SELECT
                    tracking_period,
                    overall_score,
                    performance_deviation,
                    academic_performance,
                    teacher_performance,
                    total_teachers,
                    total_students,
                    performance_alert,
                    alert_reason
                FROM performance_tracking
                WHERE school_id = ?
                ORDER BY tracking_period DESC
                LIMIT ?
            `;
            const [rows] = await this.db.execute(query, [schoolId, periods]);
            return rows.reverse(); // Return in chronological order
        } catch (error) {
            console.error('Error getting performance trends:', error);
            throw error;
        }
    }

    // Get schools with performance alerts
    async getPerformanceAlerts() {
        try {
            const query = `
                SELECT
                    pt.*,
                    s.name as school_name,
                    s.location as school_location,
                    s.level as school_level
                FROM performance_tracking pt
                JOIN schools s ON pt.school_id = s.id
                WHERE pt.performance_alert = TRUE
                AND pt.tracking_period = (
                    SELECT MAX(tracking_period)
                    FROM performance_tracking pt2
                    WHERE pt2.school_id = pt.school_id
                )
                ORDER BY pt.performance_deviation DESC
            `;
            const [rows] = await this.db.execute(query);
            return rows;
        } catch (error) {
            console.error('Error getting performance alerts:', error);
            throw error;
        }
    }

    // Update performance alert status
    async updateAlertStatus(schoolId, trackingPeriod, alertData) {
        try {
            const {
                performance_alert,
                alert_reason,
                improvement_required,
                improvement_areas
            } = alertData;

            const query = `
                UPDATE performance_tracking
                SET performance_alert = ?, alert_reason = ?, improvement_required = ?,
                    improvement_areas = ?, updated_at = CURRENT_TIMESTAMP
                WHERE school_id = ? AND tracking_period = ?
            `;

            const [result] = await this.db.execute(query, [
                performance_alert, alert_reason, improvement_required,
                improvement_areas, schoolId, trackingPeriod
            ]);

            return {
                success: result.affectedRows > 0,
                message: 'Performance alert status updated successfully'
            };
        } catch (error) {
            console.error('Error updating alert status:', error);
            throw error;
        }
    }

    // Auto-calculate performance metrics from school data
    async autoCalculatePerformance(schoolId, trackingPeriod, calculatedBy = 'system') {
        try {
            // Get school data
            const schoolQuery = `
                SELECT s.*, sa.total_staff_count, sa.academic_staff_count
                FROM schools s
                LEFT JOIN school_administration sa ON s.id = sa.school_id
                WHERE s.id = ?
            `;
            const [schoolRows] = await this.db.execute(schoolQuery, [schoolId]);
            const school = schoolRows[0];

            if (!school) {
                throw new Error('School not found');
            }

            // Get teacher data from staff hierarchy
            const teacherQuery = `
                SELECT
                    COUNT(*) as total_teachers,
                    COUNT(CASE WHEN qualification LIKE '%PhD%' OR qualification LIKE '%Masters%' THEN 1 END) as qualified_teachers,
                    AVG(performance_score) as avg_teacher_performance,
                    AVG(years_experience) as avg_experience
                FROM staff_hierarchy
                WHERE school_id = ? AND is_active = TRUE
                AND department NOT IN ('Administration', 'Support', 'Maintenance')
            `;
            const [teacherRows] = await this.db.execute(teacherQuery, [schoolId]);
            const teacherData = teacherRows[0];

            // Get transition data
            const transitionQuery = `
                SELECT
                    COUNT(*) as total_transitions,
                    COUNT(CASE WHEN transition_success = TRUE THEN 1 END) as successful_transitions
                FROM transition_records
                WHERE school_id = ? AND transition_year = ?
            `;
            const currentYear = new Date().getFullYear();
            const [transitionRows] = await this.db.execute(transitionQuery, [schoolId, currentYear]);
            const transitionData = transitionRows[0];

            // Calculate metrics
            const totalTeachers = teacherData.total_teachers || school.academic_staff_count || 0;
            const qualifiedTeachers = teacherData.qualified_teachers || 0;
            const totalStudents = school.student_count || 100; // Default fallback

            const teacherStudentRatio = totalStudents > 0 ? totalTeachers / totalStudents : 0;
            const qualificationRate = totalTeachers > 0 ? (qualifiedTeachers / totalTeachers) * 100 : 0;
            const transitionSuccessRate = transitionData.total_transitions > 0 ?
                (transitionData.successful_transitions / transitionData.total_transitions) * 100 : 85; // Default

            // Calculate component scores
            const teacherPerformance = Math.min(100, qualificationRate * 0.4 + (teacherData.avg_teacher_performance || 75) * 0.6);
            const academicPerformance = Math.min(100, transitionSuccessRate * 0.7 + qualificationRate * 0.3);
            const infrastructureScore = 75; // Placeholder - would need infrastructure data
            const studentSatisfaction = 80; // Placeholder - would need survey data

            // Calculate overall score (weighted average)
            const overallScore = Math.round(
                teacherPerformance * 0.4 +
                academicPerformance * 0.35 +
                infrastructureScore * 0.15 +
                studentSatisfaction * 0.1
            );

            // Create performance record
            const performanceData = {
                school_id: schoolId,
                tracking_period: trackingPeriod,
                overall_score: overallScore,
                academic_performance: academicPerformance,
                teacher_performance: teacherPerformance,
                infrastructure_score: infrastructureScore,
                student_satisfaction: studentSatisfaction,
                total_teachers: totalTeachers,
                qualified_teachers: qualifiedTeachers,
                teacher_student_ratio: teacherStudentRatio,
                total_students: totalStudents,
                graduation_rate: transitionSuccessRate,
                transition_success_rate: transitionSuccessRate,
                calculated_by: calculatedBy
            };

            // Calculate deviation
            const deviationResult = await this.calculateDeviation(schoolId, trackingPeriod);

            return {
                ...performanceData,
                expected_score: deviationResult.expected_score,
                performance_deviation: deviationResult.deviation,
                success: true,
                message: 'Performance auto-calculated successfully'
            };
        } catch (error) {
            console.error('Error auto-calculating performance:', error);
            throw error;
        }
    }

    // Get performance statistics across all schools
    async getPerformanceStatistics() {
        try {
            const query = `
                SELECT
                    COUNT(DISTINCT school_id) as total_schools,
                    AVG(overall_score) as avg_overall_score,
                    MIN(overall_score) as min_score,
                    MAX(overall_score) as max_score,
                    AVG(performance_deviation) as avg_deviation,
                    COUNT(CASE WHEN performance_alert = TRUE THEN 1 END) as schools_with_alerts,
                    AVG(total_teachers) as avg_teachers_per_school,
                    AVG(total_students) as avg_students_per_school,
                    AVG(teacher_student_ratio) as avg_teacher_student_ratio
                FROM performance_tracking
                WHERE tracking_period = (
                    SELECT MAX(tracking_period)
                    FROM performance_tracking
                )
            `;
            const [rows] = await this.db.execute(query);
            return rows[0] || {};
        } catch (error) {
            console.error('Error getting performance statistics:', error);
            throw error;
        }
    }

    // Validate performance data
    validatePerformanceData(data) {
        const errors = [];

        const required = ['school_id', 'tracking_period', 'overall_score'];
        for (const field of required) {
            if (!data[field]) {
                errors.push(`${field} is required`);
            }
        }

        if (data.overall_score < 0 || data.overall_score > 100) {
            errors.push('Overall score must be between 0 and 100');
        }

        if (data.academic_performance !== undefined && (data.academic_performance < 0 || data.academic_performance > 100)) {
            errors.push('Academic performance must be between 0 and 100');
        }

        if (data.teacher_performance !== undefined && (data.teacher_performance < 0 || data.teacher_performance > 100)) {
            errors.push('Teacher performance must be between 0 and 100');
        }

        if (data.total_teachers !== undefined && data.total_teachers < 0) {
            errors.push('Total teachers cannot be negative');
        }

        if (data.total_students !== undefined && data.total_students < 0) {
            errors.push('Total students cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = PerformanceTracking;