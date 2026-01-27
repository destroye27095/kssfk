/**
 * KSFP Facebook Authentication Service
 * Handles Facebook OAuth token verification and user linking
 */

const axios = require('axios');
const UserModel = require('../models/User');

class FacebookAuthService {
    constructor() {
        this.appId = process.env.FACEBOOK_APP_ID;
        this.appSecret = process.env.FACEBOOK_APP_SECRET;
        this.apiVersion = 'v18.0';
        this.graphUrl = `https://graph.facebook.com/${this.apiVersion}`;
    }

    /**
     * Verify Facebook Token
     */
    async verifyToken(accessToken) {
        try {
            const response = await axios.get(`${this.graphUrl}/debug_token`, {
                params: {
                    input_token: accessToken,
                    access_token: `${this.appId}|${this.appSecret}`
                }
            });

            const data = response.data.data;

            if (!data.is_valid) {
                return {
                    valid: false,
                    message: 'Invalid Facebook token'
                };
            }

            if (data.app_id !== this.appId) {
                return {
                    valid: false,
                    message: 'Token app ID does not match'
                };
            }

            return {
                valid: true,
                facebookId: data.user_id,
                scopes: data.scopes
            };
        } catch (error) {
            console.error('Facebook token verification error:', error);
            return {
                valid: false,
                message: 'Failed to verify Facebook token'
            };
        }
    }

    /**
     * Get Facebook User Info
     */
    async getUserInfo(accessToken) {
        try {
            const response = await axios.get(`${this.graphUrl}/me`, {
                params: {
                    fields: 'id,name,email,picture',
                    access_token: accessToken
                }
            });

            return response.data;
        } catch (error) {
            console.error('Facebook user info error:', error);
            throw error;
        }
    }

    /**
     * Login with Facebook
     */
    async loginWithFacebook(accessToken, phoneNumber = null) {
        try {
            // Verify token
            const tokenData = await this.verifyToken(accessToken);

            if (!tokenData.valid) {
                return {
                    success: false,
                    message: tokenData.message
                };
            }

            // Get user info
            const userInfo = await this.getUserInfo(accessToken);

            // Find or create user
            let user = await UserModel.findByFacebookId(tokenData.facebookId);

            if (!user) {
                // Create new user
                user = await UserModel.create({
                    full_name: userInfo.name,
                    email: userInfo.email,
                    facebook_id: tokenData.facebookId,
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
                provider: 'facebook'
            };
        } catch (error) {
            console.error('Facebook login error:', error);
            throw error;
        }
    }

    /**
     * Link Facebook Account
     */
    async linkAccount(userId, accessToken) {
        try {
            // Verify token
            const tokenData = await this.verifyToken(accessToken);

            if (!tokenData.valid) {
                return {
                    success: false,
                    message: tokenData.message
                };
            }

            // Check if Facebook ID already linked to another account
            const existingUser = await UserModel.findByFacebookId(tokenData.facebookId);

            if (existingUser && existingUser.id !== userId) {
                return {
                    success: false,
                    message: 'This Facebook account is already linked to another KSFP account'
                };
            }

            // Get user info
            const userInfo = await this.getUserInfo(accessToken);

            // Link Facebook ID to user
            const user = await UserModel.update(userId, {
                facebook_id: tokenData.facebookId,
                full_name: userInfo.name
            });

            return {
                success: true,
                user: user,
                message: 'Facebook account linked successfully'
            };
        } catch (error) {
            console.error('Facebook link error:', error);
            throw error;
        }
    }

    /**
     * Unlink Facebook Account
     */
    async unlinkAccount(userId) {
        try {
            const user = await UserModel.update(userId, {
                facebook_id: null
            });

            return {
                success: true,
                user: user,
                message: 'Facebook account unlinked successfully'
            };
        } catch (error) {
            console.error('Facebook unlink error:', error);
            throw error;
        }
    }

    /**
     * Refresh Facebook Token
     */
    async refreshToken(accessToken) {
        try {
            const response = await axios.get(`${this.graphUrl}/oauth/access_token`, {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: this.appId,
                    client_secret: this.appSecret,
                    fb_exchange_token: accessToken
                }
            });

            return {
                success: true,
                accessToken: response.data.access_token,
                expiresIn: response.data.expires_in
            };
        } catch (error) {
            console.error('Facebook token refresh error:', error);
            return {
                success: false,
                message: 'Failed to refresh token'
            };
        }
    }

    /**
     * Validate Facebook Configuration
     */
    isConfigured() {
        return !!this.appId && !!this.appSecret;
    }
}

module.exports = new FacebookAuthService();
