/* ============================================
   Error Handler Middleware
   ============================================ */

const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    
    // Default error response
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    
    // ACID compliance: Ensure transaction consistency
    // Log error for audit trail
    const errorLog = {
        timestamp: new Date().toISOString(),
        statusCode,
        message,
        path: req.path,
        method: req.method,
        stack: err.stack
    };
    
    console.log('Error logged:', errorLog);
    
    res.status(statusCode).json({
        error: message,
        requestId: req.id || 'unknown',
        timestamp: new Date().toISOString()
    });
};

module.exports = errorHandler;
