/**
 * KSFP Phone Authentication
 * Handles phone number login with OTP verification
 */

class PhoneAuth {
    static OTP_ATTEMPT_LIMIT = 5;
    static OTP_VALIDITY = 300; // 5 minutes
    static RESEND_COOLDOWN = 30; // 30 seconds

    /**
     * Initialize Phone Auth
     */
    static init() {
        this.renderPhoneForm();
    }

    /**
     * Render Phone Login Form
     */
    static renderPhoneForm() {
        const phoneForm = document.getElementById('phoneLoginForm');

        if (phoneForm) {
            phoneForm.addEventListener('submit', (e) => this.handlePhoneSubmit(e));
        }
    }

    /**
     * Handle Phone Form Submit
     */
    static async handlePhoneSubmit(event) {
        event.preventDefault();

        const phoneInput = document.getElementById('phoneNumber');
        const phoneNumber = this.formatPhoneNumber(phoneInput.value);

        if (!this.validatePhoneNumber(phoneNumber)) {
            alert('Please enter a valid phone number');
            return;
        }

        try {
            const response = await fetch('/api/auth/phone/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    device: this.getDeviceInfo()
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.logAuthAction('phone_otp_sent', true);
                // Redirect to OTP verification page
                window.location.href = `/auth/verify-otp.html?phone=${encodeURIComponent(phoneNumber)}&userId=${data.user_id}`;
            } else {
                this.logAuthAction('phone_otp_sent', false, data.message);
                alert(data.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Phone auth error:', error);
            this.logAuthAction('phone_otp_sent', false, error.message);
            alert('Network error. Please try again.');
        }
    }

    /**
     * Validate Phone Number
     */
    static validatePhoneNumber(phoneNumber) {
        // Kenyan phone number validation
        const kenyanPattern = /^(\+254|0)(7|1)\d{8}$/;
        return kenyanPattern.test(phoneNumber);
    }

    /**
     * Format Phone Number
     */
    static formatPhoneNumber(phoneNumber) {
        // Remove spaces and dashes
        let cleaned = phoneNumber.replace(/\D/g, '');

        // Handle different formats
        if (cleaned.startsWith('254')) {
            return '+' + cleaned;
        } else if (cleaned.startsWith('07') || cleaned.startsWith('01')) {
            return '+254' + cleaned.substring(1);
        } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
            return '+254' + cleaned;
        }

        return '+' + cleaned;
    }

    /**
     * Send OTP
     */
    static async sendOTP(phoneNumber) {
        try {
            const response = await fetch('/api/auth/phone/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    device: this.getDeviceInfo()
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.logAuthAction('phone_otp_sent', true);
                return data;
            } else {
                this.logAuthAction('phone_otp_sent', false, data.message);
                throw new Error(data.message || 'Failed to send OTP');
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            throw error;
        }
    }

    /**
     * Verify OTP
     */
    static async verifyOTP(phoneNumber, userId, otp) {
        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    user_id: userId,
                    otp: otp,
                    device: this.getDeviceInfo()
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Store tokens and user
                SessionManager.setToken(data.token);
                SessionManager.setRefreshToken(data.refresh_token);
                SessionManager.setUser(data.user);

                this.logAuthAction('phone_otp_verified', true);
                return data;
            } else {
                this.logAuthAction('phone_otp_verified', false, data.message);
                throw new Error(data.message || 'Invalid OTP');
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            throw error;
        }
    }

    /**
     * Resend OTP
     */
    static async resendOTP(phoneNumber, userId) {
        try {
            const response = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    user_id: userId
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.logAuthAction('phone_otp_resent', true);
                return data;
            } else {
                this.logAuthAction('phone_otp_resent', false, data.message);
                throw new Error(data.message || 'Failed to resend OTP');
            }
        } catch (error) {
            console.error('Resend OTP error:', error);
            throw error;
        }
    }

    /**
     * Get Device Info
     */
    static getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            ip: '' // Will be set by backend
        };
    }

    /**
     * Log Authentication Action
     */
    static logAuthAction(action, success, message = '') {
        try {
            if (SessionManager.isLoggedIn()) {
                fetch('/api/auth/log', {
                    method: 'POST',
                    headers: SessionManager.getAuthHeader(),
                    body: JSON.stringify({
                        action: action,
                        provider: 'phone',
                        success: success,
                        message: message,
                        device: this.getDeviceInfo()
                    })
                }).catch(e => console.error('Log error:', e));
            }
        } catch (error) {
            console.error('Auth logging error:', error);
        }
    }

    /**
     * Check Phone Verification Status
     */
    static async checkVerificationStatus(userId) {
        try {
            const response = await fetch(`/api/auth/phone/status/${userId}`, {
                headers: SessionManager.getAuthHeader()
            });

            return response.ok ? await response.json() : null;
        } catch (error) {
            console.error('Status check error:', error);
            return null;
        }
    }

    /**
     * Update Phone Number
     */
    static async updatePhoneNumber(newPhoneNumber) {
        if (!SessionManager.isLoggedIn()) {
            throw new Error('Not logged in');
        }

        try {
            const response = await fetch('/api/auth/phone/update', {
                method: 'POST',
                headers: SessionManager.getAuthHeader(),
                body: JSON.stringify({
                    phone_number: this.formatPhoneNumber(newPhoneNumber)
                })
            });

            const data = await response.json();

            if (response.ok) {
                // User needs to verify new phone number
                return data;
            } else {
                throw new Error(data.message || 'Failed to update phone');
            }
        } catch (error) {
            console.error('Update phone error:', error);
            throw error;
        }
    }
}

// Make available globally
window.PhoneAuth = PhoneAuth;
