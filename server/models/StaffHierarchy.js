// PHASE 5: STAFF HIERARCHY MODEL
// Kenya School Fee Platform (KSFP)
// Date: January 27, 2026

const fs = require('fs').promises;
const path = require('path');

class StaffHierarchy {
    constructor(db) {
        this.db = db;
        this.dataFile = path.join(__dirname, '../../data/staff_hierarchy.json');
        this.initializeDataFile();
    }

    async initializeDataFile() {
        try {
            await fs.access(this.dataFile);
        } catch {
            await fs.writeFile(this.dataFile, JSON.stringify([], null, 2));
        }
    }

    // Generate unique staff ID
    generateStaffId(schoolId, position) {
        const timestamp = Date.now();
        const positionCode = position.substring(0, 3).toUpperCase();
        return `STF${schoolId}${positionCode}${timestamp.toString().slice(-6)}`;
    }

    // Create new staff member
    async create(staffData) {
        try {
            const staffId = this.generateStaffId(staffData.school_id, staffData.position);

            const {
                school_id,
                full_name,
                title,
                gender,
                date_of_birth,
                nationality = 'Kenyan',
                phone,
                email,
                emergency_contact,
                emergency_phone,
                position,
                department,
                qualification,
                specialization,
                years_experience = 0,
                employment_type = 'permanent',
                hire_date,
                contract_end_date,
                salary_grade,
                staff_number,
                performance_score = 0.00,
                last_performance_review,
                performance_notes,
                is_head_of_department = false,
                is_senior_staff = false,
                can_upload = false,
                can_edit = false,
                created_by
            } = staffData;

            const query = `
                INSERT INTO staff_hierarchy (
                    school_id, staff_id, full_name, title, gender, date_of_birth, nationality,
                    phone, email, emergency_contact, emergency_phone, position, department,
                    qualification, specialization, years_experience, employment_type, hire_date,
                    contract_end_date, salary_grade, staff_number, performance_score,
                    last_performance_review, performance_notes, is_head_of_department,
                    is_senior_staff, can_upload, can_edit, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const [result] = await this.db.execute(query, [
                school_id, staffId, full_name, title, gender, date_of_birth, nationality,
                phone, email, emergency_contact, emergency_phone, position, department,
                qualification, specialization, years_experience, employment_type, hire_date,
                contract_end_date, salary_grade, staff_number, performance_score,
                last_performance_review, performance_notes, is_head_of_department,
                is_senior_staff, can_upload, can_edit, created_by
            ]);

            // Update staff counts in school administration
            await this.updateSchoolStaffCounts(school_id);

            return {
                id: result.insertId,
                staff_id: staffId,
                success: true,
                message: 'Staff member created successfully'
            };
        } catch (error) {
            console.error('Error creating staff member:', error);
            throw error;
        }
    }

    // Update staff member
    async update(staffId, updateData) {
        try {
            const {
                full_name,
                title,
                gender,
                date_of_birth,
                phone,
                email,
                emergency_contact,
                emergency_phone,
                position,
                department,
                qualification,
                specialization,
                years_experience,
                employment_type,
                hire_date,
                contract_end_date,
                salary_grade,
                staff_number,
                performance_score,
                last_performance_review,
                performance_notes,
                is_head_of_department,
                is_senior_staff,
                can_upload,
                can_edit,
                is_active,
                updated_by
            } = updateData;

            const query = `
                UPDATE staff_hierarchy SET
                    full_name = COALESCE(?, full_name),
                    title = COALESCE(?, title),
                    gender = COALESCE(?, gender),
                    date_of_birth = COALESCE(?, date_of_birth),
                    phone = COALESCE(?, phone),
                    email = COALESCE(?, email),
                    emergency_contact = COALESCE(?, emergency_contact),
                    emergency_phone = COALESCE(?, emergency_phone),
                    position = COALESCE(?, position),
                    department = COALESCE(?, department),
                    qualification = COALESCE(?, qualification),
                    specialization = COALESCE(?, specialization),
                    years_experience = COALESCE(?, years_experience),
                    employment_type = COALESCE(?, employment_type),
                    hire_date = COALESCE(?, hire_date),
                    contract_end_date = COALESCE(?, contract_end_date),
                    salary_grade = COALESCE(?, salary_grade),
                    staff_number = COALESCE(?, staff_number),
                    performance_score = COALESCE(?, performance_score),
                    last_performance_review = COALESCE(?, last_performance_review),
                    performance_notes = COALESCE(?, performance_notes),
                    is_head_of_department = COALESCE(?, is_head_of_department),
                    is_senior_staff = COALESCE(?, is_senior_staff),
                    can_upload = COALESCE(?, can_upload),
                    can_edit = COALESCE(?, can_edit),
                    is_active = COALESCE(?, is_active),
                    updated_by = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE staff_id = ?
            `;

            const [result] = await this.db.execute(query, [
                full_name, title, gender, date_of_birth, phone, email, emergency_contact,
                emergency_phone, position, department, qualification, specialization,
                years_experience, employment_type, hire_date, contract_end_date,
                salary_grade, staff_number, performance_score, last_performance_review,
                performance_notes, is_head_of_department, is_senior_staff, can_upload,
                can_edit, is_active, updated_by, staffId
            ]);

            if (result.affectedRows > 0) {
                // Update staff counts if department or active status changed
                const staffMember = await this.getByStaffId(staffId);
                if (staffMember) {
                    await this.updateSchoolStaffCounts(staffMember.school_id);
                }

                return {
                    success: true,
                    message: 'Staff member updated successfully'
                };
            } else {
                throw new Error('Staff member not found');
            }
        } catch (error) {
            console.error('Error updating staff member:', error);
            throw error;
        }
    }

    // Get staff member by staff ID
    async getByStaffId(staffId) {
        try {
            const query = `
                SELECT sh.*, s.name as school_name, s.location as school_location
                FROM staff_hierarchy sh
                JOIN schools s ON sh.school_id = s.id
                WHERE sh.staff_id = ?
            `;
            const [rows] = await this.db.execute(query, [staffId]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error getting staff member:', error);
            throw error;
        }
    }

    // Get all staff for a school
    async getBySchoolId(schoolId, filters = {}) {
        try {
            let query = `
                SELECT * FROM staff_hierarchy
                WHERE school_id = ?
            `;
            const params = [schoolId];

            if (filters.is_active !== undefined) {
                query += ' AND is_active = ?';
                params.push(filters.is_active);
            }

            if (filters.department) {
                query += ' AND department = ?';
                params.push(filters.department);
            }

            if (filters.position) {
                query += ' AND position = ?';
                params.push(filters.position);
            }

            query += ' ORDER BY is_head_of_department DESC, is_senior_staff DESC, full_name ASC';

            const [rows] = await this.db.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Error getting staff by school:', error);
            throw error;
        }
    }

    // Get staff summary by school
    async getStaffSummary(schoolId) {
        try {
            const query = `
                SELECT
                    COUNT(*) as total_staff,
                    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_staff,
                    COUNT(CASE WHEN is_head_of_department = TRUE THEN 1 END) as department_heads,
                    COUNT(CASE WHEN is_senior_staff = TRUE THEN 1 END) as senior_staff,
                    COUNT(CASE WHEN employment_type = 'permanent' THEN 1 END) as permanent_staff,
                    COUNT(CASE WHEN employment_type = 'contract' THEN 1 END) as contract_staff,
                    AVG(performance_score) as avg_performance_score,
                    AVG(years_experience) as avg_experience_years,
                    GROUP_CONCAT(DISTINCT department) as departments
                FROM staff_hierarchy
                WHERE school_id = ? AND is_active = TRUE
            `;
            const [rows] = await this.db.execute(query, [schoolId]);
            return rows[0] || {};
        } catch (error) {
            console.error('Error getting staff summary:', error);
            throw error;
        }
    }

    // Update performance score
    async updatePerformance(staffId, performanceData) {
        try {
            const {
                performance_score,
                last_performance_review,
                performance_notes,
                updated_by
            } = performanceData;

            const query = `
                UPDATE staff_hierarchy SET
                    performance_score = ?,
                    last_performance_review = ?,
                    performance_notes = ?,
                    updated_by = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE staff_id = ?
            `;

            await this.db.execute(query, [
                performance_score,
                last_performance_review,
                performance_notes,
                updated_by,
                staffId
            ]);

            return {
                success: true,
                message: 'Performance updated successfully'
            };
        } catch (error) {
            console.error('Error updating performance:', error);
            throw error;
        }
    }

    // Bulk update staff (for mass operations)
    async bulkUpdate(schoolId, updates, filter = {}) {
        try {
            let whereClause = 'school_id = ?';
            const params = [schoolId];

            if (filter.department) {
                whereClause += ' AND department = ?';
                params.push(filter.department);
            }

            if (filter.is_active !== undefined) {
                whereClause += ' AND is_active = ?';
                params.push(filter.is_active);
            }

            const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            params.push(...Object.values(updates));

            const query = `UPDATE staff_hierarchy SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE ${whereClause}`;

            const [result] = await this.db.execute(query, params);

            // Update staff counts
            await this.updateSchoolStaffCounts(schoolId);

            return {
                success: true,
                affected_rows: result.affectedRows,
                message: `${result.affectedRows} staff members updated`
            };
        } catch (error) {
            console.error('Error in bulk update:', error);
            throw error;
        }
    }

    // Update school staff counts (helper method)
    async updateSchoolStaffCounts(schoolId) {
        try {
            const query = `
                UPDATE school_administration SET
                    admin_staff_count = (
                        SELECT COUNT(*) FROM staff_hierarchy
                        WHERE school_id = ? AND is_active = TRUE
                        AND department = 'Administration'
                    ),
                    academic_staff_count = (
                        SELECT COUNT(*) FROM staff_hierarchy
                        WHERE school_id = ? AND is_active = TRUE
                        AND department NOT IN ('Administration', 'Support', 'Maintenance', 'IT', 'Security')
                    ),
                    support_staff_count = (
                        SELECT COUNT(*) FROM staff_hierarchy
                        WHERE school_id = ? AND is_active = TRUE
                        AND department IN ('Support', 'Maintenance', 'IT', 'Security')
                    ),
                    total_staff_count = (
                        SELECT COUNT(*) FROM staff_hierarchy
                        WHERE school_id = ? AND is_active = TRUE
                    ),
                    last_updated = CURRENT_TIMESTAMP
                WHERE school_id = ?
            `;
            await this.db.execute(query, [schoolId, schoolId, schoolId, schoolId, schoolId]);
        } catch (error) {
            console.error('Error updating school staff counts:', error);
            // Don't throw here as this is a helper method
        }
    }

    // Get department structure for a school
    async getDepartmentStructure(schoolId) {
        try {
            const query = `
                SELECT
                    department,
                    COUNT(*) as total_staff,
                    COUNT(CASE WHEN is_head_of_department = TRUE THEN 1 END) as heads,
                    COUNT(CASE WHEN is_senior_staff = TRUE THEN 1 END) as senior_staff,
                    AVG(performance_score) as avg_performance,
                    GROUP_CONCAT(DISTINCT position ORDER BY position) as positions
                FROM staff_hierarchy
                WHERE school_id = ? AND is_active = TRUE AND department IS NOT NULL
                GROUP BY department
                ORDER BY department
            `;
            const [rows] = await this.db.execute(query, [schoolId]);
            return rows;
        } catch (error) {
            console.error('Error getting department structure:', error);
            throw error;
        }
    }

    // Validate staff data
    validateStaffData(staffData) {
        const errors = [];

        const required = ['school_id', 'full_name', 'position', 'department'];
        for (const field of required) {
            if (!staffData[field]) {
                errors.push(`${field} is required`);
            }
        }

        // Email validation
        if (staffData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(staffData.email)) {
                errors.push('Invalid email format');
            }
        }

        // Phone validation (Kenyan format)
        if (staffData.phone) {
            const phoneRegex = /^(\+254|0)[17]\d{8}$/;
            if (!phoneRegex.test(staffData.phone)) {
                errors.push('Invalid phone format (use Kenyan format: +254XXXXXXXXX or 07XXXXXXXX)');
            }
        }

        // Performance score validation
        if (staffData.performance_score !== undefined) {
            if (staffData.performance_score < 0 || staffData.performance_score > 100) {
                errors.push('Performance score must be between 0 and 100');
            }
        }

        // Experience validation
        if (staffData.years_experience !== undefined && staffData.years_experience < 0) {
            errors.push('Years of experience cannot be negative');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Search staff with advanced filters
    async search(filters = {}, pagination = {}) {
        try {
            let query = `
                SELECT sh.*, s.name as school_name
                FROM staff_hierarchy sh
                JOIN schools s ON sh.school_id = s.id
                WHERE 1=1
            `;
            const params = [];

            if (filters.school_id) {
                query += ' AND sh.school_id = ?';
                params.push(filters.school_id);
            }

            if (filters.full_name) {
                query += ' AND sh.full_name LIKE ?';
                params.push(`%${filters.full_name}%`);
            }

            if (filters.position) {
                query += ' AND sh.position LIKE ?';
                params.push(`%${filters.position}%`);
            }

            if (filters.department) {
                query += ' AND sh.department = ?';
                params.push(filters.department);
            }

            if (filters.is_active !== undefined) {
                query += ' AND sh.is_active = ?';
                params.push(filters.is_active);
            }

            if (filters.performance_min) {
                query += ' AND sh.performance_score >= ?';
                params.push(filters.performance_min);
            }

            if (filters.performance_max) {
                query += ' AND sh.performance_score <= ?';
                params.push(filters.performance_max);
            }

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
            console.error('Error searching staff:', error);
            throw error;
        }
    }
}

module.exports = StaffHierarchy;