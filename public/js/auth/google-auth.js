/**
 * KSFP Google Authentication
 * Handles Google OAuth 2.0 login and account linking
 */

class GoogleAuth {
    static CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

    /**
     * Initialize Google Sign-In
     */
    static init() {
        window.google?.accounts?.id?.initialize({
            client_id: this.CLIENT_ID,
            callback: this.handleLoginResponse.bind(this),
            auto_select: true
        });

        this.renderLoginButton();
    }

    /**
     * Render Google Login Button
     */
    static renderLoginButton() {
        const googleBtn = document.getElementById('googleLoginBtn');
        const googleRegisterBtn = document.getElementById('googleRegisterBtn');
        const linkGoogleBtn = document.getElementById('linkGoogleBtn');

        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.triggerLogin());
        }

        if (googleRegisterBtn) {
            googleRegisterBtn.addEventListener('click', () => this.triggerRegister());
        }

        if (linkGoogleBtn) {
            linkGoogleBtn.addEventListener('click', () => this.triggerLink());
        }
    }

    /**
     * Trigger Google Login
     */
    static triggerLogin() {
        window.google?.accounts?.id?.renderButton(
            document.getElementById('googleLoginBtn'),
            {
                type: 'standard',
                size: 'large',
                theme: 'outline',
                text: 'continue_with'
            }
        );

        window.google?.accounts?.id?.promptAsync((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                // Fallback to manual flow
                this.manualLogin();
            }
        });
    }

    /**
     * Trigger Google Register
     */
    static triggerRegister() {
        window.google?.accounts?.id?.renderButton(
            document.getElementById('googleRegisterBtn'),
            {
                type: 'standard',
                size: 'large',
                theme: 'outline',
                text: 'signup_with'
            }
        );

        window.google?.accounts?.id?.promptAsync();
    }

    /**
     * Trigger Google Account Linking
     */
    static triggerLink() {
        if (!SessionManager.isLoggedIn()) {
            alert('Please log in first to link Google account');
            return;
        }

        window.google?.accounts?.id?.renderButton(
            document.getElementById('linkGoogleBtn'),
            {
                type: 'standard',
                size: 'small',
                theme: 'outline',
                text: 'signin_with'
            }
        );

        window.google?.accounts?.id?.promptAsync();
    }

    /**
     * Manual Login Flow
     */
    static manualLogin() {
        const state = this.generateState();
        const redirectUri = `${window.location.origin}/api/auth/google/callback`;

        const params = new URLSearchParams({
            client_id: this.CLIENT_ID,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'openid profile email',
            state: state,
            nonce: this.generateNonce()
        });

        // Store state for verification
        sessionStorage.setItem('google_oauth_state', state);

        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    }

    /**
     * Handle Google Login Response
     */
    static async handleLoginResponse(response) {
        if (response.credential) {
            const token = response.credential;

            try {
                const result = await fetch('/api/auth/google/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        token: token,
                        device: this.getDeviceInfo()
                    })
                });

                const data = await result.json();

                if (result.ok) {
                    // Store tokens and user info
                    SessionManager.setToken(data.token);
                    SessionManager.setRefreshToken(data.refresh_token);
                    SessionManager.setUser(data.user);

                    // Log auth action
                    this.logAuthAction('google_login', true);

                    // Redirect to dashboard
                    window.location.href = '/dashboard';
                } else {
                    this.logAuthAction('google_login', false, data.message);
                    alert(data.message || 'Google login failed');
                }
            } catch (error) {
                console.error('Google auth error:', error);
                this.logAuthAction('google_login', false, error.message);
                alert('Network error. Please try again.');
            }
        }
    }

    /**
     * Link Google Account
     */
    static async linkAccount(token) {
        if (!SessionManager.isLoggedIn()) {
            alert('Please log in first');
            return false;
        }

        try {
            const response = await fetch('/api/auth/google/link', {
                method: 'POST',
                headers: SessionManager.getAuthHeader(),
                body: JSON.stringify({
                    token: token
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Update user with Google ID
                SessionManager.updateUser({
                    google_id: data.google_id,
                    email: data.email
                });

                this.logAuthAction('google_link', true);
                return true;
            } else {
                this.logAuthAction('google_link', false, data.message);
                return false;
            }
        } catch (error) {
            console.error('Google link error:', error);
            this.logAuthAction('google_link', false, error.message);
            return false;
        }
    }

    /**
     * Unlink Google Account
     */
    static async unlinkAccount() {
        if (!SessionManager.isLoggedIn()) {
            return false;
        }

        try {
            const response = await fetch('/api/auth/google/unlink', {
                method: 'POST',
                headers: SessionManager.getAuthHeader()
            });

            if (response.ok) {
                SessionManager.updateUser({ google_id: null });
                this.logAuthAction('google_unlink', true);
                return true;
            }
        } catch (error) {
            console.error('Google unlink error:', error);
            this.logAuthAction('google_unlink', false, error.message);
            return false;
        }
    }

    /**
     * Get Device Info
     */
    static getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    /**
     * Generate OAuth State
     */
    static generateState() {
        return Math.random().toString(36).substring(7) + Date.now();
    }

    /**
     * Generate Nonce
     */
    static generateNonce() {
        return Math.random().toString(36).substring(2, 15);
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
                        provider: 'google',
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
}

// Make available globally
window.GoogleAuth = GoogleAuth;
