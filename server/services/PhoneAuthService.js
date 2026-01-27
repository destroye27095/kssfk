/**
 * KSFP Phone Authentication Service
 * Handles phone number verification with OTP
 */

const OTPService = require('./OTPService');
const UserModel = require('../models/User');

class PhoneAuthService {
    constructor() {
        this.otpService = OTPService;
    }

    /**
     * Send OTP for Phone Login
     */
    async sendLoginOTP(phoneNumber) {
        try {
            // Validate phone number
            if (!this.otpService.validatePhoneNumber(phoneNumber)) {
                return {
                    success: false,
                    message: 'Invalid phone number format'
                };
            }

            // Find user by phone number
            let user = await UserModel.findByPhoneNumber(phoneNumber);

            if (!user) {
                // Create new user for phone number
                user = await UserModel.create({
                    phone_number: phoneNumber,
                    role: 'parent',
                    status: 'active',
                    full_name: 'User ' + phoneNumber
                });
            }

            // Check if can request new OTP
            const canRequest = await this.otpService.canRequestNewOTP(user.id);

            if (!canRequest.allowed) {
                return {
                    success: false,
                    message: canRequest.message,
                    waitSeconds: canRequest.waitSeconds
                };
            }

            // Generate OTP
            const otp = this.otpService.generateOTP();

            // Store OTP
            await this.otpService.storeOTP(user.id, phoneNumber, otp);

            // Send OTP via SMS
            await this.otpService.sendOTP(phoneNumber, otp);

            return {
                success: true,
                user_id: user.id,
                message: 'OTP sent to your phone',
                phoneNumber: this.otpService.maskPhoneNumber(phoneNumber)
            };
        } catch (error) {
            console.error('Send OTP error:', error);
            throw error;
        }
    }

    /**
     * Send OTP for Registration
     */
    async sendRegistrationOTP(phoneNumber) {
        try {
            // Validate phone number
            if (!this.otpService.validatePhoneNumber(phoneNumber)) {
                return {
                    success: false,
                    message: 'Invalid phone number format'
                };
            }

            // Check if phone number already registered
            const existingUser = await UserModel.findByPhoneNumber(phoneNumber);

            if (existingUser) {
                return {
                    success: false,
                    message: 'This phone number is already registered'
                };
            }

            // Create temporary user (will be updated after OTP verification)
            const tempUser = await UserModel.create({
                phone_number: phoneNumber,
                role: 'parent',
                status: 'pending',
                full_name: 'Unverified ' + phoneNumber
            });

            // Generate and send OTP
            const otp = this.otpService.generateOTP();
            await this.otpService.storeOTP(tempUser.id, phoneNumber, otp);
            await this.otpService.sendOTP(phoneNumber, otp);

            return {
                success: true,
                user_id: tempUser.id,
                message: 'OTP sent to your phone',
                phoneNumber: this.otpService.maskPhoneNumber(phoneNumber)
            };
        } catch (error) {
            console.error('Registration OTP error:', error);
            throw error;
        }
    }

    /**
     * Verify OTP and Complete Login
     */
    async verifyLoginOTP(userId, phoneNumber, otp) {
        try {
            // Verify OTP
            const verification = await this.otpService.verifyOTP(userId, otp);

            if (!verification.valid) {
                return {
                    success: false,
                    message: verification.message,
                    attemptsRemaining: verification.attemptsRemaining
                };
            }

            // Get user
            const user = await UserModel.findById(userId);

            if (!user) {
                return {
                    success: false,
                    message: 'User not found'
                };
            }

            // Update user status
            if (user.status === 'pending') {
                await UserModel.update(userId, {
                    status: 'active'
                });
            }

            // Update last login
            await UserModel.update(userId, {
                last_login: new Date()
            });

            // Clean up OTP
            await this.otpService.deleteOTP(userId);

            return {
                success: true,
                user: user,
                message: 'OTP verified successfully'
            };
        } catch (error) {
            console.error('OTP verification error:', error);
            throw error;
        }
    }

    /**
     * Resend OTP
     */
    async resendOTP(userId, phoneNumber) {
        try {
            // Check cooldown
            const canRequest = await this.otpService.canRequestNewOTP(userId);

            if (!canRequest.allowed) {
                return {
                    success: false,
                    message: canRequest.message,
                    waitSeconds: canRequest.waitSeconds
                };
            }

            // Generate new OTP
            const otp = this.otpService.generateOTP();

            // Store OTP
            await this.otpService.storeOTP(userId, phoneNumber, otp);

            // Send OTP
            await this.otpService.sendOTP(phoneNumber, otp);

            return {
                success: true,
                message: 'OTP resent to your phone',
                phoneNumber: this.otpService.maskPhoneNumber(phoneNumber)
            };
        } catch (error) {
            console.error('Resend OTP error:', error);
            throw error;
        }
    }

    /**
     * Update Phone Number (requires verification)
     */
    async updatePhoneNumber(userId, newPhoneNumber) {
        try {
            // Validate new phone number
            if (!this.otpService.validatePhoneNumber(newPhoneNumber)) {
                return {
                    success: false,
                    message: 'Invalid phone number format'
                };
            }

            // Check if already in use
            const existingUser = await UserModel.findByPhoneNumber(newPhoneNumber);

            if (existingUser && existingUser.id !== userId) {
                return {
                    success: false,
                    message: 'This phone number is already in use'
                };
            }

            // Send OTP for verification
            const otp = this.otpService.generateOTP();
            await this.otpService.storeOTP(userId, newPhoneNumber, otp);
            await this.otpService.sendOTP(newPhoneNumber, otp);

            return {
                success: true,
                message: 'OTP sent to new phone number',
                phoneNumber: this.otpService.maskPhoneNumber(newPhoneNumber)
            };
        } catch (error) {
            console.error('Update phone error:', error);
            throw error;
        }
    }

    /**
     * Verify and Update Phone Number
     */
    async verifyAndUpdatePhoneNumber(userId, newPhoneNumber, otp) {
        try {
            // Verify OTP
            const verification = await this.otpService.verifyOTP(userId, otp);

            if (!verification.valid) {
                return {
                    success: false,
                    message: verification.message
                };
            }

            // Update phone number
            const user = await UserModel.update(userId, {
                phone_number: newPhoneNumber
            });

            // Clean up OTP
            await this.otpService.deleteOTP(userId);

            return {
                success: true,
                user: user,
                message: 'Phone number updated successfully'
            };
        } catch (error) {
            console.error('Verify and update phone error:', error);
            throw error;
        }
    }

    /**
     * Validate Phone Number
     */
    validatePhoneNumber(phoneNumber) {
        return this.otpService.validatePhoneNumber(phoneNumber);
    }

    /**
     * Format Phone Number
     */
    formatPhoneNumber(phoneNumber) {
        // Remove all non-digits
        let cleaned = phoneNumber.replace(/\D/g, '');

        // Handle different input formats
        if (cleaned.startsWith('254')) {
            return '+' + cleaned;
        } else if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
            return '+254' + cleaned.substring(1);
        } else if (cleaned.length === 9 && (cleaned.startsWith('7') || cleaned.startsWith('1'))) {
            return '+254' + cleaned;
        }

        return '+' + cleaned;
    }
}

module.exports = new PhoneAuthService();
