/* ============================================
   Logging Middleware
   ============================================ */

const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '../../data/logs');

// Ensure logs directory exists
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const logMiddleware = (req, res, next) => {
    // Capture request details
    const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        body: req.body
    };
    
    // Log to appropriate file based on request type
    let logFile = 'general.log';
    
    if (req.path.includes('/uploads')) {
        logFile = 'uploads.log';
    } else if (req.path.includes('/payments')) {
        logFile = 'payments.log';
    } else if (req.path.includes('/admin')) {
        logFile = 'admin.log';
    }
    
    const logPath = path.join(logsDir, logFile);
    const logData = JSON.stringify(logEntry) + '\n';
    
    fs.appendFile(logPath, logData, (err) => {
        if (err) console.error('Logging error:', err);
    });
    
    next();
};

module.exports = logMiddleware;
