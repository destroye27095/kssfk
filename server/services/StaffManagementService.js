// PHASE 5: STAFF MANAGEMENT SERVICE
// Kenya School Fee Platform (KSFP)
// Date: January 27, 2026

const StaffHierarchy = require('../models/StaffHierarchy');
const SchoolAdmin = require('../models/SchoolAdmin');

class StaffManagementService {
    constructor(db) {
        this.db = db;
        this.staffHierarchy = new StaffHierarchy(db);
        this.schoolAdmin = new SchoolAdmin(db);
    }

    // Add new staff member with validation
    async addStaffMember(staffData) {
        try {
            // Validate staff data
            const validation = this.staffHierarchy.validateStaffData(staffData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Check if position already exists and is occupied
            if (staffData.is_head_of_department) {
                const existingHead = await this.getDepartmentHead(staffData.school_id, staffData.department);
                if (existingHead) {
                    throw new Error(`Department ${staffData.department} already has a head: ${existingHead.full_name}`);
                }
            }

            // Create staff member
            const result = await this.staffHierarchy.create(staffData);

            // Update school staff counts
            await this.staffHierarchy.updateSchoolStaffCounts(staffData.school_id);

            return result;
        } catch (error) {
            console.error('Error adding staff member:', error);
            throw error;
        }
    }

    // Update staff member with business rules
    async updateStaffMember(staffId, updateData) {
        try {
            // Get current staff data
            const currentStaff = await this.staffHierarchy.getByStaffId(staffId);
            if (!currentStaff) {
                throw new Error('Staff member not found');
            }

            // Validate update data
            const validation = this.staffHierarchy.validateStaffData({ ...currentStaff, ...updateData });
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            // Check department head conflicts
            if (updateData.is_head_of_department && updateData.department) {
                const existingHead = await this.getDepartmentHead(currentStaff.school_id, updateData.department);
                if (existingHead && existingHead.staff_id !== staffId) {
                    throw new Error(`Department ${updateData.department} already has a head: ${existingHead.full_name}`);
                }
            }

            // Update staff member
            const result = await this.staffHierarchy.update(staffId, updateData);

            // Update school staff counts if department or active status changed
            if (updateData.department || updateData.is_active !== undefined) {
                await this.staffHierarchy.updateSchoolStaffCounts(currentStaff.school_id);
            }

            return result;
        } catch (error) {
            console.error('Error updating staff member:', error);
            throw error;
        }
    }

    // Remove staff member (soft delete)
    async removeStaffMember(staffId, removedBy) {
        try {
            const currentStaff = await this.staffHierarchy.getByStaffId(staffId);
            if (!currentStaff) {
                throw new Error('Staff member not found');
            }

            // Check if this is the only head of department
            if (currentStaff.is_head_of_department) {
                const departmentStaff = await this.staffHierarchy.getBySchoolId(currentStaff.school_id, {
                    department: currentStaff.department,
                    is_active: true
                });
                if (departmentStaff.length <= 1) {
                    throw new Error('Cannot remove the only head of department. Assign a new head first.');
                }
            }

            // Soft delete by setting inactive
            const result = await this.staffHierarchy.update(staffId, {
                is_active: false,
                updated_by: removedBy
            });

            // Update school staff counts
            await this.staffHierarchy.updateSchoolStaffCounts(currentStaff.school_id);

            return {
                ...result,
                message: 'Staff member removed successfully'
            };
        } catch (error) {
            console.error('Error removing staff member:', error);
            throw error;
        }
    }

    // Bulk staff operations
    async bulkStaffOperation(schoolId, operation, staffIds, operationData) {
        try {
            const results = {
                successful: 0,
                failed: 0,
                errors: []
            };

            await this.db.execute('START TRANSACTION');

            for (const staffId of staffIds) {
                try {
                    switch (operation) {
                        case 'update_performance':
                            await this.staffHierarchy.updatePerformance(staffId, operationData);
                            break;
                        case 'change_department':
                            await this.updateStaffMember(staffId, {
                                department: operationData.new_department,
                                updated_by: operationData.updated_by
                            });
                            break;
                        case 'promote_to_senior':
                            await this.updateStaffMember(staffId, {
                                is_senior_staff: true,
                                updated_by: operationData.updated_by
                            });
                            break;
                        case 'demote_from_senior':
                            await this.updateStaffMember(staffId, {
                                is_senior_staff: false,
                                updated_by: operationData.updated_by
                            });
                            break;
                        case 'update_permissions':
                            await this.updateStaffMember(staffId, {
                                can_upload: operationData.can_upload,
                                can_edit: operationData.can_edit,
                                updated_by: operationData.updated_by
                            });
                            break;
                        default:
                            throw new Error(`Unknown operation: ${operation}`);
                    }
                    results.successful++;
                } catch (error) {
                    results.failed++;
                    results.errors.push({
                        staff_id: staffId,
                        error: error.message
                    });
                }
            }

            await this.db.execute('COMMIT');

            return {
                ...results,
                message: `${results.successful} staff members updated successfully, ${results.failed} failed`
            };
        } catch (error) {
            await this.db.execute('ROLLBACK');
            console.error('Error in bulk staff operation:', error);
            throw error;
        }
    }

    // Get department head
    async getDepartmentHead(schoolId, department) {
        try {
            const query = `
                SELECT * FROM staff_hierarchy
                WHERE school_id = ? AND department = ? AND is_head_of_department = TRUE AND is_active = TRUE
                LIMIT 1
            `;
            const [rows] = await this.db.execute(query, [schoolId, department]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error getting department head:', error);
            throw error;
        }
    }

    // Get staff performance summary
    async getStaffPerformanceSummary(schoolId) {
        try {
            const query = `
                SELECT
                    department,
                    COUNT(*) as total_staff,
                    AVG(performance_score) as avg_performance,
                    MIN(performance_score) as min_performance,
                    MAX(performance_score) as max_performance,
                    COUNT(CASE WHEN performance_score >= 85 THEN 1 END) as high_performers,
                    COUNT(CASE WHEN performance_score < 70 THEN 1 END) as needs_improvement
                FROM staff_hierarchy
                WHERE school_id = ? AND is_active = TRUE
                GROUP BY department
                ORDER BY department
            `;
            const [rows] = await this.db.execute(query, [schoolId]);
            return rows;
        } catch (error) {
            console.error('Error getting staff performance summary:', error);
            throw error;
        }
    }

    // Get staff turnover analysis
    async getStaffTurnoverAnalysis(schoolId, months = 12) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - months);

            const query = `
                SELECT
                    COUNT(CASE WHEN hire_date >= ? THEN 1 END) as new_hires,
                    COUNT(CASE WHEN is_active = FALSE AND updated_at >= ? THEN 1 END) as departures,
                    AVG(years_experience) as avg_experience,
                    COUNT(CASE WHEN employment_type = 'contract' THEN 1 END) as contract_staff,
                    COUNT(CASE WHEN employment_type = 'permanent' THEN 1 END) as permanent_staff
                FROM staff_hierarchy
                WHERE school_id = ?
            `;
            const [rows] = await this.db.execute(query, [cutoffDate, cutoffDate, schoolId]);
            const data = rows[0];

            // Calculate turnover rate
            const totalStaff = await this.staffHierarchy.getStaffSummary(schoolId);
            const turnoverRate = totalStaff.total_staff > 0 ?
                (data.departures / totalStaff.total_staff) * 100 : 0;

            return {
                ...data,
                total_staff: totalStaff.total_staff,
                turnover_rate: turnoverRate,
                analysis_period_months: months
            };
        } catch (error) {
            console.error('Error getting staff turnover analysis:', error);
            throw error;
        }
    }

    // Auto-assign department heads
    async autoAssignDepartmentHeads(schoolId, assignedBy = 'system') {
        try {
            const results = {
                assigned: 0,
                skipped: 0,
                errors: []
            };

            // Get departments without heads
            const departmentsQuery = `
                SELECT DISTINCT department
                FROM staff_hierarchy
                WHERE school_id = ? AND is_active = TRUE AND department IS NOT NULL
                AND department NOT IN (
                    SELECT department FROM staff_hierarchy
                    WHERE school_id = ? AND is_head_of_department = TRUE AND is_active = TRUE
                )
            `;
            const [departments] = await this.db.execute(departmentsQuery, [schoolId, schoolId]);

            await this.db.execute('START TRANSACTION');

            for (const dept of departments) {
                try {
                    // Find most senior/experienced staff in department
                    const candidateQuery = `
                        SELECT staff_id, full_name, years_experience, performance_score
                        FROM staff_hierarchy
                        WHERE school_id = ? AND department = ? AND is_active = TRUE
                        ORDER BY is_senior_staff DESC, years_experience DESC, performance_score DESC
                        LIMIT 1
                    `;
                    const [candidates] = await this.db.execute(candidateQuery, [schoolId, dept.department]);

                    if (candidates.length > 0) {
                        await this.updateStaffMember(candidates[0].staff_id, {
                            is_head_of_department: true,
                            updated_by: assignedBy
                        });
                        results.assigned++;
                    } else {
                        results.errors.push(`No suitable candidate for ${dept.department}`);
                    }
                } catch (error) {
                    results.errors.push(`Error assigning head for ${dept.department}: ${error.message}`);
                }
            }

            await this.db.execute('COMMIT');

            return {
                ...results,
                message: `Auto-assigned ${results.assigned} department heads`
            };
        } catch (error) {
            await this.db.execute('ROLLBACK');
            console.error('Error auto-assigning department heads:', error);
            throw error;
        }
    }

    // Generate staff reports
    async generateStaffReport(schoolId, reportType = 'summary') {
        try {
            const reports = {
                summary: async () => {
                    const summary = await this.staffHierarchy.getStaffSummary(schoolId);
                    const performance = await this.getStaffPerformanceSummary(schoolId);
                    const turnover = await this.getStaffTurnoverAnalysis(schoolId);

                    return {
                        type: 'summary',
                        generated_at: new Date(),
                        summary,
                        performance_by_department: performance,
                        turnover_analysis: turnover
                    };
                },

                department: async () => {
                    const structure = await this.staffHierarchy.getDepartmentStructure(schoolId);
                    return {
                        type: 'department',
                        generated_at: new Date(),
                        departments: structure
                    };
                },

                performance: async () => {
                    const performance = await this.getStaffPerformanceSummary(schoolId);
                    const lowPerformers = await this.staffHierarchy.search({
                        school_id: schoolId,
                        performance_max: 69,
                        is_active: true
                    });

                    return {
                        type: 'performance',
                        generated_at: new Date(),
                        department_performance: performance,
                        needs_attention: lowPerformers
                    };
                }
            };

            if (!reports[reportType]) {
                throw new Error(`Unknown report type: ${reportType}`);
            }

            return await reports[reportType]();
        } catch (error) {
            console.error('Error generating staff report:', error);
            throw error;
        }
    }

    // Validate organizational structure
    async validateOrgStructure(schoolId) {
        try {
            const issues = [];

            // Check for departments without heads
            const headlessDeptsQuery = `
                SELECT DISTINCT department
                FROM staff_hierarchy
                WHERE school_id = ? AND is_active = TRUE AND department IS NOT NULL
                AND department NOT IN (
                    SELECT department FROM staff_hierarchy
                    WHERE school_id = ? AND is_head_of_department = TRUE AND is_active = TRUE
                )
            `;
            const [headlessDepts] = await this.db.execute(headlessDeptsQuery, [schoolId, schoolId]);
            if (headlessDepts.length > 0) {
                issues.push({
                    type: 'missing_department_heads',
                    severity: 'warning',
                    message: `Departments without heads: ${headlessDepts.map(d => d.department).join(', ')}`,
                    departments: headlessDepts.map(d => d.department)
                });
            }

            // Check for staff without departments
            const deptlessStaffQuery = `
                SELECT COUNT(*) as count
                FROM staff_hierarchy
                WHERE school_id = ? AND is_active = TRUE AND (department IS NULL OR department = '')
            `;
            const [deptlessStaff] = await this.db.execute(deptlessStaffQuery, [schoolId]);
            if (deptlessStaff[0].count > 0) {
                issues.push({
                    type: 'staff_without_department',
                    severity: 'info',
                    message: `${deptlessStaff[0].count} staff members not assigned to departments`,
                    count: deptlessStaff[0].count
                });
            }

            // Check for inactive senior staff
            const inactiveSeniorQuery = `
                SELECT COUNT(*) as count
                FROM staff_hierarchy
                WHERE school_id = ? AND is_senior_staff = TRUE AND is_active = FALSE
            `;
            const [inactiveSenior] = await this.db.execute(inactiveSeniorQuery, [schoolId]);
            if (inactiveSenior[0].count > 0) {
                issues.push({
                    type: 'inactive_senior_staff',
                    severity: 'warning',
                    message: `${inactiveSenior[0].count} senior staff members are inactive`,
                    count: inactiveSenior[0].count
                });
            }

            return {
                school_id: schoolId,
                validated_at: new Date(),
                issues_count: issues.length,
                issues: issues,
                is_valid: issues.filter(i => i.severity === 'error').length === 0
            };
        } catch (error) {
            console.error('Error validating org structure:', error);
            throw error;
        }
    }

    // Get staff recommendations
    async getStaffRecommendations(schoolId) {
        try {
            const recommendations = [];

            // Check staff-student ratio
            const ratioQuery = `
                SELECT
                    COUNT(*) as staff_count,
                    (SELECT student_count FROM schools WHERE id = ?) as student_count
                FROM staff_hierarchy
                WHERE school_id = ? AND is_active = TRUE
            `;
            const [ratioData] = await this.db.execute(ratioQuery, [schoolId, schoolId]);
            const ratio = ratioData[0].student_count / ratioData[0].staff_count;

            if (ratio > 40) {
                recommendations.push({
                    type: 'staffing',
                    priority: 'high',
                    message: `Staff-student ratio is ${ratio.toFixed(1)}:1, consider hiring more teachers`,
                    current_ratio: ratio
                });
            }

            // Check for low performers
            const lowPerformersQuery = `
                SELECT COUNT(*) as count
                FROM staff_hierarchy
                WHERE school_id = ? AND is_active = TRUE AND performance_score < 70
            `;
            const [lowPerformers] = await this.db.execute(lowPerformersQuery, [schoolId]);
            if (lowPerformers[0].count > 0) {
                recommendations.push({
                    type: 'performance',
                    priority: 'medium',
                    message: `${lowPerformers[0].count} staff members have performance scores below 70`,
                    count: lowPerformers[0].count
                });
            }

            // Check qualification rates
            const qualificationQuery = `
                SELECT
                    COUNT(*) as total,
                    COUNT(CASE WHEN qualification LIKE '%PhD%' OR qualification LIKE '%Masters%' THEN 1 END) as qualified
                FROM staff_hierarchy
                WHERE school_id = ? AND is_active = TRUE
            `;
            const [qualData] = await this.db.execute(qualificationQuery, [schoolId]);
            const qualRate = qualData[0].total > 0 ? (qualData[0].qualified / qualData[0].total) * 100 : 0;

            if (qualRate < 60) {
                recommendations.push({
                    type: 'qualification',
                    priority: 'medium',
                    message: `Only ${qualRate.toFixed(1)}% of staff have advanced qualifications (Masters/PhD)`,
                    qualification_rate: qualRate
                });
            }

            return {
                school_id: schoolId,
                generated_at: new Date(),
                recommendations_count: recommendations.length,
                recommendations: recommendations
            };
        } catch (error) {
            console.error('Error getting staff recommendations:', error);
            throw error;
        }
    }
}

module.exports = StaffManagementService;