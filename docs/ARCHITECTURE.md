# KSFP System Architecture

**Kenya School Fee Platform (KSFP) v1.0 Enterprise Edition**  
Comprehensive System Architecture Documentation

---

## Executive Summary

KSFP is an enterprise-grade platform implementing:
- **Star Rating System** (1-5 stars based on data accuracy)
- **ACID-Compliant Transactions** (guaranteed payment safety)
- **Immutable Audit Trails** (tamper-proof logging)
- **PDF Receipt Generation** (court-ready documentation)
- **Fraud Detection & Penalties** (20% fee enforcement)
- **Comprehensive Legal Framework** (Terms, Privacy, Disclaimer, Enforcement)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          KSFP Platform                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Frontend Layer (Public)                                 │   │
│  │  ├─ Parent Portal (index.html)                          │   │
│  │  ├─ School Dashboard (school-dashboard.html)            │   │
│  │  ├─ Admin Panel (admin.html)                            │   │
│  │  ├─ About Page (about.html)                             │   │
│  │  └─ UI Components (rating-stars, payment-form, etc)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Gateway / Express.js Server (server/app.js)        │   │
│  │                                                           │   │
│  │  Middleware Stack:                                        │   │
│  │  ├─ ACID Transaction Middleware (transaction.middleware) │   │
│  │  ├─ Immutable Logging Middleware (logging.middleware)    │   │
│  │  ├─ Body Parser & CORS                                  │   │
│  │  └─ Error Handler                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  API Routes Layer                                        │   │
│  │  ├─ /api/schools/* (School operations)                  │   │
│  │  ├─ /api/payments/* (Payment processing - ACID)         │   │
│  │  ├─ /api/receipts/* (PDF receipt management)            │   │
│  │  ├─ /api/ratings/* (Star rating system)                 │   │
│  │  ├─ /api/admin/* (Admin operations)                     │   │
│  │  ├─ /api/uploads/* (File uploads)                       │   │
│  │  ├─ /api/vacancies/* (Vacancy management)               │   │
│  │  ├─ /api/penalties/* (Penalty enforcement)              │   │
│  │  ├─ /api/analytics/* (Statistics)                       │   │
│  │  └─ /api/audit/* (Log access & verification)            │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Service Layer (Business Logic)                          │   │
│  │  ├─ RatingService (1-5 star calculation)               │   │
│  │  ├─ PaymentService (ACID transactions)                  │   │
│  │  ├─ PDFService (Receipt generation)                     │   │
│  │  ├─ PenaltyService (Fraud detection & penalties)        │   │
│  │  └─ ImmutableLogger (Tamper-proof logging)              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Data Model Layer                                        │   │
│  │  ├─ School (school info, contacts, fees)               │   │
│  │  ├─ Parent (parent details, preferences)                │   │
│  │  ├─ Payment (transaction record)                        │   │
│  │  ├─ Receipt (PDF reference & metadata)                  │   │
│  │  ├─ Rating (1-5 stars with breakdown)                   │   │
│  │  ├─ Vacancy (available seats with tracking)             │   │
│  │  ├─ Upload (file metadata & verification)               │   │
│  │  └─ AuditLog (immutable transaction record)             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Data Storage Layer                                      │   │
│  │  ├─ /data/*.json (Primary database)                     │   │
│  │  │  ├─ schools.json (school directory)                  │   │
│  │  │  ├─ payments.json (transaction records)              │   │
│  │  │  ├─ ratings.json (star ratings)                      │   │
│  │  │  ├─ penalties.json (penalty records)                 │   │
│  │  │  └─ uploads.json (file metadata)                     │   │
│  │  ├─ /storage/receipts/ (PDF files)                      │   │
│  │  ├─ /storage/uploads/ (User uploaded files)             │   │
│  │  ├─ /storage/backups/ (Archive copies)                  │   │
│  │  └─ /logs/*.log (Immutable logs)                        │   │
│  │     ├─ payments.log (payment transactions)              │   │
│  │     ├─ receipts.log (receipt generation)                │   │
│  │     ├─ ratings.log (rating submissions)                 │   │
│  │     ├─ penalties.log (penalty applications)             │   │
│  │     ├─ access.log (API access)                          │   │
│  │     ├─ uploads.log (file operations)                    │   │
│  │     ├─ transactions.log (ACID transactions)             │   │
│  │     └─ errors.log (errors & exceptions)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
KSFP/
├── public/                          # Frontend (User-facing)
│   ├── index.html                   # Parent portal
│   ├── admin.html                   # Admin dashboard
│   ├── school-dashboard.html        # School portal
│   ├── about.html                   # About page
│   ├── css/                         # Stylesheets
│   │   ├── styles.css              # Main styles
│   │   ├── admin.css               # Admin styles
│   │   └── school-dashboard.css    # School portal styles
│   ├── js/                          # JavaScript files
│   │   ├── script.js               # Main script
│   │   ├── admin.js                # Admin logic
│   │   ├── dashboard.js            # Dashboard logic
│   │   ├── charts.js               # Analytics
│   │   └── utils.js                # Utilities
│   ├── components/                  # Reusable HTML components
│   │   ├── rating-stars.html       # ⭐ Star rating display
│   │   ├── payment-form.html       # Payment form
│   │   ├── filter-form.html        # School filter
│   │   └── ...                     # Other components
│   └── assets/                      # Images, icons, etc
│
├── server/                          # Backend (API & Logic)
│   ├── app.js                       # Main Express server
│   ├── config/                      # Configuration
│   ├── routes/                      # API endpoints
│   │   ├── schools.routes.js       # School CRUD
│   │   ├── payments.routes.js      # Payment processing (ACID)
│   │   ├── receipts.routes.js      # Receipt management
│   │   ├── ratings.routes.js       # Rating system
│   │   ├── admin.routes.js         # Admin operations
│   │   ├── uploads.routes.js       # File uploads
│   │   ├── vacancies.routes.js     # Vacancy management
│   │   ├── jobs.routes.js          # Job listings
│   │   └── penalties.routes.js     # Penalty enforcement
│   ├── controllers/                 # Route logic
│   ├── models/                      # Data models
│   │   ├── School.js               # School model
│   │   ├── Payment.js              # Payment model (ACID-safe)
│   │   ├── Receipt.js              # Receipt model
│   │   ├── Rating.js               # Rating model (1-5 stars)
│   │   ├── Vacancy.js              # Vacancy model
│   │   ├── Upload.js               # Upload model
│   │   └── ...                     # Other models
│   ├── services/                    # Business logic services
│   │   ├── RatingService.js        # Star rating calculation
│   │   ├── PaymentService.js       # ACID transaction processing
│   │   ├── PDFService.js           # PDF receipt generation
│   │   └── PenaltyService.js       # Fraud detection & penalties
│   ├── middleware/                  # Custom middleware
│   │   ├── transaction.middleware.js # ACID transaction wrapper
│   │   ├── logging.middleware.js    # Immutable logging
│   │   ├── auth.middleware.js      # Authentication
│   │   └── ...                     # Other middleware
│   └── utils/                       # Utility functions
│
├── storage/                         # File storage
│   ├── receipts/                    # PDF receipt files
│   │   ├── KSFP-2026-000001.pdf   # Receipt 1
│   │   ├── KSFP-2026-000002.pdf   # Receipt 2
│   │   ├── metadata.json           # Receipt index
│   │   └── ...
│   ├── uploads/                     # User uploaded files
│   │   ├── [schoolId]/             # School upload directory
│   │   └── ...
│   └── backups/                     # Archived files
│
├── logs/                            # Immutable audit logs
│   ├── payments.log                # Payment transactions (append-only)
│   ├── receipts.log                # Receipt generation
│   ├── ratings.log                 # Rating submissions
│   ├── penalties.log               # Penalty enforcement
│   ├── access.log                  # API access
│   ├── uploads.log                 # File operations
│   ├── transactions.log            # ACID transactions
│   ├── errors.log                  # Errors & exceptions
│   ├── index.json                  # Log index for search
│   └── ...
│
├── data/                            # Primary database (JSON files)
│   ├── schools.json                # School directory
│   ├── payments.json               # Payment records
│   ├── receipts.json               # Receipt references
│   ├── ratings.json                # Star ratings
│   ├── penalties.json              # Penalty records
│   ├── uploads.json                # File metadata
│   ├── vacancies.json              # Vacancy listings
│   ├── jobs.json                   # Job postings
│   └── ...
│
├── docs/                            # Documentation & Legal
│   ├── README.md                    # Main documentation
│   ├── ARCHITECTURE.md              # This file
│   ├── terms-and-conditions.md      # Legal T&C
│   ├── privacy-policy.md            # Privacy policy
│   ├── disclaimer.md                # Liability disclaimer
│   ├── enforcement-policy.md        # Penalty procedures
│   ├── author.md                    # Author information
│   └── ...
│
├── tests/                           # Automated tests
│   ├── unit/                        # Unit tests
│   ├── integration/                 # Integration tests
│   └── e2e/                         # End-to-end tests
│
├── package.json                     # Dependencies
├── .env.example                     # Environment variables template
└── .gitignore                       # Git ignore rules
```

---

## Core Features & Implementation

### 1. Star Rating System (1-5 Stars)

**Components:**
- [RatingService.js](server/services/RatingService.js)
- [Rating.js](server/models/Rating.js)
- [ratings.routes.js](server/routes/ratings.routes.js)

**Algorithm:**
```
Rating = (25% Fee Transparency) + 
         (25% Academic Results) +
         (20% Upload Accuracy) +
         (15% Vacancy Honesty) +
         (10% Parent Feedback) +
         (5% Admin Verification)
```

**Star Reduction for Violations:**
- Mild: -0.5 stars
- Moderate: -1.0 stars
- Severe: -1.5 stars
- Critical: -2.0 stars

**Visual Display:**
- 5 stars: ★★★★★ (Excellent)
- 4 stars: ★★★★☆ (Very Good)
- 3 stars: ★★★☆☆ (Good)
- 2 stars: ★★☆☆☆ (Fair)
- 1 star: ★☆☆☆☆ (Poor)

### 2. ACID-Compliant Payment Processing

**Components:**
- [PaymentService.js](server/services/PaymentService.js)
- [Payment.js](server/models/Payment.js)
- [transaction.middleware.js](server/middleware/transaction.middleware.js)
- [payments.routes.js](server/routes/payments.routes.js)

**Transaction Flow:**

```
1. BEGIN TRANSACTION
   └─ Assign transactionId

2. VALIDATE
   ├─ Check parent ID
   ├─ Check school ID
   ├─ Verify amount (0 < amount ≤ 500,000 KES)
   └─ Validate email & payment method

3. PROCESS
   ├─ Call payment gateway
   ├─ Await confirmation
   └─ Return gatewayTransactionId

4. GENERATE RECEIPT
   ├─ Create PDF document
   ├─ Add payment details
   ├─ Sign with KSFP signature
   └─ Save to storage/receipts/

5. LOG (Immutable)
   ├─ Write to payments.log
   ├─ Include transaction hash
   └─ Verify hash chain

6. COMMIT
   └─ Store payment record

7. ROLLBACK (if any step fails)
   ├─ Log failure reason
   ├─ Restore previous state
   └─ Return error with transactionId
```

**Atomicity Guarantee:**
- All steps must succeed
- If any step fails, ENTIRE transaction rolls back
- No partial payments recorded
- Parent and school both notified of result

### 3. PDF Receipt Generation

**Components:**
- [PDFService.js](server/services/PDFService.js)
- [Receipt.js](server/models/Receipt.js)
- [receipts.routes.js](server/routes/receipts.routes.js)

**Receipt Format:**
```
┌─────────────────────────────────────────┐
│            KSFP                          │
│   Kenya School Fee Platform             │
├─────────────────────────────────────────┤
│         PAYMENT RECEIPT                  │
│                                          │
│  Receipt No: KSFP-2026-000123           │
│  Date: Jan 27, 2026 10:30:45 EAT        │
│  Transaction ID: TXN-1674826600-ABC123  │
├─────────────────────────────────────────┤
│  Parent: John Kariuki                    │
│  Email: john@example.com                │
│  Phone: +254712345678                   │
│                                          │
│  School: Nakuru High School             │
│  Level: Secondary                        │
│  Location: Nakuru                        │
├─────────────────────────────────────────┤
│  Amount: KES 65,000                     │
│  Purpose: School Fee                     │
│  Method: M-Pesa                         │
│  Status: Completed                      │
├─────────────────────────────────────────┤
│  Important: KSFP does NOT guarantee     │
│  admission. Schools fully liable for     │
│  uploaded information.                   │
├─────────────────────────────────────────┤
│   Served by KSFP                        │
│   Courtesy of the school looked in      │
│                                          │
│  Verify: ksfp.ac.ke/verify/KSFP-...    │
│  Generated: 2026-01-27T10:30:45Z        │
└─────────────────────────────────────────┘
```

**Receipt Metadata:**
- receiptNumber: KSFP-YYYY-XXXXXX
- transactionId: TXN-[timestamp]-[random]
- pdfPath: storage/receipts/[year]/[month]/[receipt].pdf
- signature: "Served by KSFP courtesy of the school looked in"
- verified: true/false (with verification hash)

### 4. Immutable Audit Logging

**Components:**
- [logging.middleware.js](server/middleware/logging.middleware.js)
- ImmutableLogger class with hash-chain verification

**Log Structure:**
```json
{
  "timestamp": "2026-01-27T10:30:45.123Z",
  "isoDate": "2026-01-27",
  "unixTime": 1674826245123,
  "action": "PAYMENT_PROCESSED",
  "details": {
    "amount": 65000,
    "parentEmail": "john@example.com",
    "schoolName": "Nakuru High School",
    "status": "completed"
  },
  "previousHash": "a7f3d8c2e1b9...",
  "sequenceId": 12345,
  "hash": "sha256_of_this_entry"
}
```

**Log Types:**
- `payments.log` - Payment transactions
- `receipts.log` - Receipt generation
- `ratings.log` - Rating submissions
- `penalties.log` - Penalty enforcement
- `access.log` - API access
- `uploads.log` - File operations
- `transactions.log` - ACID transactions
- `errors.log` - Errors & exceptions

**Tamper Detection:**
- Each entry hashed (SHA-256)
- Hash chain verification (previousHash included)
- Sequential numbering prevents deletion
- Append-only file (no updates/overwrites)

### 5. Fraud Detection & Penalties

**Components:**
- [PenaltyService.js](server/services/PenaltyService.js)
- Automated fraud detection system

**Detection Methods:**

1. **Vacancy Fraud**
   - More students filled than vacancies posted
   - Capacity exceeds enrollment
   
2. **Document Fraud**
   - Duplicate files uploaded
   - Plagiarized content detected
   - AI-generated documents
   
3. **Fee Anomalies**
   - Extreme fee increases (>50% YoY)
   - Hidden or undefined fees
   
4. **Data Inconsistencies**
   - Claims high ratings but no documentation
   - Missing critical data
   - Logically impossible data
   
5. **Pattern Detection**
   - Multiple complaints from same school
   - Suspicious upload patterns
   - Coordinated false information

**Penalty Enforcement:**

| Severity | Star Reduction | Fee Penalty | Duration |
|----------|---|---|---|
| Mild | -0.5 | +5% | 3 months |
| Moderate | -1.0 | +10% | 6 months |
| Severe | -1.5 | +20% | 12 months |
| Critical | -2.0 | +50% | 24 months |

**Example:**
- School posts fake KES 10,000 fee
- Detected as moderate fraud (misrepresentation)
- Penalty: +20% fee increase
- New fee: 10,000 + (10,000 × 0.20) = 12,000 KES
- Lasts 12 months (can appeal)

---

## API Endpoints

### Schools
```
GET     /api/schools              # List all schools
GET     /api/schools/:id          # Get school details
POST    /api/schools              # Create school
PUT     /api/schools/:id          # Update school
DELETE  /api/schools/:id          # Delete school
```

### Payments (ACID-Safe)
```
POST    /api/payments             # Process payment
GET     /api/payments/:transactionId  # Get payment status
GET     /api/payments/parent/:parentId  # Parent payment history
GET     /api/payments/stats       # Payment statistics
POST    /api/payments/:id/refund  # Refund payment
```

### Receipts (PDF)
```
GET     /api/receipts/:receiptId  # Get receipt details
GET     /api/receipts/:receiptId/pdf  # Download PDF
POST    /api/receipts/:receiptId/resend  # Resend email
GET     /api/receipts/parent/:parentId  # Parent receipts
GET     /api/receipts/verify/:receiptId  # Verify authenticity
GET     /api/receipts/stats       # Receipt statistics
```

### Ratings (1-5 Stars)
```
GET     /api/ratings/:schoolId    # Get school rating
POST    /api/ratings              # Submit rating
GET     /api/ratings/:schoolId/feedback  # Aggregated feedback
PUT     /api/ratings/:schoolId/verify  # Admin verify
```

### Analytics
```
GET     /api/analytics/payments   # Payment stats
GET     /api/analytics/penalties  # Penalty stats
GET     /api/analytics/ratings/:schoolId  # Rating breakdown
```

### Audit & Compliance
```
GET     /api/audit/logs/:category # Read immutable logs
GET     /api/audit/logs/:category/verify  # Verify integrity
POST    /api/audit/export/:category  # Export logs
```

---

## Security Architecture

### Data Protection
- **Encryption at Rest:** AES-256
- **Encryption in Transit:** TLS 1.2+
- **Hashing:** SHA-256 for audit logs
- **Payment Security:** PCI-DSS compliant (no card storage)

### Access Control
- **JWT Authentication** for API access
- **Role-Based Access Control** (RBAC)
  - Parent role
  - School role
  - Admin role
  - Auditor role

### Audit & Compliance
- **Immutable Logs:** Hash-chained, append-only
- **ACID Transactions:** All-or-nothing processing
- **Transaction Verification:** Sequential numbering + hash chain
- **Log Integrity Checking:** Automated verification endpoint

---

## Deployment Considerations

### Requirements
- Node.js 14+ or higher
- npm or yarn
- pdfkit library (for PDF generation)
- Chart.js (for analytics)

### Installation
```bash
npm install
npm install pdfkit
npm install chart.js
```

### Environment Variables
```
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
PAYMENT_GATEWAY=mpesa  # or stripe, paypal
```

### Running the Server
```bash
npm start              # Production
npm run dev           # Development
npm run test          # Testing
```

### Production Deployment
- Use process manager (PM2)
- Enable HTTPS/TLS
- Configure backup procedures
- Set up log rotation
- Enable monitoring & alerting

---

## Data Models

### School
```javascript
{
  id: "SCHOOL-001",
  name: "Nakuru High School",
  location: "Nakuru County",
  level: "Secondary",
  contacts: { phone, email, principal },
  fees: [{ class, amount, description }],
  vacancies: [{ class, count, filled }],
  ratings: { stars, verified, lastUpdated },
  uploads: [{ file, type, verifiedAt }],
  adminVerified: boolean,
  createdAt: "2026-01-01T00:00:00Z"
}
```

### Payment
```javascript
{
  id: "PAY-123",
  transactionId: "TXN-...",
  parentId: "PARENT-001",
  schoolId: "SCHOOL-001",
  amount: 65000,
  currency: "KES",
  status: "completed|pending|failed|refunded",
  receiptId: "KSFP-2026-000001",
  processedAt: "2026-01-27T10:30:45Z",
  refundId: null,
  transactionLog: [...]
}
```

### Receipt
```javascript
{
  id: "RECEIPT-001",
  receiptNumber: "KSFP-2026-000001",
  transactionId: "TXN-...",
  amount: 65000,
  pdfPath: "storage/receipts/KSFP-2026-000001.pdf",
  pdfUrl: "/api/receipts/KSFP-2026-000001/pdf",
  status: "generated|sent|viewed|downloaded",
  verified: true,
  signature: "Served by KSFP courtesy of the school looked in",
  createdAt: "2026-01-27T10:30:45Z"
}
```

### Rating
```javascript
{
  id: "RATING-001",
  schoolId: "SCHOOL-001",
  stars: 4.5,
  verified: true,
  factors: {
    feeTransparency: 90,
    academicResults: 85,
    uploadAccuracy: 95,
    vacancyHonesty: 80,
    parentFeedback: 75,
    adminVerification: 100
  },
  penalties: [{ penaltyId, amount, reason, appliedDate }],
  status: "active|locked|appealed",
  lastUpdated: "2026-01-27T10:30:45Z"
}
```

---

## Testing Strategy

### Unit Tests
- Service logic testing
- Model validation
- Utility function testing

### Integration Tests
- API endpoint testing
- Database operation testing
- Cross-service communication

### End-to-End Tests
- Complete user workflows
- Payment processing
- Receipt generation & verification
- Rating updates

### Security Tests
- ACID transaction atomicity
- Hash chain integrity
- Access control enforcement

---

## Monitoring & Alerting

### Key Metrics
- Payment success rate
- Receipt generation time
- Rating calculation time
- Log verification status
- Error rate & types
- API response times

### Log Monitoring
- Monitor error.log for issues
- Verify log integrity regularly
- Check for unusual patterns
- Track fraud detection rate

---

## Future Enhancements

### Phase 3 (February 2026)
- Beta testing with schools
- Security audits
- Performance optimization
- User feedback integration

### Phase 4 (March 2026)
- PostgreSQL/MySQL support
- Mobile app (iOS/Android)
- SMS notifications
- Email integration
- Government integration APIs

### Long-Term
- Machine learning for fraud detection
- Blockchain for immutable records
- Multi-currency support
- Advanced analytics dashboards
- International expansion

---

**Architecture Version:** 1.0  
**Last Updated:** January 27, 2026  
**Platform:** Kenya School Fee Platform (KSFP)  
**Developer:** Wamoto Raphael, Meru University

"Served by KSFP courtesy of the school looked in"
