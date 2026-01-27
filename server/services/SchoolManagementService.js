// PHASE 5: SCHOOL MANAGEMENT SERVICE
// Kenya School Fee Platform (KSFP)
// Date: January 27, 2026

const SchoolAdmin = require('../models/SchoolAdmin');
const StaffHierarchy = require('../models/StaffHierarchy');
const PerformanceTracking = require('../models/PerformanceTracking');

class SchoolManagementService {
    constructor(db) {
        this.db = db;
        this.schoolAdmin = new SchoolAdmin(db);
        this.staffHierarchy = new StaffHierarchy(db);
        this.performanceTracking = new PerformanceTracking(db);
    }

    // Create complete school profile with administration
    async createSchoolProfile(schoolData, adminData = null) {
        try {
            // Start transaction
            await this.db.execute('START TRANSACTION');

            // Create school (assuming schools table exists from Phase 1-4)
            const schoolQuery = `
                INSERT INTO schools (name, location, level, category, student_count, description)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [schoolResult] = await this.db.execute(schoolQuery, [
                schoolData.name,
                schoolData.location,
                schoolData.level,
                schoolData.category,
                schoolData.student_count || 0,
                schoolData.description || ''
            ]);
            const schoolId = schoolResult.insertId;

            // Auto-detect institution type if not provided
            let institutionType = adminData?.institution_type;
            if (!institutionType) {
                institutionType = await this.schoolAdmin.autoDetectInstitutionType(schoolId);
            }

            // Create school administration if provided
            if (adminData) {
                await this.schoolAdmin.upsert({
                    ...adminData,
                    school_id: schoolId,
                    institution_type: institutionType,
                    updated_by: adminData.created_by || 'system'
                });
            }

            // Create default staff structure based on institution type
            await this.createDefaultStaffStructure(schoolId, institutionType, adminData?.created_by || 'system');

            // Calculate initial performance
            const currentPeriod = this.getCurrentTrackingPeriod();
            await this.performanceTracking.autoCalculatePerformance(schoolId, currentPeriod, 'system');

            await this.db.execute('COMMIT');

            return {
                school_id: schoolId,
                institution_type: institutionType,
                success: true,
                message: 'School profile created successfully'
            };
        } catch (error) {
            await this.db.execute('ROLLBACK');
            console.error('Error creating school profile:', error);
            throw error;
        }
    }

    // Update complete school profile
    async updateSchoolProfile(schoolId, schoolData, adminData = null) {
        try {
            await this.db.execute('START TRANSACTION');

            // Update school basic info
            if (schoolData.name || schoolData.location || schoolData.level || schoolData.category) {
                const updateFields = [];
                const updateValues = [];

                if (schoolData.name) {
                    updateFields.push('name = ?');
                    updateValues.push(schoolData.name);
                }
                if (schoolData.location) {
                    updateFields.push('location = ?');
                    updateValues.push(schoolData.location);
                }
                if (schoolData.level) {
                    updateFields.push('level = ?');
                    updateValues.push(schoolData.level);
                }
                if (schoolData.category) {
                    updateFields.push('category = ?');
                    updateValues.push(schoolData.category);
                }
                if (schoolData.student_count !== undefined) {
                    updateFields.push('student_count = ?');
                    updateValues.push(schoolData.student_count);
                }
                if (schoolData.description !== undefined) {
                    updateFields.push('description = ?');
                    updateValues.push(schoolData.description);
                }

                if (updateFields.length > 0) {
                    const schoolQuery = `UPDATE schools SET ${updateFields.join(', ')} WHERE id = ?`;
                    updateValues.push(schoolId);
                    await this.db.execute(schoolQuery, updateValues);
                }
            }

            // Update administration if provided
            if (adminData) {
                await this.schoolAdmin.upsert({
                    ...adminData,
                    school_id: schoolId,
                    updated_by: adminData.updated_by || 'system'
                });
            }

            // Recalculate performance if significant changes
            if (schoolData.student_count || adminData) {
                const currentPeriod = this.getCurrentTrackingPeriod();
                await this.performanceTracking.autoCalculatePerformance(schoolId, currentPeriod, 'system');
            }

            await this.db.execute('COMMIT');

            return {
                school_id: schoolId,
                success: true,
                message: 'School profile updated successfully'
            };
        } catch (error) {
            await this.db.execute('ROLLBACK');
            console.error('Error updating school profile:', error);
            throw error;
        }
    }

    // Get complete school profile
    async getSchoolProfile(schoolId) {
        try {
            // Get school basic info
            const schoolQuery = `
                SELECT s.*, sa.*, pt.overall_score, pt.performance_deviation
                FROM schools s
                LEFT JOIN school_administration sa ON s.id = sa.school_id
                LEFT JOIN performance_tracking pt ON s.id = pt.school_id
                    AND pt.tracking_period = (
                        SELECT MAX(tracking_period)
                        FROM performance_tracking pt2
                        WHERE pt2.school_id = s.id
                    )
                WHERE s.id = ?
            `;
            const [schoolRows] = await this.db.execute(schoolQuery, [schoolId]);
            const school = schoolRows[0];

            if (!school) {
                throw new Error('School not found');
            }

            // Get staff summary
            const staffSummary = await this.staffHierarchy.getStaffSummary(schoolId);

            // Get department structure
            const departmentStructure = await this.staffHierarchy.getDepartmentStructure(schoolId);

            // Get recent performance history
            const performanceHistory = await this.performanceTracking.getBySchoolId(schoolId, 5);

            // Get transition success rate
            const transitionQuery = `
                SELECT AVG(success_rate) as avg_transition_success
                FROM transition_success_rates
                WHERE school_id = ?
            `;
            const [transitionRows] = await this.db.execute(transitionQuery, [schoolId]);
            const transitionRate = transitionRows[0]?.avg_transition_success || 0;

            return {
                school: {
                    id: school.id,
                    name: school.name,
                    location: school.location,
                    level: school.level,
                    category: school.category,
                    student_count: school.student_count,
                    description: school.description
                },
                administration: {
                    institution_type: school.institution_type,
                    head_title: school.head_title,
                    head_name: school.head_name,
                    head_qualification: school.head_qualification,
                    head_contact: school.head_contact,
                    head_email: school.head_email,
                    deputy_title: school.deputy_title,
                    deputy_name: school.deputy_name,
                    total_staff_count: school.total_staff_count,
                    academic_staff_count: school.academic_staff_count,
                    admin_staff_count: school.admin_staff_count,
                    last_updated: school.last_updated
                },
                staff_summary: staffSummary,
                department_structure: departmentStructure,
                performance: {
                    current_score: school.overall_score,
                    deviation: school.performance_deviation,
                    history: performanceHistory
                },
                transition_success_rate: transitionRate
            };
        } catch (error) {
            console.error('Error getting school profile:', error);
            throw error;
        }
    }

    // Create default staff structure based on institution type
    async createDefaultStaffStructure(schoolId, institutionType, createdBy = 'system') {
        try {
            const defaultStaff = this.getDefaultStaffStructure(institutionType);

            for (const staff of defaultStaff) {
                await this.staffHierarchy.create({
                    ...staff,
                    school_id: schoolId,
                    created_by: createdBy
                });
            }

            // Update staff counts
            await this.staffHierarchy.updateSchoolStaffCounts(schoolId);

            return {
                success: true,
                staff_created: defaultStaff.length,
                message: `Default staff structure created for ${institutionType}`
            };
        } catch (error) {
            console.error('Error creating default staff structure:', error);
            throw error;
        }
    }

    // Get default staff structure by institution type
    getDefaultStaffStructure(institutionType) {
        const structures = {
            university: [
                {
                    full_name: 'Vice Chancellor',
                    position: 'Vice Chancellor',
                    department: 'Administration',
                    employment_type: 'permanent',
                    is_head_of_department: true,
                    is_senior_staff: true,
                    can_upload: true,
                    can_edit: true
                },
                {
                    full_name: 'Deputy Vice Chancellor',
                    position: 'Deputy Vice Chancellor',
                    department: 'Administration',
                    employment_type: 'permanent',
                    is_senior_staff: true,
                    can_upload: true,
                    can_edit: true
                },
                {
                    full_name: 'Registrar',
                    position: 'Registrar',
                    department: 'Administration',
                    employment_type: 'permanent',
                    is_senior_staff: true,
                    can_upload: true,
                    can_edit: false
                },
                {
                    full_name: 'Dean of Students',
                    position: 'Dean',
                    department: 'Student Affairs',
                    employment_type: 'permanent',
                    is_head_of_department: true,
                    is_senior_staff: true
                }
            ],
            college: [
                {
                    full_name: 'Principal',
                    position: 'Principal',
                    department: 'Administration',
                    employment_type: 'permanent',
                    is_head_of_department: true,
                    is_senior_staff: true,
                    can_upload: true,
                    can_edit: true
                },
                {
                    full_name: 'Deputy Principal',
                    position: 'Deputy Principal',
                    department: 'Administration',
                    employment_type: 'permanent',
                    is_senior_staff: true,
                    can_upload: true,
                    can_edit: true
                },
                {
                    full_name: 'Registrar',
                    position: 'Registrar',
                    department: 'Administration',
                    employment_type: 'permanent',
                    is_senior_staff: true,
                    can_upload: true,
                    can_edit: false
                },
                {
                    full_name: 'HOD - Business Studies',
                    position: 'Head of Department',
                    department: 'Business Studies',
                    employment_type: 'permanent',
                    is_head_of_department: true,
                    is_senior_staff: true
                }
            ],
            vocational: [
                {
                    full_name: 'Director',
                    position: 'Director',
                    department: 'Administration',
                    employment_type: 'permanent',
                    is_head_of_department: true,
                    is_senior_staff: true,
                    can_upload: true,
                    can_edit: true
                },
                {
                    full_name: 'Deputy Director',
                    position: 'Deputy Director',
                    department: 'Administration',
                    employment_type: 'permanent',
                    is_senior_staff: true,
                    can_upload: true,
                    can_edit: true
                },
                {
                    full_name: 'Registrar',
                    position: 'Registrar',
                    department: 'Administration',
                    employment_type: 'permanent',
                    is_senior_staff: true,
                    can_upload: true,
                    can_edit: false
                },
                {
                    full_name: 'HOD - Technical Studies',
                    position: 'Head of Department',
                    department: 'Technical Studies',
                    employment_type: 'permanent',
                    is_head_of_department: true,
                    is_senior_staff: true
                }
            ],
            senior_school: [
                {
                    full_name: 'Principal',
                    position: 'Principal',
                    department: 'Administration',
                    employment_type: 'permanent',
                    is_head_of_department: true,
                    is_senior_staff: true,
                    can_upload: true,
                    can_edit: true
                },
                {
                    full_name: 'Deputy Principal',
                    position: 'Deputy Principal',
                    department: 'Administration',
                    employment_type: 'permanent',
                    is_senior_staff: true,
                    can_upload: true,
                    can_edit: true
                },
                {
                    full_name: 'HOD - Mathematics',
                    position: 'Head of Department',
                    department: 'Mathematics',
                    employment_type: 'permanent',
                    is_head_of_department: true,
                    is_senior_staff: true
                },
                {
                    full_name: 'HOD - English',
                    position: 'Head of Department',
                    department: 'English',
                    employment_type: 'permanent',
                    is_head_of_department: true,
                    is_senior_staff: true
                }
            ],
            junior_school: [
                {
                    full_name: 'Head Teacher',
                    position: 'Head Teacher',
                    department: 'Administration',
                    employment_type: 'permanent',
                    is_head_of_department: true,
                    is_senior_staff: true,
                    can_upload: true,
                    can_edit: true
                },
                {
                    full_name: 'Deputy Head Teacher',
                    position: 'Deputy Head Teacher',
                    department: 'Administration',
                    employment_type: 'permanent',
                    is_senior_staff: true,
                    can_upload: true,
                    can_edit: true
                },
                {
                    full_name: 'Senior Teacher',
                    position: 'Senior Teacher',
                    department: 'General',
                    employment_type: 'permanent',
                    is_senior_staff: true
                }
            ]
        };

        return structures[institutionType] || structures.college;
    }

    // Bulk import schools from CSV/data
    async bulkImportSchools(schoolsData, createdBy = 'system') {
        try {
            const results = {
                successful: 0,
                failed: 0,
                errors: []
            };

            await this.db.execute('START TRANSACTION');

            for (const schoolData of schoolsData) {
                try {
                    await this.createSchoolProfile(schoolData, {
                        institution_type: schoolData.institution_type,
                        created_by: createdBy
                    });
                    results.successful++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        school: schoolData.name,
                        error: error.message
                    });
                }
            }

            await this.db.execute('COMMIT');

            return {
                ...results,
                message: `Imported ${results.successful} schools successfully, ${results.failed} failed`
            };
        } catch (error) {
            await this.db.execute('ROLLBACK');
            console.error('Error in bulk import:', error);
            throw error;
        }
    }

    // Get schools summary for dashboard
    async getSchoolsSummary() {
        try {
            const query = `
                SELECT
                    COUNT(*) as total_schools,
                    COUNT(CASE WHEN sa.institution_type = 'university' THEN 1 END) as universities,
                    COUNT(CASE WHEN sa.institution_type = 'college' THEN 1 END) as colleges,
                    COUNT(CASE WHEN sa.institution_type = 'vocational' THEN 1 END) as vocational_centers,
                    COUNT(CASE WHEN sa.institution_type = 'senior_school' THEN 1 END) as senior_schools,
                    COUNT(CASE WHEN sa.institution_type = 'junior_school' THEN 1 END) as junior_schools,
                    AVG(sa.total_staff_count) as avg_staff_per_school,
                    AVG(s.student_count) as avg_students_per_school,
                    AVG(pt.overall_score) as avg_performance_score
                FROM schools s
                LEFT JOIN school_administration sa ON s.id = sa.school_id
                LEFT JOIN performance_tracking pt ON s.id = pt.school_id
                    AND pt.tracking_period = (
                        SELECT MAX(tracking_period)
                        FROM performance_tracking pt2
                        WHERE pt2.school_id = s.id
                    )
            `;
            const [rows] = await this.db.execute(query);
            return rows[0] || {};
        } catch (error) {
            console.error('Error getting schools summary:', error);
            throw error;
        }
    }

    // Get current tracking period (e.g., '2024-Q1', '2024-Term1')
    getCurrentTrackingPeriod() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // Determine quarter
        let quarter;
        if (month <= 3) quarter = 'Q1';
        else if (month <= 6) quarter = 'Q2';
        else if (month <= 9) quarter = 'Q3';
        else quarter = 'Q4';

        return `${year}-${quarter}`;
    }

    // Search schools with filters
    async searchSchools(filters = {}, pagination = {}) {
        try {
            let query = `
                SELECT
                    s.*,
                    sa.institution_type,
                    sa.head_name,
                    sa.total_staff_count,
                    pt.overall_score,
                    pt.performance_deviation
                FROM schools s
                LEFT JOIN school_administration sa ON s.id = sa.school_id
                LEFT JOIN performance_tracking pt ON s.id = pt.school_id
                    AND pt.tracking_period = (
                        SELECT MAX(tracking_period)
                        FROM performance_tracking pt2
                        WHERE pt2.school_id = s.id
                    )
                WHERE 1=1
            `;
            const params = [];

            if (filters.name) {
                query += ' AND s.name LIKE ?';
                params.push(`%${filters.name}%`);
            }

            if (filters.location) {
                query += ' AND s.location LIKE ?';
                params.push(`%${filters.location}%`);
            }

            if (filters.level) {
                query += ' AND s.level = ?';
                params.push(filters.level);
            }

            if (filters.institution_type) {
                query += ' AND sa.institution_type = ?';
                params.push(filters.institution_type);
            }

            if (filters.min_performance) {
                query += ' AND pt.overall_score >= ?';
                params.push(filters.min_performance);
            }

            if (filters.max_performance) {
                query += ' AND pt.overall_score <= ?';
                params.push(filters.max_performance);
            }

            // Sorting
            const sortBy = filters.sort_by || 's.name';
            const sortOrder = filters.sort_order === 'desc' ? 'DESC' : 'ASC';
            query += ` ORDER BY ${sortBy} ${sortOrder}`;

            // Pagination
            if (pagination.limit) {
                query += ' LIMIT ?';
                params.push(pagination.limit);

                if (pagination.offset) {
                    query += ' OFFSET ?';
                    params.push(pagination.offset);
                }
            }

            const [rows] = await this.db.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error searching schools:', error);
            throw error;
        }
    }
}

module.exports = SchoolManagementService;