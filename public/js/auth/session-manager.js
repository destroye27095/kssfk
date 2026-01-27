/**
 * KSFP Session Manager
 * Manages JWT tokens and user sessions
 */

class SessionManager {
    static TOKEN_KEY = 'ksfp_token';
    static USER_KEY = 'ksfp_user';
    static REFRESH_TOKEN_KEY = 'ksfp_refresh_token';
    static EXPIRY_KEY = 'ksfp_expiry';

    /**
     * Set JWT Token
     */
    static setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
        // Decode token to get expiry
        const payload = this.decodeToken(token);
        if (payload && payload.exp) {
            localStorage.setItem(this.EXPIRY_KEY, payload.exp * 1000);
        }
    }

    /**
     * Get JWT Token
     */
    static getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Set Refresh Token
     */
    static setRefreshToken(token) {
        localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    }

    /**
     * Get Refresh Token
     */
    static getRefreshToken() {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }

    /**
     * Set User Data
     */
    static setUser(user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    /**
     * Get User Data
     */
    static getUser() {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    }

    /**
     * Check if logged in
     */
    static isLoggedIn() {
        const token = this.getToken();
        if (!token) return false;

        // Check if token is expired
        if (this.isTokenExpired()) {
            this.logout();
            return false;
        }

        return true;
    }

    /**
     * Check if token is expired
     */
    static isTokenExpired() {
        const expiry = localStorage.getItem(this.EXPIRY_KEY);
        if (!expiry) return true;
        return Date.now() >= parseInt(expiry);
    }

    /**
     * Decode JWT Token (without verification)
     */
    static decodeToken(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Token decode error:', error);
            return null;
        }
    }

    /**
     * Get Authorization Header
     */
    static getAuthHeader() {
        const token = this.getToken();
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Refresh Token
     */
    static async refreshToken() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                this.logout();
                return false;
            }

            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh_token: refreshToken
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.setToken(data.token);
                return true;
            } else {
                this.logout();
                return false;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
            return false;
        }
    }

    /**
     * Logout
     */
    static logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.EXPIRY_KEY);
        window.location.href = '/auth/login.html';
    }

    /**
     * Get User ID
     */
    static getUserId() {
        const user = this.getUser();
        return user ? user.id : null;
    }

    /**
     * Get User Role
     */
    static getUserRole() {
        const user = this.getUser();
        return user ? user.role : null;
    }

    /**
     * Get Phone Number
     */
    static getPhoneNumber() {
        const user = this.getUser();
        return user ? user.phone_number : null;
    }

    /**
     * Update User Data
     */
    static updateUser(userData) {
        const current = this.getUser();
        const updated = { ...current, ...userData };
        this.setUser(updated);
    }

    /**
     * Has Role
     */
    static hasRole(role) {
        return this.getUserRole() === role;
    }

    /**
     * Is Parent
     */
    static isParent() {
        return this.hasRole('parent');
    }

    /**
     * Is School
     */
    static isSchool() {
        return this.hasRole('school');
    }

    /**
     * Is Admin
     */
    static isAdmin() {
        return this.hasRole('admin');
    }

    /**
     * Get Time Until Expiry (in seconds)
     */
    static getTimeToExpiry() {
        const expiry = localStorage.getItem(this.EXPIRY_KEY);
        if (!expiry) return 0;
        const secondsLeft = Math.floor((parseInt(expiry) - Date.now()) / 1000);
        return Math.max(0, secondsLeft);
    }

    /**
     * Setup Auto-Logout
     */
    static setupAutoLogout() {
        setInterval(() => {
            if (this.isTokenExpired()) {
                this.logout();
            }
        }, 60000); // Check every minute
    }

    /**
     * Setup Inactivity Logout (15 minutes)
     */
    static setupInactivityLogout(minutes = 15) {
        let timeout;
        const resetTimeout = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.logout();
            }, minutes * 60 * 1000);
        };

        // Reset on user activity
        document.addEventListener('mousemove', resetTimeout);
        document.addEventListener('keypress', resetTimeout);
        document.addEventListener('click', resetTimeout);

        resetTimeout();
    }

    /**
     * Get Access Control Level
     */
    static getAccessLevel() {
        const role = this.getUserRole();
        const levels = {
            'parent': 1,
            'school': 2,
            'admin': 3
        };
        return levels[role] || 0;
    }

    /**
     * Can Access
     */
    static canAccess(requiredRole) {
        const userLevel = this.getAccessLevel();
        const requiredLevel = {
            'parent': 1,
            'school': 2,
            'admin': 3
        }[requiredRole] || 0;
        return userLevel >= requiredLevel;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    if (SessionManager.isLoggedIn()) {
        SessionManager.setupAutoLogout();
        SessionManager.setupInactivityLogout(15);
    }
});

// Make available globally
window.SessionManager = SessionManager;
