/**
 * KSFP Courses Model
 * Track courses and programs offered by schools
 * Enable parent filtering by subject interests
 */

const fs = require('fs');
const path = require('path');

class Courses {
    constructor() {
        this.dataFile = path.join(__dirname, '../../data/courses.json');
        this.ensureDataFile();
    }

    /**
     * School levels
     */
    static LEVELS = [
        'ECDE',          // Early Childhood Development
        'PRIMARY',       // Classes 1-6
        'SECONDARY',     // Forms 1-4
        'TVET',          // Technical & Vocational
        'UNIVERSITY'     // Higher education
    ];

    /**
     * Course categories
     */
    static CATEGORIES = [
        'STEM',          // Science, Technology, Engineering, Math
        'SCIENCE',       // Biology, Chemistry, Physics
        'ARTS',          // Languages, History, Geography
        'TECHNICAL',     // Mechanics, Electronics, Welding
        'VOCATIONAL',    // Tailoring, Hairdressing, Hospitality
        'SPORTS',        // Physical Education
        'MUSIC',         // Music, Drama, Dance
        'RELIGION'       // Religious Studies, Ethics
    ];

    /**
     * Ensure data file exists
     */
    ensureDataFile() {
        if (!fs.existsSync(this.dataFile)) {
            fs.writeFileSync(this.dataFile, JSON.stringify([], null, 2));
        }
    }

    /**
     * Read all courses
     * @returns {Array}
     */
    readAll() {
        try {
            const data = fs.readFileSync(this.dataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading courses:', error);
            return [];
        }
    }

    /**
     * Get all courses for a school
     * @param {string} schoolId
     * @returns {Array}
     */
    findBySchool(schoolId) {
        const all = this.readAll();
        return all.filter(c => c.school_id === schoolId);
    }

    /**
     * Get courses by level
     * @param {string} schoolId
     * @param {string} level - 'ECDE', 'PRIMARY', 'SECONDARY', etc.
     * @returns {Array}
     */
    findByLevel(schoolId, level) {
        return this.findBySchool(schoolId).filter(c => c.level === level);
    }

    /**
     * Get courses by category
     * @param {string} schoolId
     * @param {string} category - 'STEM', 'ARTS', 'SCIENCE', etc.
     * @returns {Array}
     */
    findByCategory(schoolId, category) {
        return this.findBySchool(schoolId).filter(c => c.category === category);
    }

    /**
     * Add course to school
     * @param {string} schoolId
     * @param {Object} courseData - {level, course_name, category, duration, certification}
     * @returns {Object}
     */
    add(schoolId, courseData) {
        const validation = this.validateCourse(courseData);
        if (!validation.valid) {
            throw new Error(`Invalid course: ${validation.errors.join(', ')}`);
        }

        const all = this.readAll();
        const course = {
            id: `course_${Date.now()}`,
            school_id: schoolId,
            level: courseData.level,
            course_name: courseData.course_name,
            category: courseData.category,
            duration: courseData.duration,
            certification: courseData.certification,
            created_at: new Date().toISOString()
        };

        all.push(course);
        fs.writeFileSync(this.dataFile, JSON.stringify(all, null, 2));

        this.logCourseAdded(schoolId, course);
        return course;
    }

    /**
     * Remove course from school
     * @param {string} schoolId
     * @param {string} courseId
     * @returns {boolean}
     */
    remove(schoolId, courseId) {
        const all = this.readAll();
        const index = all.findIndex(c => c.id === courseId && c.school_id === schoolId);

        if (index === -1) return false;

        const course = all[index];
        all.splice(index, 1);
        fs.writeFileSync(this.dataFile, JSON.stringify(all, null, 2));

        this.logCourseRemoved(schoolId, course);
        return true;
    }

    /**
     * Get subject distribution for school
     * How many courses in each category
     * @param {string} schoolId
     * @returns {Object}
     */
    getDistribution(schoolId) {
        const courses = this.findBySchool(schoolId);
        const distribution = {};

        this.constructor.CATEGORIES.forEach(cat => {
            distribution[cat] = courses.filter(c => c.category === cat).length;
        });

        return distribution;
    }

    /**
     * Check if school offers specific subject
     * @param {string} schoolId
     * @param {string} category
     * @returns {boolean}
     */
    offersCategory(schoolId, category) {
        const courses = this.findBySchool(schoolId);
        return courses.some(c => c.category === category);
    }

    /**
     * Get all categories offered by school
     * @param {string} schoolId
     * @returns {Array}
     */
    getOfferedCategories(schoolId) {
        const courses = this.findBySchool(schoolId);
        const categories = new Set(courses.map(c => c.category));
        return Array.from(categories);
    }

    /**
     * Get school profile for curriculum
     * What makes this school unique curriculum-wise
     * @param {string} schoolId
     * @returns {Object}
     */
    getCurriculumProfile(schoolId) {
        const courses = this.findBySchool(schoolId);
        const distribution = this.getDistribution(schoolId);
        const offeredCategories = this.getOfferedCategories(schoolId);

        // Curriculum type
        let curriculumType = 'GENERAL';
        if (distribution.STEM > distribution.ARTS) {
            curriculumType = 'STEM-FOCUSED';
        } else if (distribution.ARTS > distribution.STEM) {
            curriculumType = 'ARTS-FOCUSED';
        } else if (distribution.SCIENCE > 0 && distribution.TECHNICAL > 0) {
            curriculumType = 'SCIENCE-TECHNICAL';
        }

        return {
            curriculum_type: curriculumType,
            total_courses: courses.length,
            by_level: this.getCoursesPerLevel(schoolId),
            distribution: distribution,
            offered_categories: offeredCategories,
            profile: {
                has_stem: distribution.STEM > 0,
                has_vocational: distribution.VOCATIONAL > 0,
                has_sports: distribution.SPORTS > 0,
                has_music: distribution.MUSIC > 0
            }
        };
    }

    /**
     * Get courses grouped by level
     * @param {string} schoolId
     * @returns {Object}
     */
    getCoursesPerLevel(schoolId) {
        const byLevel = {};

        this.constructor.LEVELS.forEach(level => {
            const levelCourses = this.findByLevel(schoolId, level);
            byLevel[level] = levelCourses.length;
        });

        return byLevel;
    }

    /**
     * Match schools to parent preferences
     * @param {Array} schools - School list with course data
     * @param {Array} preferredCategories - ['STEM', 'SPORTS']
     * @returns {Array} Sorted by match score (highest first)
     */
    matchByPreferences(schools, preferredCategories) {
        const schoolsWithScores = schools.map(school => {
            const offeredCategories = this.getOfferedCategories(school.id);
            const matchCount = preferredCategories.filter(pref =>
                offeredCategories.includes(pref)
            ).length;

            return {
                ...school,
                curriculum_match_score: (matchCount / preferredCategories.length) * 100,
                matched_categories: offeredCategories.filter(cat =>
                    preferredCategories.includes(cat)
                )
            };
        });

        return schoolsWithScores.sort((a, b) =>
            b.curriculum_match_score - a.curriculum_match_score
        );
    }

    /**
     * Get schools by curriculum type
     * @param {Array} schools
     * @param {string} curriculumType - 'STEM-FOCUSED', 'ARTS-FOCUSED', etc.
     * @returns {Array}
     */
    filterByCurriculumType(schools, curriculumType) {
        return schools.filter(school => {
            const profile = this.getCurriculumProfile(school.id);
            return profile.curriculum_type === curriculumType;
        });
    }

    /**
     * Get schools with specific features
     * @param {Array} schools
     * @param {Array} features - ['has_sports', 'has_music']
     * @returns {Array}
     */
    filterByFeatures(schools, features) {
        return schools.filter(school => {
            const profile = this.getCurriculumProfile(school.id);
            return features.every(feature => profile.profile[feature]);
        });
    }

    /**
     * Validate course data
     * @param {Object} courseData
     * @returns {Object} {valid, errors}
     */
    validateCourse(courseData) {
        const errors = [];

        if (!courseData.level || !this.constructor.LEVELS.includes(courseData.level)) {
            errors.push('Invalid level');
        }

        if (!courseData.course_name || courseData.course_name.trim() === '') {
            errors.push('Course name required');
        }

        if (!courseData.category || !this.constructor.CATEGORIES.includes(courseData.category)) {
            errors.push('Invalid category');
        }

        if (!courseData.duration) {
            errors.push('Duration required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Log course added
     * @param {string} schoolId
     * @param {Object} course
     */
    logCourseAdded(schoolId, course) {
        try {
            const logPath = path.join(__dirname, '../../logs/courses.log');
            const logEntry = JSON.stringify({
                timestamp: new Date().toISOString(),
                school_id: schoolId,
                ...course,
                event: 'COURSE_ADDED'
            }) + '\n';

            fs.appendFileSync(logPath, logEntry);
        } catch (error) {
            console.error('Course logging error:', error);
        }
    }

    /**
     * Log course removed
     * @param {string} schoolId
     * @param {Object} course
     */
    logCourseRemoved(schoolId, course) {
        try {
            const logPath = path.join(__dirname, '../../logs/courses.log');
            const logEntry = JSON.stringify({
                timestamp: new Date().toISOString(),
                school_id: schoolId,
                ...course,
                event: 'COURSE_REMOVED'
            }) + '\n';

            fs.appendFileSync(logPath, logEntry);
        } catch (error) {
            console.error('Course logging error:', error);
        }
    }

    /**
     * Get popular courses across all schools
     * @param {Array} allCourses - All courses from readAll()
     * @param {number} limit - Top N courses
     * @returns {Array}
     */
    getPopularCourses(allCourses, limit = 10) {
        const courseNames = {};

        allCourses.forEach(course => {
            courseNames[course.course_name] = (courseNames[course.course_name] || 0) + 1;
        });

        return Object.entries(courseNames)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([name, count]) => ({ course_name: name, school_count: count }));
    }
}

module.exports = Courses;
