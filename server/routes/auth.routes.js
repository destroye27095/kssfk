/**
 * KSFP Authentication Routes
 * Express route definitions for all authentication endpoints
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const {
    verifyToken,
    requireAuth,
    requirePhoneVerification,
    authRateLimit,
    otpRateLimit
} = require('../middleware/auth.middleware');

/**
 * ==========================================
 * GOOGLE AUTHENTICATION ROUTES
 * ==========================================
 */

/**
 * POST /api/auth/google/login
 * @description Login with Google OAuth token
 * @body {token: string} Google OAuth token
 * @returns {token, refresh_token, user}
 */
router.post('/google/login', authRateLimit, authController.googleLogin);

/**
 * POST /api/auth/google/link
 * @description Link Google account to logged-in user
 * @body {token: string} Google OAuth token
 * @auth required
 * @returns {success, user}
 */
router.post('/google/link', requireAuth, authController.googleLink);

/**
 * POST /api/auth/google/unlink
 * @description Unlink Google account from user
 * @auth required
 * @returns {success, user}
 */
router.post('/google/unlink', requireAuth, authController.googleUnlink);

/**
 * ==========================================
 * FACEBOOK AUTHENTICATION ROUTES
 * ==========================================
 */

/**
 * POST /api/auth/facebook/login
 * @description Login with Facebook OAuth token
 * @body {access_token: string} Facebook access token
 * @returns {token, refresh_token, user}
 */
router.post('/facebook/login', authRateLimit, authController.facebookLogin);

/**
 * POST /api/auth/facebook/link
 * @description Link Facebook account to logged-in user
 * @body {access_token: string} Facebook access token
 * @auth required
 * @returns {success, user}
 */
router.post('/facebook/link', requireAuth, authController.facebookLink);

/**
 * POST /api/auth/facebook/unlink
 * @description Unlink Facebook account from user
 * @auth required
 * @returns {success, user}
 */
router.post('/facebook/unlink', requireAuth, authController.facebookUnlink);

/**
 * ==========================================
 * PHONE AUTHENTICATION ROUTES
 * ==========================================
 */

/**
 * POST /api/auth/phone/send-otp
 * @description Send OTP to phone number
 * @body {phone_number: string} Phone number in +254 format
 * @returns {user_id, phoneNumber, message}
 */
router.post('/phone/send-otp', otpRateLimit, authController.sendOTP);

/**
 * POST /api/auth/verify-otp
 * @description Verify OTP and create session
 * @body {user_id: string, phone_number: string, otp: string} OTP verification
 * @returns {token, refresh_token, user}
 */
router.post('/verify-otp', authRateLimit, authController.verifyOTP);

/**
 * POST /api/auth/resend-otp
 * @description Resend OTP code (30-second cooldown)
 * @body {user_id: string, phone_number: string} User & phone
 * @returns {success, message, waitSeconds}
 */
router.post('/resend-otp', otpRateLimit, authController.resendOTP);

/**
 * ==========================================
 * SESSION MANAGEMENT ROUTES
 * ==========================================
 */

/**
 * POST /api/auth/refresh
 * @description Refresh access token using refresh token
 * @body {refresh_token: string} Refresh token
 * @auth required
 * @returns {token, expires_in}
 */
router.post('/refresh', verifyToken, authController.refreshToken);

/**
 * POST /api/auth/logout
 * @description Logout and invalidate session
 * @auth required
 * @returns {success}
 */
router.post('/logout', verifyToken, authController.logout);

/**
 * ==========================================
 * REGISTRATION ROUTES
 * ==========================================
 */

/**
 * POST /api/auth/register
 * @description Register new user (phone-based)
 * @body {full_name: string, email: string, phone_number: string, role: string} User data
 * @returns {user_id, phoneNumber, message}
 */
router.post('/register', authRateLimit, authController.register);

/**
 * ==========================================
 * ACCOUNT MANAGEMENT ROUTES
 * ==========================================
 */

/**
 * GET /api/auth/me
 * @description Get current logged-in user info
 * @auth required
 * @returns {user: {...}}
 */
router.get('/me', verifyToken, authController.getMe);

/**
 * POST /api/auth/account/update
 * @description Update user account (name, email)
 * @body {full_name?: string, email?: string} Fields to update
 * @auth required
 * @returns {success, user}
 */
router.post('/account/update', requireAuth, authController.updateAccount);

/**
 * POST /api/auth/unlink/:provider
 * @description Unlink authentication provider
 * @param {string} provider google|facebook|phone
 * @auth required
 * @returns {success, user}
 */
router.post('/unlink/:provider', requireAuth, authController.unlink);

/**
 * ==========================================
 * LOGGING ROUTES
 * ==========================================
 */

/**
 * POST /api/auth/log
 * @description Log authentication action
 * @body {action: string, provider: string, success: boolean, message?: string}
 * @auth optional
 * @returns {success}
 */
router.post('/log', authController.logAction);

/**
 * ==========================================
 * ERROR HANDLING MIDDLEWARE
 * ==========================================
 */

/**
 * 404 handler for undefined routes
 */
router.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Authentication endpoint not found',
        path: req.path,
        method: req.method
    });
});

module.exports = router;
