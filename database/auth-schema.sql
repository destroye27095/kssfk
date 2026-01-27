/**
 * KSFP Authentication Database Schema
 * SQL schema for production database implementation
 * Supports PostgreSQL, MySQL, SQLite
 */

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Basic Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE SPARSE,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    
    -- Authentication Methods (OAuth)
    google_id VARCHAR(255) UNIQUE SPARSE,
    facebook_id VARCHAR(255) UNIQUE SPARSE,
    
    -- Account Management
    role ENUM('parent', 'school', 'admin') DEFAULT 'parent',
    status ENUM('active', 'suspended', 'deleted', 'pending') DEFAULT 'active',
    
    -- Verification
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT TRUE,
    verified_at TIMESTAMP NULL,
    
    -- Security
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_method VARCHAR(50),
    password_hash VARCHAR(255) SPARSE,
    password_reset_token VARCHAR(255) SPARSE,
    password_reset_expiry TIMESTAMP NULL,
    
    -- Profile
    profile_completed BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    bio TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    last_login_ip VARCHAR(45),
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_phone (phone_number),
    INDEX idx_google_id (google_id),
    INDEX idx_facebook_id (facebook_id),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- ==========================================
-- OTP TABLE
-- ==========================================
CREATE TABLE otps (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    
    -- OTP Data
    code VARCHAR(6) NOT NULL,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    verified BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    last_attempt_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_phone (phone_number),
    INDEX idx_expires_at (expires_at)
);

-- ==========================================
-- AUTH LOGS TABLE
-- ==========================================
CREATE TABLE auth_logs (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    
    -- Auth Details
    action VARCHAR(100) NOT NULL,
    provider VARCHAR(50), -- 'google', 'facebook', 'phone', 'email'
    success BOOLEAN NOT NULL,
    message TEXT,
    
    -- Device Info
    user_agent TEXT,
    ip_address VARCHAR(45),
    device_fingerprint VARCHAR(255),
    
    -- Geo Location
    country VARCHAR(2),
    city VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_provider (provider),
    INDEX idx_created_at (created_at),
    INDEX idx_ip_address (ip_address)
);

-- ==========================================
-- SESSION TABLE
-- ==========================================
CREATE TABLE sessions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    
    -- Session Data
    access_token_hash VARCHAR(255) UNIQUE NOT NULL,
    refresh_token_hash VARCHAR(255) UNIQUE,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    
    -- Device Info
    user_agent TEXT,
    ip_address VARCHAR(45),
    device_id VARCHAR(255),
    device_name VARCHAR(100),
    
    -- Security
    is_active BOOLEAN DEFAULT TRUE,
    is_revoked BOOLEAN DEFAULT FALSE,
    last_activity TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_access_token_hash (access_token_hash),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at)
);

-- ==========================================
-- OAUTH TOKENS TABLE
-- ==========================================
CREATE TABLE oauth_tokens (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    
    -- OAuth Details
    provider VARCHAR(50) NOT NULL, -- 'google', 'facebook'
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_type VARCHAR(50),
    
    -- Expiry
    expires_at TIMESTAMP,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY uk_user_provider (user_id, provider),
    INDEX idx_provider (provider),
    INDEX idx_expires_at (expires_at)
);

-- ==========================================
-- LINKED ACCOUNTS TABLE
-- ==========================================
CREATE TABLE linked_accounts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    
    -- Account Links
    google_id VARCHAR(255) UNIQUE SPARSE,
    facebook_id VARCHAR(255) UNIQUE SPARSE,
    phone_number VARCHAR(20) UNIQUE SPARSE,
    email VARCHAR(255) UNIQUE SPARSE,
    
    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id)
);

-- ==========================================
-- FAILED LOGIN ATTEMPTS TABLE
-- ==========================================
CREATE TABLE failed_login_attempts (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    identifier VARCHAR(255) NOT NULL, -- email, phone, or username
    
    -- Attempt Details
    attempt_count INT DEFAULT 1,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamps
    first_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_attempt_at TIMESTAMP,
    locked_until TIMESTAMP NULL,
    
    INDEX idx_identifier (identifier),
    INDEX idx_ip_address (ip_address),
    INDEX idx_locked_until (locked_until)
);

-- ==========================================
-- AUDIT LOG TABLE
-- ==========================================
CREATE TABLE auth_audit_log (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36),
    
    -- Audit Details
    event_type VARCHAR(100) NOT NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    
    -- Changes
    old_values JSON,
    new_values JSON,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_user_id (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
);

-- ==========================================
-- VIEWS
-- ==========================================

-- Active Users View
CREATE VIEW active_users AS
SELECT u.* FROM users u
WHERE u.status = 'active'
AND u.verified_at IS NOT NULL;

-- Recent Logins View
CREATE VIEW recent_logins AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.phone_number,
    al.action,
    al.provider,
    al.ip_address,
    al.created_at
FROM users u
LEFT JOIN auth_logs al ON u.id = al.user_id
WHERE al.success = TRUE
ORDER BY al.created_at DESC
LIMIT 1000;

-- Authentication Summary View
CREATE VIEW auth_summary AS
SELECT 
    COUNT(DISTINCT u.id) as total_users,
    COUNT(DISTINCT CASE WHEN u.status = 'active' THEN u.id END) as active_users,
    COUNT(DISTINCT CASE WHEN u.email_verified = TRUE THEN u.id END) as verified_emails,
    COUNT(DISTINCT CASE WHEN u.google_id IS NOT NULL THEN u.id END) as google_users,
    COUNT(DISTINCT CASE WHEN u.facebook_id IS NOT NULL THEN u.id END) as facebook_users,
    COUNT(DISTINCT CASE WHEN u.phone_verified = TRUE THEN u.id END) as verified_phones
FROM users u;

-- ==========================================
-- STORED PROCEDURES
-- ==========================================

-- Get User With All Auth Methods
DELIMITER $$
CREATE PROCEDURE GetUserWithAuthMethods(IN p_user_id VARCHAR(36))
BEGIN
    SELECT 
        u.*,
        (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id AND s.is_active = TRUE) as active_sessions,
        (SELECT MAX(created_at) FROM auth_logs al WHERE al.user_id = u.id AND al.success = TRUE) as last_successful_login
    FROM users u
    WHERE u.id = p_user_id;
END$$
DELIMITER ;

-- Lock User Account
DELIMITER $$
CREATE PROCEDURE LockUserAccount(IN p_user_id VARCHAR(36), IN p_reason VARCHAR(255))
BEGIN
    UPDATE users SET status = 'suspended' WHERE id = p_user_id;
    INSERT INTO auth_audit_log (user_id, event_type, action)
    VALUES (p_user_id, 'ACCOUNT_LOCK', p_reason);
END$$
DELIMITER ;

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX idx_users_status_created ON users(status, created_at);
CREATE INDEX idx_auth_logs_user_date ON auth_logs(user_id, created_at);
CREATE INDEX idx_sessions_user_active ON sessions(user_id, is_active);
CREATE INDEX idx_otp_user_expires ON otps(user_id, expires_at);

-- ==========================================
-- CONSTRAINTS
-- ==========================================

ALTER TABLE users ADD CONSTRAINT chk_phone_format CHECK (phone_number REGEXP '^\\+[0-9]{1,3}[0-9]{6,14}$');
ALTER TABLE users ADD CONSTRAINT chk_email_format CHECK (email IS NULL OR email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$');

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Auto-update updated_at
DELIMITER $$
CREATE TRIGGER tr_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
SET NEW.updated_at = CURRENT_TIMESTAMP;
$$
DELIMITER ;

-- Log user creation
DELIMITER $$
CREATE TRIGGER tr_users_created
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO auth_audit_log (user_id, event_type, action, new_values)
    VALUES (NEW.id, 'USER_CREATED', 'User account created', 
            JSON_OBJECT('role', NEW.role, 'email', NEW.email));
END$$
DELIMITER ;
