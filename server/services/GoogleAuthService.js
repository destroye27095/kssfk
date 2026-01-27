/**
 * KSFP Google Authentication Service
 * Handles Google OAuth 2.0 token verification and user linking
 */

const { OAuth2Client } = require('google-auth-library');
const UserModel = require('../models/User');

class GoogleAuthService {
    constructor() {
        this.clientId = process.env.GOOGLE_CLIENT_ID;
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        this.client = new OAuth2Client(this.clientId, this.clientSecret);
    }

    /**
     * Verify Google Token
     */
    async verifyToken(token) {
        try {
            const ticket = await this.client.verifyIdToken({
                idToken: token,
                audience: this.clientId
            });

            const payload = ticket.getPayload();

            return {
                valid: true,
                googleId: payload['sub'],
                email: payload['email'],
                name: payload['name'],
                picture: payload['picture'],
                emailVerified: payload['email_verified']
            };
        } catch (error) {
            console.error('Google token verification error:', error);
            return {
                valid: false,
                message: 'Invalid Google token'
            };
        }
    }

    /**
     * Login with Google
     */
    async loginWithGoogle(googleToken, phoneNumber = null) {
        try {
            // Verify token
            const tokenData = await this.verifyToken(googleToken);

            if (!tokenData.valid) {
                return {
                    success: false,
                    message: 'Invalid Google token'
                };
            }

            // Find or create user
            let user = await UserModel.findByGoogleId(tokenData.googleId);

            if (!user) {
                // Create new user
                user = await UserModel.create({
                    full_name: tokenData.name,
                    email: tokenData.email,
                    google_id: tokenData.googleId,
                    phone_number: phoneNumber,
                    role: 'parent',
                    status: 'active'
                });
            } else if (!user.phone_number && phoneNumber) {
                // Update phone number if not set
                user = await UserModel.update(user.id, {
                    phone_number: phoneNumber
                });
            }

            return {
                success: true,
                user: user,
                provider: 'google'
            };
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    }

    /**
     * Link Google Account
     */
    async linkAccount(userId, googleToken) {
        try {
            // Verify token
            const tokenData = await this.verifyToken(googleToken);

            if (!tokenData.valid) {
                return {
                    success: false,
                    message: 'Invalid Google token'
                };
            }

            // Check if Google ID already linked to another account
            const existingUser = await UserModel.findByGoogleId(tokenData.googleId);

            if (existingUser && existingUser.id !== userId) {
                return {
                    success: false,
                    message: 'This Google account is already linked to another KSFP account'
                };
            }

            // Link Google ID to user
            const user = await UserModel.update(userId, {
                google_id: tokenData.googleId,
                email: tokenData.email
            });

            return {
                success: true,
                user: user,
                message: 'Google account linked successfully'
            };
        } catch (error) {
            console.error('Google link error:', error);
            throw error;
        }
    }

    /**
     * Unlink Google Account
     */
    async unlinkAccount(userId) {
        try {
            const user = await UserModel.update(userId, {
                google_id: null
            });

            return {
                success: true,
                user: user,
                message: 'Google account unlinked successfully'
            };
        } catch (error) {
            console.error('Google unlink error:', error);
            throw error;
        }
    }

    /**
     * Get User Info from Google Token
     */
    async getUserInfo(googleToken) {
        try {
            const tokenData = await this.verifyToken(googleToken);

            if (!tokenData.valid) {
                return null;
            }

            return {
                googleId: tokenData.googleId,
                email: tokenData.email,
                name: tokenData.name,
                picture: tokenData.picture,
                emailVerified: tokenData.emailVerified
            };
        } catch (error) {
            console.error('Get user info error:', error);
            return null;
        }
    }

    /**
     * Validate Google Client ID
     */
    isConfigured() {
        return !!this.clientId && !!this.clientSecret;
    }
}

module.exports = new GoogleAuthService();
