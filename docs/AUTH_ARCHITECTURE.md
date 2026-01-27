# KSFP Authentication Architecture

**Production-Grade Multi-Method Authentication System**

Kenya School Fee Platform (KSFP)  
Version: 1.0 Enterprise Edition  
Date: January 27, 2026  
Developer: Wamoto Raphael, Meru University

---

## 1. OVERVIEW

KSFP implements a sophisticated multi-method authentication system supporting:
- ✅ Google OAuth 2.0
- ✅ Facebook OAuth 2.0  
- ✅ Phone Number with OTP/SMS

All methods map to a **single internal user ID** for audit trails, payments, and receipts.

### Key Principles

1. **One User = Multiple Authentication Methods**
   - Users can log in with Google, Facebook, or Phone
   - All methods link to the same KSFP account
   - Phone number is MANDATORY for payments

2. **Immutable Audit Trail**
   - Every auth action logged with timestamp, IP, provider
   - Court-ready authentication records
   - SHA-256 hashing of sensitive data

3. **Security First**
   - ACID-compliant transactions
   - Rate limiting on auth endpoints
   - OTP expires in 5 minutes
   - Failed login lockout after 5 attempts

4. **User-Friendly**
   - Parent-friendly registration
   - One-click Google/Facebook login
   - SMS-based phone verification
   - Account linking for convenience

---

## 2. AUTHENTICATION FLOWS

### 2.1 Google Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER → GOOGLE LOGIN PAGE                                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ GOOGLE VALIDATES CREDENTIALS                                 │
│ - Email verified by Google                                   │
│ - Returns ID token                                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: POST /api/auth/google/login                        │
│ {                                                              │
│   "token": "JWT_FROM_GOOGLE",                                 │
│   "device": { "userAgent", "timezone" }                       │
│ }                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: GoogleAuthService.loginWithGoogle()                 │
│ 1. Verify token with Google OAuth2Client                     │
│ 2. Check if user exists (by google_id)                       │
│ 3. If not: CREATE new user                                   │
│ 4. If yes: UPDATE last_login                                 │
│ 5. Generate JWT token                                        │
│ 6. Log auth action to auth.log                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ RESPONSE:                                                      │
│ {                                                              │
│   "token": "KSFP_JWT_TOKEN",                                  │
│   "refresh_token": "REFRESH_TOKEN",                           │
│   "user": {                                                    │
│     "id": "usr_xxxxx",                                         │
│     "email": "user@example.com",                              │
│     "role": "parent",                                         │
│     "phone_number": null                                      │
│   }                                                            │
│ }                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Save token to localStorage                          │
│ SessionManager.setToken(data.token)                          │
│ SessionManager.setUser(data.user)                            │
│ → Redirect to /dashboard                                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Facebook Login Flow

```
Same as Google, but:
- Uses Facebook OAuth endpoint
- Validates with Facebook Graph API
- Stores facebook_id instead of google_id
- Endpoint: /api/auth/facebook/login
```

### 2.3 Phone Number Login (OTP) Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER ENTERS PHONE NUMBER                                      │
│ +254 700 000 000                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: POST /api/auth/phone/send-otp                      │
│ {                                                              │
│   "phone_number": "+254700000000"                             │
│ }                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: PhoneAuthService.sendLoginOTP()                     │
│ 1. Validate phone format (Kenyan: +254 7x/1x)               │
│ 2. Find or CREATE user by phone_number                       │
│ 3. Generate random 6-digit OTP                               │
│ 4. Store OTP with 5-minute expiry                            │
│ 5. Send SMS via gateway (Twilio/AfricasTalking)              │
│ 6. Return user_id                                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ RESPONSE:                                                      │
│ {                                                              │
│   "user_id": "usr_xxxxx",                                     │
│   "phoneNumber": "+254 7** ***00"  [MASKED],                 │
│   "message": "OTP sent to your phone"                        │
│ }                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Redirect to /auth/verify-otp.html                  │
│ Show OTP input form (6 digit fields)                         │
│ Start 5-minute countdown timer                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ USER RECEIVES SMS:                                             │
│ "Your KSFP verification code is: 123456                       │
│  Valid for 5 minutes."                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ USER ENTERS OTP CODE                                          │
│ [1][2][3][4][5][6]                                            │
│ (Auto-advances between fields)                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: POST /api/auth/verify-otp                          │
│ {                                                              │
│   "phone_number": "+254700000000",                            │
│   "user_id": "usr_xxxxx",                                     │
│   "otp": "123456"                                             │
│ }                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: PhoneAuthService.verifyLoginOTP()                   │
│ 1. Load OTP from storage                                      │
│ 2. Check if expired (max 5 minutes)                           │
│ 3. Check attempts (max 5)                                     │
│ 4. Verify OTP matches                                         │
│ 5. If valid:                                                  │
│    - Update user.status = 'active'                            │
│    - Update user.last_login = NOW()                           │
│    - Delete OTP (cleanup)                                     │
│    - Generate JWT token                                       │
│ 6. Log to auth.log                                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ RESPONSE:                                                      │
│ {                                                              │
│   "token": "KSFP_JWT_TOKEN",                                  │
│   "user": {                                                    │
│     "id": "usr_xxxxx",                                         │
│     "phone_number": "+254700000000",                          │
│     "role": "parent",                                         │
│     "status": "active"                                        │
│   }                                                            │
│ }                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Save token & redirect to /dashboard                │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. API ENDPOINTS

### 3.1 Authentication Endpoints

#### Google OAuth
```
POST /api/auth/google/login
  Request: { token, device }
  Response: { token, refresh_token, user }
  Rate Limit: 5 attempts per 15 minutes

POST /api/auth/google/link
  Auth Required: Yes
  Request: { token }
  Response: { user, google_id }

POST /api/auth/google/unlink
  Auth Required: Yes
  Response: { user }
```

#### Facebook OAuth
```
POST /api/auth/facebook/login
  Request: { access_token, user_id, user_info, device }
  Response: { token, refresh_token, user }

POST /api/auth/facebook/link
  Auth Required: Yes
  Request: { access_token, user_info }
  Response: { user, facebook_id }

POST /api/auth/facebook/unlink
  Auth Required: Yes
  Response: { user }
```

#### Phone Authentication
```
POST /api/auth/phone/send-otp
  Request: { phone_number }
  Response: { user_id, phoneNumber, message }
  Rate Limit: 3 OTP per minute
  Cooldown: 30 seconds between requests

POST /api/auth/verify-otp
  Request: { phone_number, user_id, otp }
  Response: { token, refresh_token, user }
  Max Attempts: 5
  OTP Validity: 5 minutes

POST /api/auth/resend-otp
  Request: { phone_number, user_id }
  Response: { phoneNumber, message }
  Requires: 30-second cooldown

POST /api/auth/phone/update
  Auth Required: Yes
  Request: { phone_number }
  Response: { message }
  Effect: Sends OTP to new number
```

#### Session Management
```
POST /api/auth/refresh
  Request: { refresh_token }
  Response: { token, expires_in }

POST /api/auth/logout
  Auth Required: Yes
  Response: { message }

GET /api/auth/sessions
  Auth Required: Yes
  Response: { sessions: [...] }

POST /api/auth/sessions/:id/revoke
  Auth Required: Yes
  Response: { message }
```

#### Account Linking
```
GET /api/auth/link-account
  Auth Required: Yes
  Response: { google_id, facebook_id, phone_number }

POST /api/auth/account/update
  Auth Required: Yes
  Request: { full_name, email, ... }
  Response: { user }

POST /api/auth/unlink/:provider
  Auth Required: Yes
  Params: google | facebook
  Response: { user }
```

---

## 4. SECURITY IMPLEMENTATION

### 4.1 Password & Token Security

```javascript
// JWT Token Structure
{
  "id": "usr_xxxxx",           // User ID
  "email": "user@email.com",   // Email
  "phone": "+254700000000",    // Phone
  "role": "parent",            // Role
  "iat": 1643278800,           // Issued at
  "exp": 1643365200            // Expires (24 hours)
}

// Token Storage
localStorage: {
  "ksfp_token": "JWT...",
  "ksfp_refresh_token": "JWT...",
  "ksfp_user": { user object },
  "ksfp_expiry": 1643365200
}

// Refresh Flow
- Access token: 24 hours
- Refresh token: 7 days
- Auto-logout on inactivity: 15 minutes
- Auto-logout on token expiry
```

### 4.2 OTP Security

```javascript
// OTP Generation
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
  // 6-digit random number: 100000-999999
}

// OTP Storage
{
  userId: "usr_xxxxx",
  phoneNumber: "+254700000000",
  otp: "123456",          // Plain (server-side only)
  createdAt: 1643278800,
  expiresAt: 1643279100,   // +5 minutes
  attempts: 0,
  verified: false,
  maxAttempts: 5
}

// Security Rules
- OTP expires in 5 minutes
- Max 5 verification attempts
- 30-second cooldown between resends
- Failed attempts tracked
- Locked after max attempts
```

### 4.3 Rate Limiting

```javascript
// Auth Endpoints
- Login attempts: 5 per 15 minutes
- OTP requests: 3 per minute
- OTP verification: 5 attempts per OTP
- Account updates: 10 per hour

// Implementation
Express Rate Limiter with:
- IP-based limiting
- User ID-based limiting
- Time window tracking
- Custom headers returned
```

### 4.4 Audit Logging

```javascript
// Auth Log Entry
{
  id: "log_xxxxx",
  timestamp: "2024-01-27T10:30:00Z",
  action: "google_login",
  provider: "google",
  userId: "usr_xxxxx",
  success: true,
  device: {
    userAgent: "Mozilla/5.0...",
    timezone: "Africa/Nairobi",
    ip: "192.168.1.1"
  },
  message: null
}

// Log Storage
- File-based: logs/auth.log (JSON per line)
- Database: auth_logs table
- Immutable: append-only
- Queryable: by user, provider, date range
- Retention: 2 years (per legal requirement)
```

---

## 5. FRONTEND ARCHITECTURE

### 5.1 File Structure

```
public/
├── auth/
│   ├── login.html              # Login page
│   ├── register.html           # Registration page
│   ├── verify-otp.html         # OTP verification
│   └── link-accounts.html      # Account linking
│
├── js/auth/
│   ├── session-manager.js      # Token & session management
│   ├── google-auth.js          # Google OAuth handler
│   ├── facebook-auth.js        # Facebook OAuth handler
│   ├── phone-auth.js           # Phone OTP handler
│   └── otp-handler.js          # OTP input & validation
│
└── css/
    ├── auth.css                # Auth page styling
    └── buttons.css             # OAuth button styles
```

### 5.2 Session Manager API

```javascript
// Token Management
SessionManager.setToken(token)          // Store JWT
SessionManager.getToken()               // Retrieve JWT
SessionManager.setRefreshToken(token)   // Store refresh
SessionManager.getRefreshToken()        // Retrieve refresh

// User Management
SessionManager.setUser(user)            // Store user object
SessionManager.getUser()                // Get user data
SessionManager.updateUser(userData)     // Update user

// Auth Status
SessionManager.isLoggedIn()             // Check login status
SessionManager.isTokenExpired()         // Check expiry
SessionManager.getTimeToExpiry()        // Time remaining

// Role-Based Access
SessionManager.hasRole('parent')        // Check role
SessionManager.isParent()               // Is parent?
SessionManager.isSchool()               // Is school?
SessionManager.isAdmin()                // Is admin?
SessionManager.canAccess('parent')      // Access check

// Security
SessionManager.getAuthHeader()          // Get auth header
SessionManager.logout()                 // Logout & clear
SessionManager.setupAutoLogout()        // Auto-logout on expiry
SessionManager.setupInactivityLogout()  // Logout on inactivity

// Token
SessionManager.decodeToken(token)       // Decode JWT (no verify)
SessionManager.refreshToken()           // Refresh access token
```

### 5.3 Google Auth API

```javascript
GoogleAuth.init()                       // Initialize OAuth
GoogleAuth.triggerLogin()               // Show login
GoogleAuth.triggerRegister()            // Show register
GoogleAuth.triggerLink()                // Show link account
GoogleAuth.handleLoginResponse(response) // Process callback
GoogleAuth.linkAccount(token)           // Link to account
GoogleAuth.unlinkAccount()              // Unlink account
```

---

## 6. BACKEND ARCHITECTURE

### 6.1 Service Architecture

```
UserModel
├── findById(id)
├── findByEmail(email)
├── findByPhoneNumber(phone)
├── findByGoogleId(googleId)
├── findByFacebookId(facebookId)
├── create(userData)
├── update(userId, updates)
└── delete(userId)

GoogleAuthService
├── verifyToken(token)
├── loginWithGoogle(token)
├── linkAccount(userId, token)
├── unlinkAccount(userId)
└── getUserInfo(token)

FacebookAuthService
├── verifyToken(token)
├── loginWithFacebook(token)
├── linkAccount(userId, token)
├── unlinkAccount(userId)
└── getUserInfo(token)

PhoneAuthService
├── sendLoginOTP(phoneNumber)
├── sendRegistrationOTP(phoneNumber)
├── verifyLoginOTP(userId, otp)
├── resendOTP(userId, phoneNumber)
└── updatePhoneNumber(userId, newPhone)

OTPService
├── generateOTP()
├── sendOTP(phone, otp)
├── storeOTP(userId, phone, otp)
├── verifyOTP(userId, otp)
├── validatePhoneNumber(phone)
├── maskPhoneNumber(phone)
└── cleanupExpiredOTPs()
```

### 6.2 Middleware Chain

```javascript
// Authentication Flow
verifyToken() → {
  req.user = decoded
} → next()

// Protected Route
router.post('/payment',
  verifyToken,           // Verify JWT
  requirePhoneVerification, // Check phone verified
  requireAuth,           // Require logged in
  paymentController
)

// Role-Based Access
router.get('/admin/users',
  verifyToken,
  requireRole('admin'),
  adminController
)

// Optional Auth
router.get('/public-school/:id',
  optionalAuth,          // Optional user
  publicController       // Can work with/without user
)
```

---

## 7. DATABASE SCHEMA

### 7.1 Users Table

```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  google_id VARCHAR(255) UNIQUE,
  facebook_id VARCHAR(255) UNIQUE,
  role ENUM('parent', 'school', 'admin'),
  status ENUM('active', 'suspended', 'deleted', 'pending'),
  verified_at TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 7.2 OTP Table

```sql
CREATE TABLE otps (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  phone_number VARCHAR(20),
  code VARCHAR(6),
  attempts INT DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 7.3 Auth Logs Table

```sql
CREATE TABLE auth_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  action VARCHAR(100),
  provider VARCHAR(50),
  success BOOLEAN,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 8. COMPLIANCE & LEGAL

### 8.1 Data Protection

- **GDPR Compliance**: User rights (access, delete, port)
- **Data Retention**: 2 years for auth logs (per legal requirement)
- **Encryption**: SHA-256 for OTP hashes, AES-256 for tokens
- **Privacy**: Minimal data collection (name, email, phone)

### 8.2 PCI-DSS Compliance

- No password storage (OAuth only)
- No credit card data in auth system
- All payments use external gateway
- Audit trails for all auth actions

### 8.3 Dispute Resolution

- Auth logs prove user ownership
- Phone verification ensures legitimacy
- OTP audit trail provides evidence
- Timestamps for transaction matching

---

## 9. INTEGRATION CHECKLIST

- [ ] Set up Google OAuth credentials
- [ ] Set up Facebook OAuth credentials
- [ ] Configure SMS gateway (Twilio/AfricasTalking)
- [ ] Set JWT_SECRET in environment variables
- [ ] Create database tables from schema
- [ ] Configure email provider (optional)
- [ ] Test all auth flows in staging
- [ ] Security audit of all endpoints
- [ ] Load testing for OTP endpoints
- [ ] Legal review of disclaimer

---

## 10. ENVIRONMENT VARIABLES

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_secret

# SMS Gateway
SMS_PROVIDER=twilio|africastalking  # Choose one
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=5

# Database
DB_HOST=localhost
DB_USER=ksfp
DB_PASSWORD=secure_password
DB_NAME=ksfp_production
```

---

## 11. TROUBLESHOOTING

### OTP Not Received
- Check SMS gateway credentials
- Verify phone number format (+254...)
- Check rate limiting (30-second cooldown)
- Check SMS provider logs

### Google Login Fails
- Verify CLIENT_ID matches Google Cloud config
- Check redirect URI matches
- Verify token signature

### Token Expired
- Auto-refresh should handle transparently
- Max 24-hour session length
- Force re-login if refresh fails

---

## 12. FUTURE ENHANCEMENTS

- [ ] Biometric authentication (Face ID, fingerprint)
- [ ] Security keys (FIDO2)
- [ ] Two-factor authentication (2FA) with authenticator
- [ ] Passwordless authentication via magic links
- [ ] Social recovery via trusted contacts
- [ ] Decentralized identity integration
- [ ] Blockchain-based audit trail

---

**Status**: Production Ready ✅  
**Last Updated**: January 27, 2026  
**Maintainer**: Wamoto Raphael, Meru University
