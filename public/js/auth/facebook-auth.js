/**
 * KSFP Facebook Authentication
 * Handles Facebook OAuth login and account linking
 */

class FacebookAuth {
    static APP_ID = process.env.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID';
    static SDK_VERSION = 'v18.0';

    /**
     * Initialize Facebook SDK
     */
    static init() {
        window.fbAsyncInit = function() {
            FB.init({
                appId: FacebookAuth.APP_ID,
                xfbml: true,
                version: FacebookAuth.SDK_VERSION,
                cookie: true,
                status: true
            });

            FacebookAuth.renderLoginButtons();
        };
    }

    /**
     * Render Facebook Login Buttons
     */
    static renderLoginButtons() {
        const facebookBtn = document.getElementById('facebookLoginBtn');
        const facebookRegisterBtn = document.getElementById('facebookRegisterBtn');
        const linkFacebookBtn = document.getElementById('linkFacebookBtn');

        if (facebookBtn) {
            facebookBtn.addEventListener('click', () => this.triggerLogin());
        }

        if (facebookRegisterBtn) {
            facebookRegisterBtn.addEventListener('click', () => this.triggerRegister());
        }

        if (linkFacebookBtn) {
            linkFacebookBtn.addEventListener('click', () => this.triggerLink());
        }
    }

    /**
     * Trigger Facebook Login
     */
    static triggerLogin() {
        if (typeof FB === 'undefined') {
            alert('Facebook SDK not loaded. Please try again.');
            return;
        }

        FB.login((response) => {
            if (response.authResponse) {
                this.handleLoginResponse(response.authResponse);
            } else {
                console.log('User cancelled login or did not fully authorize.');
                this.logAuthAction('facebook_login', false, 'User cancelled');
            }
        }, { scope: 'public_profile,email' });
    }

    /**
     * Trigger Facebook Register
     */
    static triggerRegister() {
        this.triggerLogin(); // Same flow as login
    }

    /**
     * Trigger Facebook Account Linking
     */
    static triggerLink() {
        if (!SessionManager.isLoggedIn()) {
            alert('Please log in first to link Facebook account');
            return;
        }

        if (typeof FB === 'undefined') {
            alert('Facebook SDK not loaded. Please try again.');
            return;
        }

        FB.login((response) => {
            if (response.authResponse) {
                this.linkAccount(response.authResponse.accessToken);
            }
        }, { scope: 'public_profile,email' });
    }

    /**
     * Handle Facebook Login Response
     */
    static async handleLoginResponse(authResponse) {
        try {
            // Get user info from Facebook
            const userInfo = await this.getFacebookUserInfo(authResponse.accessToken);

            const result = await fetch('/api/auth/facebook/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    access_token: authResponse.accessToken,
                    user_id: authResponse.userID,
                    user_info: userInfo,
                    device: this.getDeviceInfo()
                })
            });

            const data = await result.json();

            if (result.ok) {
                // Store tokens and user info
                SessionManager.setToken(data.token);
                SessionManager.setRefreshToken(data.refresh_token);
                SessionManager.setUser(data.user);

                this.logAuthAction('facebook_login', true);
                window.location.href = '/dashboard';
            } else {
                this.logAuthAction('facebook_login', false, data.message);
                alert(data.message || 'Facebook login failed');
            }
        } catch (error) {
            console.error('Facebook auth error:', error);
            this.logAuthAction('facebook_login', false, error.message);
            alert('Network error. Please try again.');
        }
    }

    /**
     * Get Facebook User Info
     */
    static getFacebookUserInfo(accessToken) {
        return new Promise((resolve, reject) => {
            FB.api('/me', { access_token: accessToken, fields: 'id,name,email,picture' }, 
                (response) => {
                    if (response.error) {
                        reject(response.error);
                    } else {
                        resolve(response);
                    }
                }
            );
        });
    }

    /**
     * Link Facebook Account
     */
    static async linkAccount(accessToken) {
        if (!SessionManager.isLoggedIn()) {
            alert('Please log in first');
            return false;
        }

        try {
            // Get user info
            const userInfo = await this.getFacebookUserInfo(accessToken);

            const response = await fetch('/api/auth/facebook/link', {
                method: 'POST',
                headers: SessionManager.getAuthHeader(),
                body: JSON.stringify({
                    access_token: accessToken,
                    user_info: userInfo
                })
            });

            const data = await response.json();

            if (response.ok) {
                SessionManager.updateUser({
                    facebook_id: userInfo.id,
                    full_name: userInfo.name
                });

                this.logAuthAction('facebook_link', true);
                return true;
            } else {
                this.logAuthAction('facebook_link', false, data.message);
                return false;
            }
        } catch (error) {
            console.error('Facebook link error:', error);
            this.logAuthAction('facebook_link', false, error.message);
            return false;
        }
    }

    /**
     * Unlink Facebook Account
     */
    static async unlinkAccount() {
        if (!SessionManager.isLoggedIn()) {
            return false;
        }

        try {
            const response = await fetch('/api/auth/facebook/unlink', {
                method: 'POST',
                headers: SessionManager.getAuthHeader()
            });

            if (response.ok) {
                SessionManager.updateUser({ facebook_id: null });
                this.logAuthAction('facebook_unlink', true);
                return true;
            }
        } catch (error) {
            console.error('Facebook unlink error:', error);
            this.logAuthAction('facebook_unlink', false, error.message);
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
                        provider: 'facebook',
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
     * Check Facebook Login Status
     */
    static checkLoginStatus() {
        return new Promise((resolve) => {
            if (typeof FB !== 'undefined') {
                FB.getLoginStatus((response) => {
                    resolve(response.status === 'connected');
                });
            } else {
                resolve(false);
            }
        });
    }

    /**
     * Logout from Facebook
     */
    static logout() {
        if (typeof FB !== 'undefined') {
            FB.logout();
        }
    }
}

// Make available globally
window.FacebookAuth = FacebookAuth;
