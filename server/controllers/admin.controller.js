// PHASE 5: ADMIN DASHBOARD CONTROLLER
// Kenya School Fee Platform (KSFP)
// Date: January 27, 2026

const SchoolManagementService = require('../services/SchoolManagementService');
const StaffManagementService = require('../services/StaffManagementService');
const PerformanceAnalysisService = require('../services/PerformanceAnalysisService');
const SchoolAdmin = require('../models/SchoolAdmin');
const StaffHierarchy = require('../models/StaffHierarchy');
const PerformanceTracking = require('../models/PerformanceTracking');

class AdminController {
    constructor(db) {
        this.db = db;
        this.schoolManagement = new SchoolManagementService(db);
        this.staffManagement = new StaffManagementService(db);
        this.performanceAnalysis = new PerformanceAnalysisService(db);
        this.schoolAdmin = new SchoolAdmin(db);
        this.staffHierarchy = new StaffHierarchy(db);
        this.performanceTracking = new PerformanceTracking(db);
    }

    // =====================================================
    // DASHBOARD OVERVIEW
    // =====================================================

    // Get admin dashboard overview
    async getDashboardOverview(req, res) {
        try {
            const [
                schoolsSummary,
                performanceStats,
                alerts,
                recentActivity
            ] = await Promise.all([
                this.schoolManagement.getSchoolsSummary(),
                this.performanceTracking.getPerformanceStatistics(),
                this.performanceTracking.getPerformanceAlerts(),
                this.getRecentActivity()
            ]);

            res.json({
                success: true,
                data: {
                    schools_summary: schoolsSummary,
                    performance_stats: performanceStats,
                    alerts_count: alerts.length,
                    recent_activity: recentActivity,
                    system_health: this.getSystemHealthStatus(schoolsSummary, alerts)
                }
            });
        } catch (error) {
            console.error('Error getting dashboard overview:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to load dashboard overview',
                error: error.message
            });
        }
    }

    // Get recent activity
    async getRecentActivity(limit = 10) {
        try {
            const query = `
                SELECT
                    'staff' as activity_type,
                    sh.full_name as description,
                    sh.created_at as timestamp,
                    s.name as school_name
                FROM staff_hierarchy sh
                JOIN schools s ON sh.school_id = s.id
                WHERE sh.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                UNION ALL
                SELECT
                    'performance' as activity_type,
                    CONCAT('Performance calculated for ', s.name) as description,
                    pt.created_at as timestamp,
                    s.name as school_name
                FROM performance_tracking pt
                JOIN schools s ON pt.school_id = s.id
                WHERE pt.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                ORDER BY timestamp DESC
                LIMIT ?
            `;
            const [rows] = await this.db.execute(query, [limit]);
            return rows;
        } catch (error) {
            console.error('Error getting recent activity:', error);
            return [];
        }
    }

    // Get system health status
    getSystemHealthStatus(schoolsSummary, alerts) {
        let status = 'healthy';
        let score = 100;

        // Deduct points for alerts
        score -= alerts.length * 5;

        // Deduct points for schools without admin data
        if (schoolsSummary.total_schools > 0) {
            const schoolsWithoutAdmin = schoolsSummary.total_schools -
                (schoolsSummary.universities + schoolsSummary.colleges +
                 schoolsSummary.vocational_centers + schoolsSummary.senior_schools +
                 schoolsSummary.junior_schools);
            score -= schoolsWithoutAdmin * 2;
        }

        if (score < 70) status = 'warning';
        if (score < 50) status = 'critical';

        return {
            status: status,
            score: Math.max(0, score),
            alerts_count: alerts.length,
            issues: score < 100 ? ['Performance alerts', 'Incomplete school data'] : []
        };
    }

    // =====================================================
    // SCHOOL MANAGEMENT
    // =====================================================

    // Get all schools with admin data
    async getSchools(req, res) {
        try {
            const filters = {
                name: req.query.name,
                location: req.query.location,
                level: req.query.level,
                institution_type: req.query.institution_type,
                min_performance: req.query.min_performance ? parseFloat(req.query.min_performance) : null,
                max_performance: req.query.max_performance ? parseFloat(req.query.max_performance) : null,
                sort_by: req.query.sort_by,
                sort_order: req.query.sort_order
            };

            const pagination = {
                limit: req.query.limit ? parseInt(req.query.limit) : 50,
                offset: req.query.offset ? parseInt(req.query.offset) : 0
            };

            const schools = await this.schoolManagement.searchSchools(filters, pagination);

            res.json({
                success: true,
                data: schools,
                pagination: {
                    limit: pagination.limit,
                    offset: pagination.offset,
                    has_more: schools.length === pagination.limit
                }
            });
        } catch (error) {
            console.error('Error getting schools:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve schools',
                error: error.message
            });
        }
    }

    // Get school profile
    async getSchoolProfile(req, res) {
        try {
            const { schoolId } = req.params;
            const profile = await this.schoolManagement.getSchoolProfile(parseInt(schoolId));

            res.json({
                success: true,
                data: profile
            });
        } catch (error) {
            console.error('Error getting school profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve school profile',
                error: error.message
            });
        }
    }

    // Create new school
    async createSchool(req, res) {
        try {
            const schoolData = req.body.school;
            const adminData = req.body.administration;

            if (!schoolData || !schoolData.name || !schoolData.location) {
                return res.status(400).json({
                    success: false,
                    message: 'School name and location are required'
                });
            }

            const result = await this.schoolManagement.createSchoolProfile(schoolData, {
                ...adminData,
                created_by: req.user?.id || 'admin'
            });

            res.status(201).json({
                success: true,
                data: result,
                message: 'School created successfully'
            });
        } catch (error) {
            console.error('Error creating school:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create school',
                error: error.message
            });
        }
    }

    // Update school
    async updateSchool(req, res) {
        try {
            const { schoolId } = req.params;
            const schoolData = req.body.school;
            const adminData = req.body.administration;

            const result = await this.schoolManagement.updateSchoolProfile(parseInt(schoolId), schoolData, {
                ...adminData,
                updated_by: req.user?.id || 'admin'
            });

            res.json({
                success: true,
                data: result,
                message: 'School updated successfully'
            });
        } catch (error) {
            console.error('Error updating school:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update school',
                error: error.message
            });
        }
    }

    // =====================================================
    // STAFF MANAGEMENT
    // =====================================================

    // Get staff for a school
    async getSchoolStaff(req, res) {
        try {
            const { schoolId } = req.params;
            const filters = {
                department: req.query.department,
                position: req.query.position,
                is_active: req.query.is_active !== undefined ? req.query.is_active === 'true' : undefined
            };

            const staff = await this.staffHierarchy.getBySchoolId(parseInt(schoolId), filters);

            res.json({
                success: true,
                data: staff
            });
        } catch (error) {
            console.error('Error getting school staff:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve staff',
                error: error.message
            });
        }
    }

    // Add staff member
    async addStaffMember(req, res) {
        try {
            const staffData = {
                ...req.body,
                created_by: req.user?.id || 'admin'
            };

            const result = await this.staffManagement.addStaffMember(staffData);

            res.status(201).json({
                success: true,
                data: result,
                message: 'Staff member added successfully'
            });
        } catch (error) {
            console.error('Error adding staff member:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to add staff member',
                error: error.message
            });
        }
    }

    // Update staff member
    async updateStaffMember(req, res) {
        try {
            const { staffId } = req.params;
            const updateData = {
                ...req.body,
                updated_by: req.user?.id || 'admin'
            };

            const result = await this.staffManagement.updateStaffMember(staffId, updateData);

            res.json({
                success: true,
                data: result,
                message: 'Staff member updated successfully'
            });
        } catch (error) {
            console.error('Error updating staff member:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update staff member',
                error: error.message
            });
        }
    }

    // Remove staff member
    async removeStaffMember(req, res) {
        try {
            const { staffId } = req.params;

            const result = await this.staffManagement.removeStaffMember(staffId, req.user?.id || 'admin');

            res.json({
                success: true,
                data: result,
                message: 'Staff member removed successfully'
            });
        } catch (error) {
            console.error('Error removing staff member:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove staff member',
                error: error.message
            });
        }
    }

    // Bulk staff operations
    async bulkStaffOperation(req, res) {
        try {
            const { schoolId } = req.params;
            const { operation, staffIds, operationData } = req.body;

            const result = await this.staffManagement.bulkStaffOperation(
                parseInt(schoolId),
                operation,
                staffIds,
                {
                    ...operationData,
                    updated_by: req.user?.id || 'admin'
                }
            );

            res.json({
                success: true,
                data: result,
                message: 'Bulk operation completed'
            });
        } catch (error) {
            console.error('Error in bulk staff operation:', error);
            res.status(500).json({
                success: false,
                message: 'Bulk operation failed',
                error: error.message
            });
        }
    }

    // Get staff performance summary
    async getStaffPerformanceSummary(req, res) {
        try {
            const { schoolId } = req.params;
            const summary = await this.staffManagement.getStaffPerformanceSummary(parseInt(schoolId));

            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Error getting staff performance summary:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get performance summary',
                error: error.message
            });
        }
    }

    // =====================================================
    // PERFORMANCE MANAGEMENT
    // =====================================================

    // Calculate school performance
    async calculateSchoolPerformance(req, res) {
        try {
            const { schoolId } = req.params;
            const { trackingPeriod } = req.body;

            const period = trackingPeriod || this.schoolManagement.getCurrentTrackingPeriod();

            const result = await this.performanceAnalysis.calculateSchoolPerformance(
                parseInt(schoolId),
                period,
                req.user?.id || 'admin'
            );

            res.json({
                success: true,
                data: result,
                message: 'Performance calculated successfully'
            });
        } catch (error) {
            console.error('Error calculating school performance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to calculate performance',
                error: error.message
            });
        }
    }

    // Get performance trends
    async getPerformanceTrends(req, res) {
        try {
            const { schoolId } = req.params;
            const periods = req.query.periods ? parseInt(req.query.periods) : 12;

            const trends = await this.performanceTracking.getPerformanceTrends(parseInt(schoolId), periods);

            res.json({
                success: true,
                data: trends
            });
        } catch (error) {
            console.error('Error getting performance trends:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get performance trends',
                error: error.message
            });
        }
    }

    // Get performance alerts
    async getPerformanceAlerts(req, res) {
        try {
            const alerts = await this.performanceTracking.getPerformanceAlerts();

            res.json({
                success: true,
                data: alerts
            });
        } catch (error) {
            console.error('Error getting performance alerts:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get performance alerts',
                error: error.message
            });
        }
    }

    // Update performance alert
    async updatePerformanceAlert(req, res) {
        try {
            const { schoolId } = req.params;
            const { trackingPeriod, alertData } = req.body;

            const result = await this.performanceTracking.updateAlertStatus(
                parseInt(schoolId),
                trackingPeriod,
                alertData
            );

            res.json({
                success: true,
                data: result,
                message: 'Alert status updated successfully'
            });
        } catch (error) {
            console.error('Error updating performance alert:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update alert status',
                error: error.message
            });
        }
    }

    // Generate performance report
    async generatePerformanceReport(req, res) {
        try {
            const { schoolId } = req.params;
            const { reportType } = req.query;

            const report = await this.performanceAnalysis.generatePerformanceReport(
                parseInt(schoolId),
                reportType || 'comprehensive'
            );

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Error generating performance report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate report',
                error: error.message
            });
        }
    }

    // =====================================================
    // ANALYTICS & REPORTS
    // =====================================================

    // Get performance benchmarks
    async getPerformanceBenchmarks(req, res) {
        try {
            const { institutionType } = req.query;

            const benchmarks = await this.performanceAnalysis.getPerformanceBenchmarks(institutionType);

            res.json({
                success: true,
                data: benchmarks
            });
        } catch (error) {
            console.error('Error getting performance benchmarks:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get benchmarks',
                error: error.message
            });
        }
    }

    // Generate staff report
    async generateStaffReport(req, res) {
        try {
            const { schoolId } = req.params;
            const { reportType } = req.query;

            const report = await this.staffManagement.generateStaffReport(
                parseInt(schoolId),
                reportType || 'summary'
            );

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Error generating staff report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate staff report',
                error: error.message
            });
        }
    }

    // Validate organization structure
    async validateOrgStructure(req, res) {
        try {
            const { schoolId } = req.params;

            const validation = await this.staffManagement.validateOrgStructure(parseInt(schoolId));

            res.json({
                success: true,
                data: validation
            });
        } catch (error) {
            console.error('Error validating org structure:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to validate organization structure',
                error: error.message
            });
        }
    }

    // Get staff recommendations
    async getStaffRecommendations(req, res) {
        try {
            const { schoolId } = req.params;

            const recommendations = await this.staffManagement.getStaffRecommendations(parseInt(schoolId));

            res.json({
                success: true,
                data: recommendations
            });
        } catch (error) {
            console.error('Error getting staff recommendations:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get recommendations',
                error: error.message
            });
        }
    }

    // =====================================================
    // BULK OPERATIONS
    // =====================================================

    // Bulk calculate performance
    async bulkCalculatePerformance(req, res) {
        try {
            const { schoolIds, trackingPeriod } = req.body;

            const period = trackingPeriod || this.schoolManagement.getCurrentTrackingPeriod();

            const result = await this.performanceAnalysis.bulkCalculatePerformance(
                schoolIds,
                period,
                req.user?.id || 'admin'
            );

            res.json({
                success: true,
                data: result,
                message: 'Bulk performance calculation completed'
            });
        } catch (error) {
            console.error('Error in bulk performance calculation:', error);
            res.status(500).json({
                success: false,
                message: 'Bulk calculation failed',
                error: error.message
            });
        }
    }

    // Bulk import schools
    async bulkImportSchools(req, res) {
        try {
            const { schoolsData } = req.body;

            if (!Array.isArray(schoolsData)) {
                return res.status(400).json({
                    success: false,
                    message: 'schoolsData must be an array'
                });
            }

            const result = await this.schoolManagement.bulkImportSchools(
                schoolsData,
                req.user?.id || 'admin'
            );

            res.json({
                success: true,
                data: result,
                message: 'Bulk import completed'
            });
        } catch (error) {
            console.error('Error in bulk import:', error);
            res.status(500).json({
                success: false,
                message: 'Bulk import failed',
                error: error.message
            });
        }
    }
}

module.exports = AdminController;