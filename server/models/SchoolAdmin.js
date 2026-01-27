// PHASE 5: SCHOOL ADMINISTRATION MODEL
// Kenya School Fee Platform (KSFP)
// Date: January 27, 2026

const fs = require('fs').promises;
const path = require('path');

class SchoolAdmin {
    constructor(db) {
        this.db = db;
        this.dataFile = path.join(__dirname, '../../data/school_administration.json');
        this.initializeDataFile();
    }

    async initializeDataFile() {
        try {
            await fs.access(this.dataFile);
        } catch {
            await fs.writeFile(this.dataFile, JSON.stringify([], null, 2));
        }
    }

    // Get school administration by school ID
    async getBySchoolId(schoolId) {
        try {
            const query = `
                SELECT sa.*, s.name as school_name, s.location as school_location
                FROM school_administration sa
                JOIN schools s ON sa.school_id = s.id
                WHERE sa.school_id = ?
            `;
            const [rows] = await this.db.execute(query, [schoolId]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error getting school administration:', error);
            throw error;
        }
    }

    // Create or update school administration
    async upsert(adminData) {
        try {
            const {
                school_id,
                institution_type,
                head_title,
                head_name,
                head_qualification,
                head_contact,
                head_email,
                deputy_title,
                deputy_name,
                deputy_qualification,
                deputy_contact,
                deputy_email,
                registrar_name,
                registrar_contact,
                registrar_email,
                deputy_registrar_name,
                deputy_registrar_contact,
                deputy_registrar_email,
                academic_director_name,
                academic_director_contact,
                academic_director_email,
                admin_staff_count = 0,
                academic_staff_count = 0,
                support_staff_count = 0,
                updated_by
            } = adminData;

            const total_staff_count = admin_staff_count + academic_staff_count + support_staff_count;

            const query = `
                INSERT INTO school_administration (
                    school_id, institution_type, head_title, head_name, head_qualification,
                    head_contact, head_email, deputy_title, deputy_name, deputy_qualification,
                    deputy_contact, deputy_email, registrar_name, registrar_contact, registrar_email,
                    deputy_registrar_name, deputy_registrar_contact, deputy_registrar_email,
                    academic_director_name, academic_director_contact, academic_director_email,
                    admin_staff_count, academic_staff_count, support_staff_count, total_staff_count,
                    updated_by, last_updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE
                    institution_type = VALUES(institution_type),
                    head_title = VALUES(head_title),
                    head_name = VALUES(head_name),
                    head_qualification = VALUES(head_qualification),
                    head_contact = VALUES(head_contact),
                    head_email = VALUES(head_email),
                    deputy_title = VALUES(deputy_title),
                    deputy_name = VALUES(deputy_name),
                    deputy_qualification = VALUES(deputy_qualification),
                    deputy_contact = VALUES(deputy_contact),
                    deputy_email = VALUES(deputy_email),
                    registrar_name = VALUES(registrar_name),
                    registrar_contact = VALUES(registrar_contact),
                    registrar_email = VALUES(registrar_email),
                    deputy_registrar_name = VALUES(deputy_registrar_name),
                    deputy_registrar_contact = VALUES(deputy_registrar_contact),
                    deputy_registrar_email = VALUES(deputy_registrar_email),
                    academic_director_name = VALUES(academic_director_name),
                    academic_director_contact = VALUES(academic_director_contact),
                    academic_director_email = VALUES(academic_director_email),
                    admin_staff_count = VALUES(admin_staff_count),
                    academic_staff_count = VALUES(academic_staff_count),
                    support_staff_count = VALUES(support_staff_count),
                    total_staff_count = VALUES(total_staff_count),
                    updated_by = VALUES(updated_by),
                    last_updated = CURRENT_TIMESTAMP
            `;

            const [result] = await this.db.execute(query, [
                school_id, institution_type, head_title, head_name, head_qualification,
                head_contact, head_email, deputy_title, deputy_name, deputy_qualification,
                deputy_contact, deputy_email, registrar_name, registrar_contact, registrar_email,
                deputy_registrar_name, deputy_registrar_contact, deputy_registrar_email,
                academic_director_name, academic_director_contact, academic_director_email,
                admin_staff_count, academic_staff_count, support_staff_count, total_staff_count,
                updated_by
            ]);

            return {
                id: result.insertId,
                school_id,
                success: true,
                message: 'School administration updated successfully'
            };
        } catch (error) {
            console.error('Error upserting school administration:', error);
            throw error;
        }
    }

    // Get all school administrations with summary
    async getAllSummaries() {
        try {
            const query = `
                SELECT
                    sa.school_id,
                    s.name as school_name,
                    s.location as school_location,
                    sa.institution_type,
                    sa.head_title,
                    sa.head_name,
                    sa.total_staff_count,
                    sa.academic_staff_count,
                    sa.admin_staff_count,
                    sa.last_updated,
                    COALESCE(pt.overall_score, 0) as current_performance,
                    COALESCE(pt.performance_deviation, 0) as performance_deviation
                FROM school_administration sa
                JOIN schools s ON sa.school_id = s.id
                LEFT JOIN performance_tracking pt ON sa.school_id = pt.school_id
                    AND pt.tracking_period = (
                        SELECT MAX(tracking_period)
                        FROM performance_tracking pt2
                        WHERE pt2.school_id = sa.school_id
                    )
                ORDER BY s.name
            `;
            const [rows] = await this.db.execute(query);
            return rows;
        } catch (error) {
            console.error('Error getting school administration summaries:', error);
            throw error;
        }
    }

    // Update staff counts automatically
    async updateStaffCounts(schoolId) {
        try {
            const query = `
                UPDATE school_administration sa
                SET
                    admin_staff_count = (
                        SELECT COUNT(*) FROM staff_hierarchy
                        WHERE school_id = sa.school_id AND is_active = TRUE
                        AND department = 'Administration'
                    ),
                    academic_staff_count = (
                        SELECT COUNT(*) FROM staff_hierarchy
                        WHERE school_id = sa.school_id AND is_active = TRUE
                        AND department NOT IN ('Administration', 'Support', 'Maintenance', 'IT', 'Security')
                    ),
                    support_staff_count = (
                        SELECT COUNT(*) FROM staff_hierarchy
                        WHERE school_id = sa.school_id AND is_active = TRUE
                        AND department IN ('Support', 'Maintenance', 'IT', 'Security')
                    ),
                    total_staff_count = (
                        SELECT COUNT(*) FROM staff_hierarchy
                        WHERE school_id = sa.school_id AND is_active = TRUE
                    ),
                    last_updated = CURRENT_TIMESTAMP
                WHERE school_id = ?
            `;
            await this.db.execute(query, [schoolId]);
            return { success: true, message: 'Staff counts updated successfully' };
        } catch (error) {
            console.error('Error updating staff counts:', error);
            throw error;
        }
    }

    // Get administration hierarchy template by institution type
    getHierarchyTemplate(institutionType) {
        const templates = {
            university: {
                leadership: ['Vice Chancellor', 'Deputy Vice Chancellor'],
                administration: ['Registrar', 'Deputy Registrar'],
                academic: ['Academic Director', 'Deans', 'HODs'],
                support: ['Administrative Staff', 'Academic Staff', 'Support Staff']
            },
            college: {
                leadership: ['Principal', 'Deputy Principal'],
                administration: ['Registrar', 'Deputy Registrar'],
                academic: ['HODs', 'Senior Lecturers'],
                support: ['Administrative Staff', 'Technical Staff']
            },
            vocational: {
                leadership: ['Director', 'Deputy Director'],
                administration: ['Registrar', 'Deputy Registrar'],
                academic: ['HODs', 'Instructors'],
                support: ['Administrative Staff', 'Technical Staff']
            },
            senior_school: {
                leadership: ['Principal', 'Deputy Principal'],
                administration: ['Registrar', 'Deputy Registrar'],
                academic: ['HODs', 'Senior Teachers'],
                support: ['Administrative Staff']
            },
            junior_school: {
                leadership: ['Head Teacher', 'Deputy Head Teacher'],
                administration: ['Secretary', 'Assistant Secretary'],
                academic: ['HODs', 'Teachers'],
                support: ['Administrative Staff']
            }
        };

        return templates[institutionType] || templates.college;
    }

    // Validate administration data based on institution type
    validateAdminData(adminData) {
        const { institution_type, head_title, head_name } = adminData;
        const errors = [];

        if (!institution_type) {
            errors.push('Institution type is required');
        }

        if (!head_name) {
            errors.push('Head name is required');
        }

        // Validate head title based on institution type
        const template = this.getHierarchyTemplate(institution_type);
        if (head_title && !template.leadership.includes(head_title)) {
            errors.push(`Invalid head title for ${institution_type}. Expected: ${template.leadership.join(', ')}`);
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (adminData.head_email && !emailRegex.test(adminData.head_email)) {
            errors.push('Invalid head email format');
        }
        if (adminData.deputy_email && !emailRegex.test(adminData.deputy_email)) {
            errors.push('Invalid deputy email format');
        }

        // Phone validation (Kenyan format)
        const phoneRegex = /^(\+254|0)[17]\d{8}$/;
        if (adminData.head_contact && !phoneRegex.test(adminData.head_contact)) {
            errors.push('Invalid head contact format (use Kenyan format: +254XXXXXXXXX or 07XXXXXXXX)');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Auto-detect institution type from school data
    async autoDetectInstitutionType(schoolId) {
        try {
            const query = `
                SELECT level, category, name
                FROM schools
                WHERE id = ?
            `;
            const [rows] = await this.db.execute(query, [schoolId]);
            const school = rows[0];

            if (!school) return null;

            const name = school.name.toLowerCase();
            const level = school.level?.toLowerCase() || '';
            const category = school.category?.toLowerCase() || '';

            // Auto-detection logic
            if (name.includes('university') || level.includes('university') || category.includes('university')) {
                return 'university';
            } else if (name.includes('college') || level.includes('college') || category.includes('tertiary')) {
                return 'college';
            } else if (name.includes('vocational') || name.includes('technical') || category.includes('vocational')) {
                return 'vocational';
            } else if (level.includes('secondary') || level.includes('high school') || category.includes('secondary')) {
                return 'senior_school';
            } else if (level.includes('primary') || level.includes('elementary') || category.includes('primary')) {
                return 'junior_school';
            }

            // Default fallback
            return 'college';
        } catch (error) {
            console.error('Error auto-detecting institution type:', error);
            return 'college'; // Safe default
        }
    }
}

module.exports = SchoolAdmin;