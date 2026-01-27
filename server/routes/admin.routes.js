// PHASE 5: ADMIN DASHBOARD ROUTES
// Kenya School Fee Platform (KSFP)
// Date: January 27, 2026

const express = require('express');
const AdminController = require('../controllers/admin.controller');

function createAdminRoutes(db) {
    const router = express.Router();
    const adminController = new AdminController(db);

    // =====================================================
    // DASHBOARD OVERVIEW
    // =====================================================

    /**
     * GET /api/admin/dashboard
     * Get admin dashboard overview with key metrics and recent activity
     */
    router.get('/dashboard', (req, res) => adminController.getDashboardOverview(req, res));

    // =====================================================
    // SCHOOL MANAGEMENT
    // =====================================================

    /**
     * GET /api/admin/schools
     * Get all schools with filtering and pagination
     * Query params: name, location, level, institution_type, min_performance, max_performance, sort_by, sort_order, limit, offset
     */
    router.get('/schools', (req, res) => adminController.getSchools(req, res));

    /**
     * GET /api/admin/schools/:schoolId
     * Get detailed school profile including administration and performance
     */
    router.get('/schools/:schoolId', (req, res) => adminController.getSchoolProfile(req, res));

    /**
     * POST /api/admin/schools
     * Create new school with administration structure
     * Body: { school: {...}, administration: {...} }
     */
    router.post('/schools', (req, res) => adminController.createSchool(req, res));

    /**
     * PUT /api/admin/schools/:schoolId
     * Update existing school and administration data
     * Body: { school: {...}, administration: {...} }
     */
    router.put('/schools/:schoolId', (req, res) => adminController.updateSchool(req, res));

    // =====================================================
    // STAFF MANAGEMENT
    // =====================================================

    /**
     * GET /api/admin/schools/:schoolId/staff
     * Get all staff for a school with filtering
     * Query params: department, position, is_active
     */
    router.get('/schools/:schoolId/staff', (req, res) => adminController.getSchoolStaff(req, res));

    /**
     * POST /api/admin/staff
     * Add new staff member to any school
     * Body: { school_id, full_name, position, department, ... }
     */
    router.post('/staff', (req, res) => adminController.addStaffMember(req, res));

    /**
     * PUT /api/admin/staff/:staffId
     * Update staff member information
     * Body: { full_name, position, department, ... }
     */
    router.put('/staff/:staffId', (req, res) => adminController.updateStaffMember(req, res));

    /**
     * DELETE /api/admin/staff/:staffId
     * Remove staff member (soft delete)
     */
    router.delete('/staff/:staffId', (req, res) => adminController.removeStaffMember(req, res));

    /**
     * POST /api/admin/schools/:schoolId/staff/bulk
     * Perform bulk operations on staff members
     * Body: { operation, staffIds, operationData }
     * Operations: update_performance, change_department, promote_to_senior, demote_from_senior, update_permissions
     */
    router.post('/schools/:schoolId/staff/bulk', (req, res) => adminController.bulkStaffOperation(req, res));

    /**
     * GET /api/admin/schools/:schoolId/staff/performance
     * Get staff performance summary by department
     */
    router.get('/schools/:schoolId/staff/performance', (req, res) => adminController.getStaffPerformanceSummary(req, res));

    // =====================================================
    // PERFORMANCE MANAGEMENT
    // =====================================================

    /**
     * POST /api/admin/schools/:schoolId/performance
     * Calculate school performance for current period
     * Body: { trackingPeriod } (optional, defaults to current quarter)
     */
    router.post('/schools/:schoolId/performance', (req, res) => adminController.calculateSchoolPerformance(req, res));

    /**
     * GET /api/admin/schools/:schoolId/performance/trends
     * Get performance trends over time
     * Query params: periods (default 12)
     */
    router.get('/schools/:schoolId/performance/trends', (req, res) => adminController.getPerformanceTrends(req, res));

    /**
     * GET /api/admin/performance/alerts
     * Get all schools with performance alerts
     */
    router.get('/performance/alerts', (req, res) => adminController.getPerformanceAlerts(req, res));

    /**
     * PUT /api/admin/schools/:schoolId/performance/alerts
     * Update performance alert status
     * Body: { trackingPeriod, alertData: { performance_alert, alert_reason, improvement_required, improvement_areas } }
     */
    router.put('/schools/:schoolId/performance/alerts', (req, res) => adminController.updatePerformanceAlert(req, res));

    /**
     * GET /api/admin/schools/:schoolId/reports/performance
     * Generate performance report
     * Query params: reportType (comprehensive, trends, alerts)
     */
    router.get('/schools/:schoolId/reports/performance', (req, res) => adminController.generatePerformanceReport(req, res));

    // =====================================================
    // ANALYTICS & REPORTS
    // =====================================================

    /**
     * GET /api/admin/analytics/benchmarks
     * Get performance benchmarks by institution type
     * Query params: institutionType (optional)
     */
    router.get('/analytics/benchmarks', (req, res) => adminController.getPerformanceBenchmarks(req, res));

    /**
     * GET /api/admin/schools/:schoolId/reports/staff
     * Generate staff report
     * Query params: reportType (summary, department, performance)
     */
    router.get('/schools/:schoolId/reports/staff', (req, res) => adminController.generateStaffReport(req, res));

    /**
     * GET /api/admin/schools/:schoolId/validation/org-structure
     * Validate organization structure and identify issues
     */
    router.get('/schools/:schoolId/validation/org-structure', (req, res) => adminController.validateOrgStructure(req, res));

    /**
     * GET /api/admin/schools/:schoolId/recommendations/staff
     * Get staff management recommendations
     */
    router.get('/schools/:schoolId/recommendations/staff', (req, res) => adminController.getStaffRecommendations(req, res));

    // =====================================================
    // BULK OPERATIONS
    // =====================================================

    /**
     * POST /api/admin/performance/bulk-calculate
     * Calculate performance for multiple schools
     * Body: { schoolIds, trackingPeriod }
     */
    router.post('/performance/bulk-calculate', (req, res) => adminController.bulkCalculatePerformance(req, res));

    /**
     * POST /api/admin/schools/bulk-import
     * Bulk import schools from data array
     * Body: { schoolsData: [{ name, location, level, ... }, ...] }
     */
    router.post('/schools/bulk-import', (req, res) => adminController.bulkImportSchools(req, res));

    return router;
}

module.exports = createAdminRoutes;