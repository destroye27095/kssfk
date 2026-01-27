/**
 * KSFP OTP Service
 * Manages OTP generation, verification, and SMS sending
 * Implements rate limiting and security measures
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class OTPService {
    constructor() {
        this.otpLength = 6;
        this.otpValidity = 5 * 60; // 5 minutes in seconds
        this.maxAttempts = 5;
        this.cooldownPeriod = 30; // 30 seconds between resends
        this.otpStorage = path.join(__dirname, '../../logs/otp.json');
    }

    /**
     * Generate OTP
     */
    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * Send OTP via SMS
     * In production, integrate with Twilio, Africastalking, or similar
     */
    async sendOTP(phoneNumber, otp) {
        try {
            // Log the OTP (in production, this would be sent via SMS gateway)
            console.log(`[OTP] Phone: ${phoneNumber}, Code: ${otp}`);

            // TODO: Integrate with actual SMS provider
            // Example: Twilio
            // const twilio = require('twilio')(accountSid, authToken);
            // await twilio.messages.create({
            //     body: `Your KSFP verification code is: ${otp}. Valid for 5 minutes.`,
            //     from: smsFromNumber,
            //     to: phoneNumber
            // });

            // For now, return success
            return {
                success: true,
                message: 'OTP sent successfully',
                phoneNumber: this.maskPhoneNumber(phoneNumber)
            };
        } catch (error) {
            console.error('SMS sending error:', error);
            throw new Error('Failed to send OTP');
        }
    }

    /**
     * Store OTP
     */
    async storeOTP(userId, phoneNumber, otp) {
        try {
            const otpData = {
                userId,
                phoneNumber,
                otp,
                createdAt: Date.now(),
                expiresAt: Date.now() + (this.otpValidity * 1000),
                attempts: 0,
                verified: false,
                lastAttempt: null
            };

            // Store in file (in production, use database)
            const storage = await this.loadOTPStorage();
            storage[userId] = otpData;
            await this.saveOTPStorage(storage);

            return otpData;
        } catch (error) {
            console.error('OTP storage error:', error);
            throw error;
        }
    }

    /**
     * Verify OTP
     */
    async verifyOTP(userId, otp) {
        try {
            const storage = await this.loadOTPStorage();
            const otpData = storage[userId];

            if (!otpData) {
                return {
                    valid: false,
                    message: 'OTP not found. Please request a new one.'
                };
            }

            // Check if expired
            if (Date.now() > otpData.expiresAt) {
                delete storage[userId];
                await this.saveOTPStorage(storage);
                return {
                    valid: false,
                    message: 'OTP has expired. Please request a new one.'
                };
            }

            // Check attempts
            if (otpData.attempts >= this.maxAttempts) {
                delete storage[userId];
                await this.saveOTPStorage(storage);
                return {
                    valid: false,
                    message: 'Too many incorrect attempts. Please request a new OTP.'
                };
            }

            // Verify OTP
            if (otpData.otp === otp) {
                otpData.verified = true;
                otpData.verifiedAt = Date.now();
                await this.saveOTPStorage(storage);
                return {
                    valid: true,
                    message: 'OTP verified successfully',
                    phoneNumber: otpData.phoneNumber
                };
            } else {
                otpData.attempts++;
                otpData.lastAttempt = Date.now();
                await this.saveOTPStorage(storage);
                return {
                    valid: false,
                    message: 'Incorrect OTP',
                    attemptsRemaining: this.maxAttempts - otpData.attempts
                };
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            throw error;
        }
    }

    /**
     * Check if can request new OTP
     */
    async canRequestNewOTP(userId) {
        try {
            const storage = await this.loadOTPStorage();
            const otpData = storage[userId];

            if (!otpData) {
                return { allowed: true };
            }

            const timeSinceLastRequest = Date.now() - otpData.createdAt;
            const timeUntilCooldown = (this.cooldownPeriod * 1000) - timeSinceLastRequest;

            if (timeUntilCooldown > 0) {
                return {
                    allowed: false,
                    message: 'Please wait before requesting a new OTP',
                    waitSeconds: Math.ceil(timeUntilCooldown / 1000)
                };
            }

            return { allowed: true };
        } catch (error) {
            console.error('Cooldown check error:', error);
            return { allowed: true };
        }
    }

    /**
     * Get OTP Status
     */
    async getOTPStatus(userId) {
        try {
            const storage = await this.loadOTPStorage();
            const otpData = storage[userId];

            if (!otpData) {
                return null;
            }

            return {
                phoneNumber: this.maskPhoneNumber(otpData.phoneNumber),
                attempts: otpData.attempts,
                attemptsRemaining: this.maxAttempts - otpData.attempts,
                verified: otpData.verified,
                expiresAt: new Date(otpData.expiresAt).toISOString(),
                createdAt: new Date(otpData.createdAt).toISOString()
            };
        } catch (error) {
            console.error('Status retrieval error:', error);
            return null;
        }
    }

    /**
     * Delete OTP
     */
    async deleteOTP(userId) {
        try {
            const storage = await this.loadOTPStorage();
            delete storage[userId];
            await this.saveOTPStorage(storage);
            return true;
        } catch (error) {
            console.error('OTP deletion error:', error);
            return false;
        }
    }

    /**
     * Validate Phone Number
     */
    validatePhoneNumber(phoneNumber) {
        // Kenyan phone number validation
        const kenyanPattern = /^(\+254|0)(7|1)\d{8}$/;
        
        // Also accept international format
        const internationalPattern = /^\+\d{1,3}\d{6,14}$/;

        return kenyanPattern.test(phoneNumber) || internationalPattern.test(phoneNumber);
    }

    /**
     * Mask Phone Number
     */
    maskPhoneNumber(phoneNumber) {
        // Mask all but last 4 digits
        return phoneNumber.replace(/(?<=.{4})./g, '*');
    }

    /**
     * Load OTP Storage
     */
    async loadOTPStorage() {
        try {
            const data = await fs.readFile(this.otpStorage, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet or is empty
            return {};
        }
    }

    /**
     * Save OTP Storage
     */
    async saveOTPStorage(data) {
        try {
            // Ensure directory exists
            const dir = path.dirname(this.otpStorage);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(this.otpStorage, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('OTP storage save error:', error);
            throw error;
        }
    }

    /**
     * Clean up expired OTPs
     */
    async cleanupExpiredOTPs() {
        try {
            const storage = await this.loadOTPStorage();
            const now = Date.now();
            let cleaned = 0;

            for (const [userId, otpData] of Object.entries(storage)) {
                if (now > otpData.expiresAt) {
                    delete storage[userId];
                    cleaned++;
                }
            }

            if (cleaned > 0) {
                await this.saveOTPStorage(storage);
                console.log(`[OTPService] Cleaned up ${cleaned} expired OTPs`);
            }

            return cleaned;
        } catch (error) {
            console.error('OTP cleanup error:', error);
        }
    }

    /**
     * Get OTP Statistics
     */
    async getStatistics() {
        try {
            const storage = await this.loadOTPStorage();
            const now = Date.now();

            let totalOTPs = 0;
            let pendingOTPs = 0;
            let verifiedOTPs = 0;

            for (const otpData of Object.values(storage)) {
                totalOTPs++;
                if (now <= otpData.expiresAt) {
                    pendingOTPs++;
                }
                if (otpData.verified) {
                    verifiedOTPs++;
                }
            }

            return {
                totalOTPs,
                pendingOTPs,
                verifiedOTPs,
                expiredOTPs: totalOTPs - pendingOTPs
            };
        } catch (error) {
            console.error('Statistics error:', error);
            return null;
        }
    }
}

module.exports = new OTPService();
