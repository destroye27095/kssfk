/**
 * KSFP Teacher Statistics Model
 * Tracks teacher count, qualifications, subjects, and student-teacher ratio
 */

const fs = require('fs');
const path = require('path');

class TeacherStats {
    constructor() {
        this.dataFile = path.join(__dirname, '../../data/teacher-stats.json');
        this.ensureDataFile();
    }

    /**
     * Ensure data file exists
     */
    ensureDataFile() {
        if (!fs.existsSync(this.dataFile)) {
            fs.writeFileSync(this.dataFile, JSON.stringify([], null, 2));
        }
    }

    /**
     * Read all teacher stats
     * @returns {Array}
     */
    readAll() {
        try {
            const data = fs.readFileSync(this.dataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading teacher stats:', error);
            return [];
        }
    }

    /**
     * Get teacher stats for specific school
     * @param {string} schoolId
     * @returns {Object}
     */
    findBySchool(schoolId) {
        const all = this.readAll();
        return all.find(t => t.school_id === schoolId) || null;
    }

    /**
     * Create/update teacher stats for school
     * @param {string} schoolId
     * @param {Object} statsData - {total_teachers, qualified_teachers, stem_teachers, arts_teachers, science_teachers, student_count}
     * @returns {Object}
     */
    createOrUpdate(schoolId, statsData) {
        const all = this.readAll();
        const index = all.findIndex(t => t.school_id === schoolId);

        // Calculate derived metrics
        const teacherStats = {
            school_id: schoolId,
            total_teachers: statsData.total_teachers || 0,
            qualified_teachers: statsData.qualified_teachers || 0,
            stem_teachers: statsData.stem_teachers || 0,
            arts_teachers: statsData.arts_teachers || 0,
            science_teachers: statsData.science_teachers || 0,
            student_count: statsData.student_count || 0,
            created_at: index === -1 ? new Date().toISOString() : all[index].created_at,
            updated_at: new Date().toISOString()
        };

        // Calculate student-teacher ratio
        teacherStats.student_teacher_ratio = this.calculateRatio(
            teacherStats.student_count,
            teacherStats.total_teachers
        );

        // Calculate subject distribution
        teacherStats.subject_distribution = this.calculateSubjectDistribution(teacherStats);

        // Calculate quality score
        teacherStats.teacher_quality_score = this.calculateQualityScore(teacherStats);

        if (index === -1) {
            all.push(teacherStats);
        } else {
            all[index] = teacherStats;
        }

        fs.writeFileSync(this.dataFile, JSON.stringify(all, null, 2));
        return teacherStats;
    }

    /**
     * Calculate student-teacher ratio
     * Ideal ratios:
     * - Primary: 1:35-40
     * - Secondary: 1:30-35
     * @param {number} studentCount
     * @param {number} teacherCount
     * @returns {number}
     */
    calculateRatio(studentCount, teacherCount) {
        if (!teacherCount || teacherCount === 0) return 0;
        return Math.round((studentCount / teacherCount) * 10) / 10;
    }

    /**
     * Calculate subject distribution percentage
     * @param {Object} teacherStats
     * @returns {Object}
     */
    calculateSubjectDistribution(teacherStats) {
        const total = teacherStats.total_teachers;
        if (total === 0) return { stem: 0, arts: 0, science: 0, other: 0 };

        return {
            stem: Math.round((teacherStats.stem_teachers / total) * 100),
            arts: Math.round((teacherStats.arts_teachers / total) * 100),
            science: Math.round((teacherStats.science_teachers / total) * 100),
            other: Math.round(((total - teacherStats.stem_teachers - teacherStats.arts_teachers - teacherStats.science_teachers) / total) * 100)
        };
    }

    /**
     * Calculate teacher quality score (0-100)
     * Based on: qualification rate, subject diversity, ratio
     * @param {Object} teacherStats
     * @returns {number}
     */
    calculateQualityScore(teacherStats) {
        let score = 50; // Base

        // 1. QUALIFICATION RATE (0-30 points)
        const qualificationRate = teacherStats.total_teachers > 0
            ? (teacherStats.qualified_teachers / teacherStats.total_teachers)
            : 0;
        score += qualificationRate * 30;

        // 2. SUBJECT DIVERSITY (0-30 points)
        // Schools offering STEM, Arts, AND Science get bonus
        const hasStem = teacherStats.stem_teachers > 0 ? 10 : 0;
        const hasArts = teacherStats.arts_teachers > 0 ? 10 : 0;
        const hasScience = teacherStats.science_teachers > 0 ? 10 : 0;
        score += hasStem + hasArts + hasScience;

        // 3. STUDENT-TEACHER RATIO (0-40 points)
        const ratio = teacherStats.student_teacher_ratio;
        if (ratio <= 25) score += 40;           // Excellent
        else if (ratio <= 30) score += 35;      // Good
        else if (ratio <= 40) score += 25;      // Acceptable
        else if (ratio <= 50) score += 15;      // Needs improvement
        else score += 5;                         // Poor

        return Math.min(100, Math.round(score));
    }

    /**
     * Get teacher quality description
     * @param {number} score
     * @returns {string}
     */
    getQualityDescription(score) {
        if (score >= 80) return 'Excellent - Well-qualified, diverse subjects';
        if (score >= 65) return 'Good - Qualified staff, reasonable class sizes';
        if (score >= 50) return 'Average - Adequate but with room for improvement';
        if (score >= 35) return 'Below average - Limited qualifications or overcrowded';
        return 'Poor - Significant staffing or qualification issues';
    }

    /**
     * Get recommended student-teacher ratio
     * @param {string} schoolLevel - 'PRIMARY' | 'SECONDARY' | 'ECDE'
     * @returns {Object}
     */
    static getRecommendedRatio(schoolLevel) {
        const recommendations = {
            'ECDE': { ideal: 1, max: 25, min: 15 },       // 1 teacher per 15-25 kids
            'PRIMARY': { ideal: 1, max: 40, min: 30 },    // 1 teacher per 30-40 students
            'SECONDARY': { ideal: 1, max: 35, min: 25 }   // 1 teacher per 25-35 students
        };

        return recommendations[schoolLevel] || recommendations['PRIMARY'];
    }

    /**
     * Get teacher adequacy assessment
     * @param {Object} teacherStats
     * @param {string} schoolLevel
     * @returns {Object}
     */
    getAdequacyAssessment(teacherStats, schoolLevel = 'PRIMARY') {
        const recommended = TeacherStats.getRecommendedRatio(schoolLevel);
        const actual = teacherStats.student_teacher_ratio;

        let status = 'ADEQUATE';
        let message = '';

        if (actual > recommended.max) {
            status = 'OVERCROWDED';
            message = `Ratio ${actual}:1 exceeds recommended max ${recommended.max}:1`;
        } else if (actual < recommended.min) {
            status = 'UNDERSTAFFED';
            message = `Ratio ${actual}:1 below minimum ${recommended.min}:1`;
        } else {
            message = `Ratio ${actual}:1 within acceptable range`;
        }

        return {
            status: status,
            message: message,
            actual_ratio: actual,
            recommended_range: `1:${recommended.min}-${recommended.max}`
        };
    }

    /**
     * Get teaching staff breakdown
     * @param {Object} teacherStats
     * @returns {Object}
     */
    getStaffBreakdown(teacherStats) {
        return {
            total: teacherStats.total_teachers,
            qualified: {
                count: teacherStats.qualified_teachers,
                percentage: Math.round((teacherStats.qualified_teachers / teacherStats.total_teachers) * 100) || 0
            },
            by_subject: {
                stem: teacherStats.stem_teachers,
                arts: teacherStats.arts_teachers,
                science: teacherStats.science_teachers
            },
            distribution: teacherStats.subject_distribution
        };
    }

    /**
     * Compare schools by teacher quality
     * @param {Array} schools - School objects with teacher_quality_score
     * @returns {Array} Sorted by quality (highest first)
     */
    rankByQuality(schools) {
        return schools.sort((a, b) =>
            (b.teacher_quality_score || 0) - (a.teacher_quality_score || 0)
        );
    }

    /**
     * Validate teacher data
     * @param {Object} statsData
     * @returns {Object} {valid, errors}
     */
    validateData(statsData) {
        const errors = [];

        if (!statsData.total_teachers || statsData.total_teachers < 1) {
            errors.push('Total teachers must be at least 1');
        }

        if (statsData.qualified_teachers > statsData.total_teachers) {
            errors.push('Qualified teachers cannot exceed total teachers');
        }

        if (
            (statsData.stem_teachers || 0) +
            (statsData.arts_teachers || 0) +
            (statsData.science_teachers || 0) >
            statsData.total_teachers
        ) {
            errors.push('Subject teachers sum cannot exceed total teachers');
        }

        if (!statsData.student_count || statsData.student_count < 1) {
            errors.push('Student count is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Log teacher stats change
     * @param {string} schoolId
     * @param {Object} statsData
     */
    logChange(schoolId, statsData) {
        try {
            const logPath = path.join(__dirname, '../../logs/teachers.log');
            const logEntry = JSON.stringify({
                timestamp: new Date().toISOString(),
                school_id: schoolId,
                ...statsData,
                event: 'TEACHER_STATS_UPDATED'
            }) + '\n';

            fs.appendFileSync(logPath, logEntry);
        } catch (error) {
            console.error('Teacher stats logging error:', error);
        }
    }
}

module.exports = TeacherStats;
