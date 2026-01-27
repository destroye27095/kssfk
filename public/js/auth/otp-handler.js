/**
 * KSFP OTP Handler
 * Utilities for OTP input handling and management
 */

class OTPHandler {
    static TIMER_INTERVAL = 1000; // 1 second
    static DEFAULT_EXPIRY = 300; // 5 minutes
    static DEFAULT_RESEND_COOLDOWN = 30; // 30 seconds

    /**
     * Initialize OTP Inputs
     */
    static initializeOTPInputs(containerId = 'otpInputGroup') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const inputs = container.querySelectorAll('.otp-input');

        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => this.handleInput(e, inputs, index));
            input.addEventListener('keydown', (e) => this.handleKeydown(e, inputs, index));
            input.addEventListener('paste', (e) => this.handlePaste(e, inputs, index));
        });

        return inputs;
    }

    /**
     * Handle OTP Input
     */
    static handleInput(event, inputs, index) {
        const input = event.target;

        // Only allow digits
        if (!/^\d*$/.test(input.value)) {
            input.value = '';
            return;
        }

        // Move to next input
        if (input.value.length === 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }

        // Update visual feedback
        input.classList.toggle('filled', input.value !== '');

        // Check if all filled
        this.checkCompletion(inputs);
    }

    /**
     * Handle Keydown (Backspace)
     */
    static handleKeydown(event, inputs, index) {
        if (event.key === 'Backspace' && inputs[index].value === '' && index > 0) {
            inputs[index - 1].focus();
        }

        // Allow Tab to move between fields
        if (event.key === 'Tab') {
            event.preventDefault();
            const nextIndex = event.shiftKey ? index - 1 : index + 1;
            if (nextIndex >= 0 && nextIndex < inputs.length) {
                inputs[nextIndex].focus();
            }
        }
    }

    /**
     * Handle Paste (for 6-digit code)
     */
    static handlePaste(event, inputs, index) {
        event.preventDefault();

        const pastedData = event.clipboardData.getData('text');

        // Check if valid 6-digit code
        if (!/^\d{6}$/.test(pastedData)) {
            alert('Please paste a 6-digit OTP code');
            return;
        }

        // Fill all inputs
        const digits = pastedData.split('');
        digits.forEach((digit, i) => {
            if (index + i < inputs.length) {
                inputs[index + i].value = digit;
                inputs[index + i].classList.add('filled');
            }
        });

        // Focus last input
        inputs[Math.min(index + 5, inputs.length - 1)].focus();
        this.checkCompletion(inputs);
    }

    /**
     * Get OTP Value
     */
    static getOTPValue(inputs) {
        return Array.from(inputs)
            .map(input => input.value)
            .join('');
    }

    /**
     * Check if OTP is Complete
     */
    static isOTPComplete(inputs) {
        return this.getOTPValue(inputs).length === 6;
    }

    /**
     * Check Completion and Enable Submit
     */
    static checkCompletion(inputs) {
        const form = document.getElementById('otpForm');
        const submitBtn = form?.querySelector('button[type="submit"]');

        if (this.isOTPComplete(inputs)) {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('disabled');
            }
        } else {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('disabled');
            }
        }
    }

    /**
     * Clear OTP Inputs
     */
    static clearOTPInputs(inputs) {
        inputs.forEach(input => {
            input.value = '';
            input.classList.remove('filled');
        });

        if (inputs.length > 0) {
            inputs[0].focus();
        }
    }

    /**
     * Start Timer
     */
    static startTimer(duration = this.DEFAULT_EXPIRY, onTick = null, onExpire = null) {
        let remaining = duration;
        const startTime = Date.now();
        const expiryTime = startTime + (duration * 1000);

        const timerInterval = setInterval(() => {
            remaining = Math.ceil((expiryTime - Date.now()) / 1000);

            if (remaining <= 0) {
                clearInterval(timerInterval);
                if (onExpire) onExpire();
                return;
            }

            if (onTick) {
                onTick(remaining);
            }
        }, this.TIMER_INTERVAL);

        return timerInterval;
    }

    /**
     * Format Time for Display
     */
    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Start Resend Cooldown
     */
    static startResendCooldown(duration = this.DEFAULT_RESEND_COOLDOWN, onTick = null, onComplete = null) {
        let remaining = duration;
        const startTime = Date.now();
        const completeTime = startTime + (duration * 1000);

        const resendBtn = document.getElementById('resendLink');

        const cooldownInterval = setInterval(() => {
            remaining = Math.ceil((completeTime - Date.now()) / 1000);

            if (remaining <= 0) {
                clearInterval(cooldownInterval);
                if (resendBtn) {
                    resendBtn.classList.remove('disabled');
                }
                if (onComplete) onComplete();
                return;
            }

            if (onTick) {
                onTick(remaining);
            }
        }, this.TIMER_INTERVAL);

        if (resendBtn) {
            resendBtn.classList.add('disabled');
        }

        return cooldownInterval;
    }

    /**
     * Disable OTP Form
     */
    static disableOTPForm() {
        const inputs = document.querySelectorAll('.otp-input');
        const form = document.getElementById('otpForm');
        const submitBtn = form?.querySelector('button[type="submit"]');
        const resendBtn = document.getElementById('resendLink');

        inputs.forEach(input => {
            input.disabled = true;
        });

        if (submitBtn) {
            submitBtn.disabled = true;
        }

        if (form) {
            form.style.opacity = '0.5';
        }

        if (resendBtn) {
            resendBtn.classList.add('disabled');
        }
    }

    /**
     * Enable OTP Form
     */
    static enableOTPForm() {
        const inputs = document.querySelectorAll('.otp-input');
        const form = document.getElementById('otpForm');

        inputs.forEach(input => {
            input.disabled = false;
        });

        if (form) {
            form.style.opacity = '1';
        }
    }

    /**
     * Show Alert
     */
    static showAlert(type, message) {
        const alert = document.getElementById('statusAlert');
        const messageEl = document.getElementById('statusMessage');

        if (!alert || !messageEl) return;

        const alertClass = type === 'error' ? 'alert-danger' : 
                          type === 'success' ? 'alert-success' : 
                          'alert-info';

        alert.className = `alert ${alertClass}`;
        messageEl.textContent = message;
        alert.classList.remove('d-none');

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                alert.classList.add('d-none');
            }, 5000);
        }
    }

    /**
     * Validate OTP
     */
    static validateOTP(otp) {
        return /^\d{6}$/.test(otp);
    }

    /**
     * Request OTP via SMS
     */
    static async requestOTP(phoneNumber) {
        try {
            const response = await fetch('/api/auth/phone/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone_number: phoneNumber
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send OTP');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Submit OTP for Verification
     */
    static async submitOTP(phoneNumber, userId, otp) {
        try {
            if (!this.validateOTP(otp)) {
                throw new Error('Invalid OTP format');
            }

            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    user_id: userId,
                    otp: otp
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'OTP verification failed');
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    /**
     * Rate Limit Check
     */
    static checkRateLimit(attempts = 5, resetTime = 3600000) {
        const key = 'otp_attempts';
        const attemptsData = JSON.parse(localStorage.getItem(key) || '{"count":0,"resetTime":0}');

        if (Date.now() > attemptsData.resetTime) {
            attemptsData.count = 0;
            attemptsData.resetTime = Date.now() + resetTime;
        }

        if (attemptsData.count >= attempts) {
            return {
                allowed: false,
                remaining: 0,
                message: 'Too many attempts. Please try again later.'
            };
        }

        localStorage.setItem(key, JSON.stringify(attemptsData));

        return {
            allowed: true,
            remaining: attempts - attemptsData.count - 1
        };
    }

    /**
     * Reset Rate Limit
     */
    static resetRateLimit() {
        localStorage.removeItem('otp_attempts');
    }
}

// Make available globally
window.OTPHandler = OTPHandler;
