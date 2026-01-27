/* ============================================
   KSFP MAIN SERVER
   Kenya School Fee Platform v1.0 Enterprise Edition
   ============================================ */

const express = require('express');
const path = require('path');
const fs = require('fs');

// Import middleware
const { acidTransactionMiddleware } = require('./middleware/transaction.middleware');
const { immutableLoggingMiddleware, ImmutableLogger } = require('./middleware/logging.middleware');

// Import routes
const schoolRoutes = require('./routes/schools.routes');
const adminRoutes = require('./routes/admin.routes');
const paymentsRoutes = require('./routes/payments.routes');
const uploadsRoutes = require('./routes/uploads.routes');
const vacanciesRoutes = require('./routes/vacancies.routes');
const jobsRoutes = require('./routes/jobs.routes');
const penaltyRoutes = require('./routes/penalties.routes');
const ratingsRoutes = require('./routes/ratings.routes');
const receiptsRoutes = require('./routes/receipts.routes');
const authRoutes = require('./routes/auth.routes');

// Import services
const RatingService = require('./services/RatingService');
const PaymentService = require('./services/PaymentService');
const PenaltyService = require('./services/PenaltyService');
const PDFService = require('./services/PDFService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS - Updated for OAuth support
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

// Immutable logging middleware
app.use(immutableLoggingMiddleware);

// ACID transaction middleware
app.use(acidTransactionMiddleware);

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// ============================================
// CORE ENDPOINTS
// ============================================

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        platform: 'KSFP',
        version: '1.0',
        edition: 'Enterprise',
        timestamp: new Date().toISOString(),
        signature: 'Served by KSFP courtesy of the school looked in'
    });
});

/**
 * Admin Dashboard
 */
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin-dashboard.html'));
});

/**
 * About KSFP
 */
app.get('/api/about', (req, res) => {
    res.status(200).json({
        name: 'Kenya School Fee Platform (KSFP)',
        version: '1.0',
        edition: 'Enterprise',
        description: 'National-scale school discovery and fee management platform',
        features: [
            'School directory with star ratings (1-5)',
            'Secure parent payment processing',
            'ACID-compliant transactions',
            'PDF receipt generation with signature',
            'Immutable audit trails',
            'Fraud detection and penalty enforcement',
            'Comprehensive legal framework'
        ],
        developer: {
            name: 'Wamoto Raphael',
            institution: 'Meru University',
            email: 'wamotoraphael327@gmail.com',
            phone: '+254 768 331 888'
        },
        timestamp: new Date().toISOString()
    });
});

// ============================================
// API ROUTES
// ============================================

// Authentication (secured endpoints, rate limiting)
app.use('/api/auth', authRoutes);

// Schools endpoint
app.use('/', schoolRoutes);

// Payments (ACID-compliant)
app.use('/', paymentsRoutes);

// Receipts (PDF management)
app.use('/', receiptsRoutes);

// Ratings (Star system)
app.use('/', ratingsRoutes);

// Admin features
app.use('/api/admin', adminRoutes);

// Uploads
app.use('/', uploadsRoutes);

// Vacancies
app.use('/', vacanciesRoutes);

// Jobs
app.use('/', jobsRoutes);

// Penalties
app.use('/api/penalties', penaltyRoutes);

// ============================================
// ANALYTICS & REPORTING ENDPOINTS
// ============================================

/**
 * GET /api/analytics/payments
 * Payment statistics
 */
app.get('/api/analytics/payments', (req, res) => {
    try {
        const stats = PaymentService.getPaymentStats();
        res.status(200).json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/analytics/penalties
 * Penalty statistics
 */
app.get('/api/analytics/penalties', (req, res) => {
    try {
        const stats = PenaltyService.getPenaltyStats();
        res.status(200).json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/analytics/ratings/:schoolId
 * Detailed rating breakdown
 */
app.get('/api/analytics/ratings/:schoolId', (req, res) => {
    try {
        const schoolsPath = path.join(__dirname, '../data/schools.json');
        
        if (!fs.existsSync(schoolsPath)) {
            return res.status(404).json({ success: false, error: 'Schools not found' });
        }

        const schools = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));
        const school = schools.find(s => s.id === req.params.schoolId);

        if (!school) {
            return res.status(404).json({ success: false, error: 'School not found' });
        }

        const rating = RatingService.calculateRating(school);

        res.status(200).json({
            success: true,
            schoolId: req.params.schoolId,
            schoolName: school.name,
            rating: {
                stars: rating.stars,
                visual: RatingService.getStarVisual(rating.stars),
                status: RatingService.getRatingStatus(rating.stars),
                breakdown: rating.breakdown,
                lastUpdated: rating.lastUpdated
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// AUDIT & COMPLIANCE ENDPOINTS
// ============================================

/**
 * GET /api/audit/logs/:category
 * Retrieve immutable logs (admin only)
 */
app.get('/api/audit/logs/:category', (req, res) => {
    try {
        // Check admin role
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        const result = ImmutableLogger.readLogEntries(req.params.category, req.query.limit || 100);

        res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/audit/logs/:category/verify
 * Verify log integrity
 */
app.get('/api/audit/logs/:category/verify', (req, res) => {
    try {
        const result = ImmutableLogger.verifyLogIntegrity(req.params.category);

        res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/audit/export/:category
 * Export logs for audit
 */
app.post('/api/audit/export/:category', (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Admin access required'
            });
        }

        const format = req.body.format || 'json';
        const result = ImmutableLogger.exportLog(req.params.category, format);

        if (result.success) {
            if (format === 'csv') {
                res.set('Content-Type', 'text/csv');
                res.set('Content-Disposition', `attachment; filename="${req.params.category}.csv"`);
                res.send(result.data);
            } else {
                res.status(200).json(result);
            }
        } else {
            res.status(400).json(result);
        }

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// FRONTEND PAGES
// ============================================

/**
 * Serve HTML pages
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/school-dashboard.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/about.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

/**
 * 404 Not Found
 */
app.use((req, res) => {
    ImmutableLogger.logEvent('errors', 'NOT_FOUND', {
        method: req.method,
        path: req.path
    });

    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

/**
 * Global error handler
 */
app.use((error, req, res, next) => {
    console.error('Server error:', error);

    ImmutableLogger.logEvent('errors', 'SERVER_ERROR', {
        method: req.method,
        path: req.path,
        error: error.message
    });

    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred'
    });
});

// ============================================
// SERVER INITIALIZATION
// ============================================

// Create required directories
const requiredDirs = [
    path.join(__dirname, '../data'),
    path.join(__dirname, '../logs'),
    path.join(__dirname, '../storage/receipts'),
    path.join(__dirname, '../storage/uploads'),
    path.join(__dirname, '../storage/backups')
];

requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║  Kenya School Fee Platform (KSFP) v1.0 Enterprise Edition  ║
╠════════════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                                  ║
║  Status: Production Ready                                   ║
║  Features: Star Ratings, ACID Payments, Immutable Logs     ║
║  Signature: Served by KSFP courtesy of the school looked in║
╚════════════════════════════════════════════════════════════╝
    `);

    ImmutableLogger.logEvent('system', 'SERVER_STARTED', {
        port: PORT,
        version: '1.0',
        timestamp: new Date().toISOString()
    });
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    
    ImmutableLogger.logEvent('system', 'SERVER_SHUTDOWN', {
        reason: 'SIGTERM',
        timestamp: new Date().toISOString()
    });

    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

module.exports = app;
