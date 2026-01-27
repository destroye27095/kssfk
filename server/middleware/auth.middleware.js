/**
 * KSFP Authentication Middleware
 * JWT validation, session management, and role-based access control
 */

const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'ksfp-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

/**
 * Verify JWT Token
 */
const verifyToken = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired',
                code: 'TOKEN_EXPIRED'
            });
        }

        return res.status(403).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

/**
 * Generate JWT Token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            phone: user.phone_number,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
};

/**
 * Generate Refresh Token
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            type: 'refresh'
        },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
};

/**
 * Require Auth
 */
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    next();
};

/**
 * Require Specific Role
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

/**
 * Require Phone Verification
 */
const requirePhoneVerification = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const user = await UserModel.findById(req.user.id);

        if (!user?.phone_number) {
            return res.status(403).json({
                success: false,
                message: 'Phone number verification required',
                redirect: '/auth/verify-phone'
            });
        }

        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Verification check failed'
        });
    }
};

/**
 * Optional Auth
 */
const optionalAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                req.user = decoded;
            } catch (error) {
                // Token invalid, but continue without user
            }
        }

        next();
    } catch (error) {
        next();
    }
};

/**
 * Rate Limiter for Auth Endpoints
 */
const authRateLimit = require('express-rate-limit')({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * OTP Rate Limiter
 */
const otpRateLimit = require('express-rate-limit')({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // 3 OTP requests per minute
    message: 'Too many OTP requests, please try again in 1 minute',
    skip: (req) => req.method !== 'POST'
});

/**
 * Log Authentication Action
 */
const logAuthAction = async (action, userId, provider, success, details = {}) => {
    try {
        const logEntry = {
            timestamp: new Date().toISOString(),
            action,
            userId,
            provider,
            success,
            details,
            ip: details.ip || 'unknown'
        };

        // Log to file (in production, use database)
        const fs = require('fs').promises;
        const path = require('path');
        const logPath = path.join(__dirname, '../../logs/auth.log');

        const dir = path.dirname(logPath);
        await fs.mkdir(dir, { recursive: true });

        const logContent = JSON.stringify(logEntry) + '\n';
        await fs.appendFile(logPath, logContent);

        return logEntry;
    } catch (error) {
        console.error('Auth logging error:', error);
    }
};

module.exports = {
    verifyToken,
    generateToken,
    generateRefreshToken,
    requireAuth,
    requireRole,
    requirePhoneVerification,
    optionalAuth,
    authRateLimit,
    otpRateLimit,
    logAuthAction,
    JWT_SECRET,
    JWT_EXPIRY,
    REFRESH_TOKEN_EXPIRY
};
