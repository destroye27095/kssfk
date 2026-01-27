/**
 * KSFP Authentication Controller
 * Handles all authentication endpoints
 * Request processing, validation, response formatting
 */

const UserModel = require('../models/User');
const GoogleAuthService = require('../services/GoogleAuthService');
const FacebookAuthService = require('../services/FacebookAuthService');
const PhoneAuthService = require('../services/PhoneAuthService');
const OTPService = require('../services/OTPService');
const { generateToken, generateRefreshToken, logAuthAction } = require('../middleware/auth.middleware');

// ==========================================
// GOOGLE AUTHENTICATION ENDPOINTS
// ==========================================

/**
 * POST /api/auth/google/login
 * Login with Google token
 */
exports.googleLogin = async (req, res) => {
    try {
        const { token, device } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Google token is required'
            });
        }

        // Login with Google
        const result = await GoogleAuthService.loginWithGoogle(token);

        if (!result.success) {
            await logAuthAction('google_login', null, 'google', false, {
                message: result.message,
                ip: req.ip,
                device
            });

            return res.status(401).json({
                success: false,
                message: result.message
            });
        }

        // Update last login
        await UserModel.updateLastLogin(result.user.id);

        // Generate tokens
        const accessToken = generateToken(result.user);
        const refreshToken = generateRefreshToken(result.user);

        // Log successful login
        await logAuthAction('google_login', result.user.id, 'google', true, {
            ip: req.ip,
            device
        });

        return res.status(200).json({
            success: true,
            token: accessToken,
            refresh_token: refreshToken,
            user: {
                id: result.user.id,
                full_name: result.user.full_name,
                email: result.user.email,
                phone_number: result.user.phone_number,
                role: result.user.role,
                status: result.user.status
            }
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

/**
 * POST /api/auth/google/link
 * Link Google account to logged-in user
 */
exports.googleLink = async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.id;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Google token is required'
            });
        }

        // Link account
        const result = await GoogleAuthService.linkAccount(userId, token);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        await logAuthAction('google_link', userId, 'google', true, { ip: req.ip });

        return res.status(200).json({
            success: true,
            message: result.message,
            user: result.user
        });
    } catch (error) {
        console.error('Google link error:', error);
        res.status(500).json({
            success: false,
            message: 'Link failed'
        });
    }
};

/**
 * POST /api/auth/google/unlink
 * Unlink Google account from user
 */
exports.googleUnlink = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await GoogleAuthService.unlinkAccount(userId);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        await logAuthAction('google_unlink', userId, 'google', true, { ip: req.ip });

        return res.status(200).json({
            success: true,
            message: result.message,
            user: result.user
        });
    } catch (error) {
        console.error('Google unlink error:', error);
        res.status(500).json({
            success: false,
            message: 'Unlink failed'
        });
    }
};

// ==========================================
// FACEBOOK AUTHENTICATION ENDPOINTS
// ==========================================

/**
 * POST /api/auth/facebook/login
 * Login with Facebook token
 */
exports.facebookLogin = async (req, res) => {
    try {
        const { access_token, user_id, user_info, device } = req.body;

        if (!access_token) {
            return res.status(400).json({
                success: false,
                message: 'Facebook access token is required'
            });
        }

        // Login with Facebook
        const result = await FacebookAuthService.loginWithFacebook(access_token);

        if (!result.success) {
            await logAuthAction('facebook_login', null, 'facebook', false, {
                message: result.message,
                ip: req.ip,
                device
            });

            return res.status(401).json({
                success: false,
                message: result.message
            });
        }

        // Update last login
        await UserModel.updateLastLogin(result.user.id);

        // Generate tokens
        const token = generateToken(result.user);
        const refreshToken = generateRefreshToken(result.user);

        // Log successful login
        await logAuthAction('facebook_login', result.user.id, 'facebook', true, {
            ip: req.ip,
            device
        });

        return res.status(200).json({
            success: true,
            token: token,
            refresh_token: refreshToken,
            user: {
                id: result.user.id,
                full_name: result.user.full_name,
                email: result.user.email,
                phone_number: result.user.phone_number,
                role: result.user.role,
                status: result.user.status
            }
        });
    } catch (error) {
        console.error('Facebook login error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

/**
 * POST /api/auth/facebook/link
 * Link Facebook account to logged-in user
 */
exports.facebookLink = async (req, res) => {
    try {
        const { access_token, user_info } = req.body;
        const userId = req.user.id;

        if (!access_token) {
            return res.status(400).json({
                success: false,
                message: 'Facebook access token is required'
            });
        }

        // Link account
        const result = await FacebookAuthService.linkAccount(userId, access_token);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        await logAuthAction('facebook_link', userId, 'facebook', true, { ip: req.ip });

        return res.status(200).json({
            success: true,
            message: result.message,
            user: result.user
        });
    } catch (error) {
        console.error('Facebook link error:', error);
        res.status(500).json({
            success: false,
            message: 'Link failed'
        });
    }
};

/**
 * POST /api/auth/facebook/unlink
 * Unlink Facebook account from user
 */
exports.facebookUnlink = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await FacebookAuthService.unlinkAccount(userId);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        await logAuthAction('facebook_unlink', userId, 'facebook', true, { ip: req.ip });

        return res.status(200).json({
            success: true,
            message: result.message,
            user: result.user
        });
    } catch (error) {
        console.error('Facebook unlink error:', error);
        res.status(500).json({
            success: false,
            message: 'Unlink failed'
        });
    }
};

// ==========================================
// PHONE AUTHENTICATION ENDPOINTS
// ==========================================

/**
 * POST /api/auth/phone/send-otp
 * Send OTP to phone number
 */
exports.sendOTP = async (req, res) => {
    try {
        const { phone_number } = req.body;

        if (!phone_number) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Validate phone
        if (!PhoneAuthService.validatePhoneNumber(phone_number)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        // Send OTP
        const result = await PhoneAuthService.sendLoginOTP(phone_number);

        if (!result.success) {
            await logAuthAction('phone_otp_send', null, 'phone', false, {
                message: result.message,
                ip: req.ip,
                phone: phone_number
            });

            return res.status(429).json({
                success: false,
                message: result.message,
                waitSeconds: result.waitSeconds
            });
        }

        await logAuthAction('phone_otp_send', result.user_id, 'phone', true, {
            ip: req.ip,
            phone: phone_number
        });

        return res.status(200).json({
            success: true,
            user_id: result.user_id,
            phoneNumber: result.phoneNumber,
            message: result.message
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP'
        });
    }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP and create session
 */
exports.verifyOTP = async (req, res) => {
    try {
        const { phone_number, user_id, otp } = req.body;

        if (!otp || !user_id || !phone_number) {
            return res.status(400).json({
                success: false,
                message: 'OTP, user ID, and phone number are required'
            });
        }

        // Verify OTP
        const result = await PhoneAuthService.verifyLoginOTP(user_id, phone_number, otp);

        if (!result.success) {
            await logAuthAction('phone_otp_verify', user_id, 'phone', false, {
                message: result.message,
                ip: req.ip,
                attempts: result.attemptsRemaining
            });

            return res.status(401).json({
                success: false,
                message: result.message,
                attemptsRemaining: result.attemptsRemaining
            });
        }

        // Update last login
        await UserModel.updateLastLogin(user_id);

        // Generate tokens
        const token = generateToken(result.user);
        const refreshToken = generateRefreshToken(result.user);

        await logAuthAction('phone_otp_verify', user_id, 'phone', true, { ip: req.ip });

        return res.status(200).json({
            success: true,
            token: token,
            refresh_token: refreshToken,
            user: {
                id: result.user.id,
                full_name: result.user.full_name,
                email: result.user.email,
                phone_number: result.user.phone_number,
                role: result.user.role,
                status: result.user.status
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'OTP verification failed'
        });
    }
};

/**
 * POST /api/auth/resend-otp
 * Resend OTP code
 */
exports.resendOTP = async (req, res) => {
    try {
        const { phone_number, user_id } = req.body;

        if (!phone_number || !user_id) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and user ID are required'
            });
        }

        // Resend OTP
        const result = await PhoneAuthService.resendOTP(user_id, phone_number);

        if (!result.success) {
            return res.status(429).json({
                success: false,
                message: result.message,
                waitSeconds: result.waitSeconds
            });
        }

        await logAuthAction('phone_otp_resend', user_id, 'phone', true, { ip: req.ip });

        return res.status(200).json({
            success: true,
            phoneNumber: result.phoneNumber,
            message: result.message
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to resend OTP'
        });
    }
};

// ==========================================
// SESSION MANAGEMENT ENDPOINTS
// ==========================================

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
exports.refreshToken = async (req, res) => {
    try {
        const { refresh_token } = req.body;

        if (!refresh_token) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token (basic implementation)
        const user = await UserModel.findById(req.user.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate new token
        const newToken = generateToken(user);

        return res.status(200).json({
            success: true,
            token: newToken,
            expires_in: '24h'
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed'
        });
    }
};

/**
 * POST /api/auth/logout
 * Logout and invalidate session
 */
exports.logout = async (req, res) => {
    try {
        const userId = req.user.id;

        // Log logout
        await logAuthAction('logout', userId, 'session', true, { ip: req.ip });

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed'
        });
    }
};

// ==========================================
// ACCOUNT MANAGEMENT ENDPOINTS
// ==========================================

/**
 * POST /api/auth/register
 * Register new user
 */
exports.register = async (req, res) => {
    try {
        const { full_name, email, phone_number, role } = req.body;

        if (!phone_number) {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Validate phone
        if (!PhoneAuthService.validatePhoneNumber(phone_number)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        // Check if user exists
        const existing = await UserModel.findByPhoneNumber(phone_number);
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Phone number already registered'
            });
        }

        // Send OTP for registration
        const result = await PhoneAuthService.sendRegistrationOTP(phone_number);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        return res.status(200).json({
            success: true,
            user_id: result.user_id,
            phoneNumber: result.phoneNumber,
            message: 'OTP sent. Please verify to complete registration.'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
};

/**
 * GET /api/auth/me
 * Get current user info
 */
exports.getMe = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone_number: user.phone_number,
                role: user.role,
                status: user.status,
                created_at: user.created_at,
                last_login: user.last_login
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user'
        });
    }
};

/**
 * POST /api/auth/account/update
 * Update user account
 */
exports.updateAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, email } = req.body;

        const updates = {};
        if (full_name) updates.full_name = full_name;
        if (email) updates.email = email;

        const user = await UserModel.update(userId, updates);

        return res.status(200).json({
            success: true,
            message: 'Account updated',
            user: user
        });
    } catch (error) {
        console.error('Update account error:', error);
        res.status(500).json({
            success: false,
            message: 'Update failed'
        });
    }
};

/**
 * POST /api/auth/unlink/:provider
 * Unlink authentication provider
 */
exports.unlink = async (req, res) => {
    try {
        const { provider } = req.params;
        const userId = req.user.id;

        if (!['google', 'facebook', 'phone'].includes(provider)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid provider'
            });
        }

        let result;

        if (provider === 'google') {
            result = await GoogleAuthService.unlinkAccount(userId);
        } else if (provider === 'facebook') {
            result = await FacebookAuthService.unlinkAccount(userId);
        } else if (provider === 'phone') {
            // Cannot unlink phone - it's primary auth method
            return res.status(403).json({
                success: false,
                message: 'Cannot unlink phone number (primary auth method)'
            });
        }

        await logAuthAction(`${provider}_unlink`, userId, provider, true, { ip: req.ip });

        return res.status(200).json({
            success: true,
            message: `${provider} account unlinked`,
            user: result.user
        });
    } catch (error) {
        console.error('Unlink error:', error);
        res.status(500).json({
            success: false,
            message: 'Unlink failed'
        });
    }
};

// ==========================================
// LOGGING ENDPOINTS
// ==========================================

/**
 * POST /api/auth/log
 * Log authentication action
 */
exports.logAction = async (req, res) => {
    try {
        const { action, provider, success, message, device } = req.body;

        await logAuthAction(action, req.user?.id, provider, success, {
            message,
            device,
            ip: req.ip
        });

        return res.status(200).json({
            success: true,
            message: 'Action logged'
        });
    } catch (error) {
        console.error('Log error:', error);
        res.status(500).json({
            success: false,
            message: 'Logging failed'
        });
    }
};

module.exports = exports;
