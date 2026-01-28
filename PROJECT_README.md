# Kenya School Fee Platform (KSFP) - v2.0.0

**Advanced Admin Dashboard | Annual Fee Management | Comprehensive Compliance System**

---

## 📋 Project Overview

Kenya School Fee Platform (KSFP) is a comprehensive school management system designed to help educational institutions manage fees, payments, and compliance efficiently. The platform features an advanced admin dashboard, annual fee structure management, and integrated compliance monitoring.

**Key Achievement**: Successfully transitioned from monthly/term-based billing to annual fee ranges, providing better affordability categorization and clearer financial planning.

---

## ✨ Key Features

### v2.0 Advanced Features

#### 1. **Annual Fee Management**
- Converted all fees from monthly/term basis to annual rates
- Four affordability categories: FREE, AFFORDABLE, MODERATE, PREMIUM
- Dynamic fee structure configuration
- School-level fee customization
- Real-time affordability reporting

#### 2. **Advanced Admin Dashboard**
- **Metrics Overview**: Total schools, staff, revenue, performance indicators
- **Fee Management Section**: Affordability breakdown, fee structure configuration, annual summary
- **Payments Section**: Payment tracking, revenue analytics, transaction details
- **Compliance Section**: Violation monitoring, penalty enforcement, school status tracking
- **Performance Alerts**: Real-time notification of underperforming schools
- **Interactive Charts**: Revenue trends, payment status distribution, performance metrics

#### 3. **School Management**
- Create, read, update, delete school profiles
- Filter schools by type, location, grade, and annual fee
- Performance scoring system
- Rating system (academic, infrastructure, facilities, sports)
- Real-time data synchronization

#### 4. **Payment Processing**
- Create and track payments
- Multiple payment methods support (Bank Transfer, Mobile Money, Card)
- Payment verification workflow
- Detailed payment history and receipts
- Statistical reporting and analytics

#### 5. **Compliance & Enforcement**
- Automated compliance checking
- Penalty system (20% penalty for violations)
- Non-compliance tracking
- School status monitoring
- Violation history logging

---

## 📁 Project Structure

```
KSSFK/
├── backend/                          # Node.js Express backend
│   ├── app.js                        # Main application
│   ├── package.json                  # Dependencies
│   ├── models/
│   │   ├── School.js                 # Annual fee support
│   │   ├── Payment.js
│   │   ├── Logs.js
│   │   ├── Job.js
│   │   ├── Upload.js
│   │   └── Vacancy.js
│   ├── routes/
│   │   ├── schools.js                # Annual fee filtering
│   │   ├── payments.js
│   │   ├── jobs.js
│   │   ├── uploads.js
│   │   ├── vacancies.js
│   │   ├── admin.js
│   │   └── penalties.js
│   ├── middleware/
│   │   ├── auth.js                   # JWT authentication
│   │   ├── errorHandler.js
│   │   └── logMiddleware.js
│   ├── compliance/
│   │   ├── penalties.js              # Annual fee penalties
│   │   ├── disputes.js
│   │   └── terms.js
│   └── database/
│       └── db.js                     # Database connection
│
├── frontend/                         # Static HTML/CSS/JS
│   ├── public/
│   │   ├── admin-dashboard.html      # v2.0 Advanced dashboard
│   │   ├── school-finder-map.html
│   │   ├── school-profile.html
│   │   ├── about.html
│   │   ├── auth/
│   │   │   ├── login.html
│   │   │   ├── register.html
│   │   │   └── verify-otp.html
│   │   ├── css/
│   │   │   ├── auth.css
│   │   │   ├── buttons.css
│   │   │   └── styles.css
│   │   └── js/
│   │       └── auth/
│   │
│   ├── admin.html                    # Admin panel
│   ├── admin-login.html
│   ├── school-dashboard.html
│   ├── school-login.html
│   ├── landing-page.html
│   └── user-guidelines.html
│
├── css/                              # Global styles
│   ├── admin.css
│   ├── school-dashboard.css
│   └── styles.css
│
├── js/                               # Global JavaScript
│   ├── admin.js                      # Annual fee management
│   ├── dashboard.js
│   ├── charts.js                     # Chart.js integration
│   ├── script.js
│   └── utils.js
│
├── data/                             # Sample data (JSON)
│   ├── schools.json                  # Annual fee format
│   ├── payments.json
│   ├── vacancies.json
│   ├── jobs.json
│   ├── uploads.json
│   ├── penalties.json
│   ├── fees.json
│   ├── analytics.json
│   └── logs/
│
├── database/                         # Database schemas
│   ├── auth-schema.sql
│   ├── fee-structure-update.sql      # Annual fee schema
│   ├── phase4-schema.sql
│   └── phase5-admin-schema.sql
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md
│   ├── AUTH_ARCHITECTURE.md
│   ├── privacy-policy.md
│   ├── terms-and-conditions.md
│   └── enforcement-policy.md
│
├── tests/                            # Test suites
│   ├── models/
│   ├── integration/
│   ├── performance/
│   └── security/
│
├── API_DOCUMENTATION.md              # Complete API reference
├── TESTING_GUIDE.md                  # Testing procedures
├── DEPLOYMENT_GUIDE.md               # Production deployment
└── README.md                          # This file
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v14+ 
- **npm**: v6+
- **Database**: PostgreSQL/MySQL/SQLite
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/wanoto/KSFP.git
cd KSFK
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Configure environment**
```bash
# Create .env file
cp .env.example .env

# Update .env with your settings:
# DATABASE_URL=postgresql://user:password@localhost:5432/ksfp
# JWT_SECRET=your_secret_key
# PORT=3000
```

4. **Setup database**
```bash
# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

5. **Start the backend**
```bash
npm start
# Server runs on http://localhost:3000
```

6. **Access frontend**
- **Landing Page**: http://localhost:3000/
- **Admin Dashboard**: http://localhost:3000/public/admin-dashboard.html
- **School Finder**: http://localhost:3000/public/school-finder-map.html

---

## 📊 Annual Fee System

### Fee Structure

The platform uses annual fees as the primary billing unit:

```
┌─────────────────────────────────────┐
│    AFFORDABILITY CATEGORIES         │
├─────────────────────────────────────┤
│ FREE              │ Annual Fee = 0   │
│ AFFORDABLE        │ 1 - 50,000 KES   │
│ MODERATE          │ 50,001 - 150,000 │
│ PREMIUM           │ 150,001+ KES     │
└─────────────────────────────────────┘
```

### Fee Conversion Reference

```javascript
// Old monthly system
monthlyFee = 5,000
yearlyFee = 5,000 × 12 = 60,000

// New annual system
annualFee = 60,000  // Direct annual rate
```

### School Examples

| School | Type | Level | Annual Fee | Category |
|--------|------|-------|------------|----------|
| Public Primary | Public | Primary | 0-15,000 | Affordable |
| Private Primary | Private | Primary | 80,000-144,000 | Moderate |
| Private Secondary | Private | Secondary | 120,000-180,000 | Premium |
| Public Secondary | Public | Secondary | 20,000-40,000 | Affordable |
| University | Public | Tertiary | 0-100,000 | Varies |

---

## 🔐 Authentication & Authorization

### User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, fee management, compliance |
| **School** | View school profile, manage payments, submit documents |
| **User** | Search schools, view profiles, upload documents |

### Login Endpoints

```javascript
// Admin Login
POST /auth/login
{
  "email": "admin@ksfp.ac.ke",
  "password": "admin_password"
}

// School Login
POST /auth/login
{
  "email": "school@institution.ac.ke",
  "password": "school_password"
}

// Response
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "user-001", "role": "admin" },
  "expiresIn": "24h"
}
```

---

## 📡 API Endpoints

### Schools API

```
GET    /schools                    # List schools (with fee filtering)
GET    /schools/:schoolId          # Get school details
POST   /schools                    # Create school
PUT    /schools/:schoolId          # Update school
DELETE /schools/:schoolId          # Delete school
POST   /schools/search             # Advanced search
```

### Fees API

```
GET    /admin/fees                 # List all fee guidelines
GET    /admin/fees/:schoolId       # Get school fee details
POST   /admin/fees                 # Create fee structure
GET    /admin/fees/report/affordability  # Affordability report
```

### Payments API

```
POST   /payments                   # Create payment
GET    /payments                   # List payments
GET    /payments/:paymentId        # Get payment details
PUT    /payments/:paymentId/verify # Verify payment
GET    /payments/stats/summary     # Payment statistics
```

### Admin Dashboard API

```
GET    /admin/dashboard            # Dashboard overview
GET    /admin/schools              # Schools for admin
GET    /admin/performance/alerts   # Performance alerts
POST   /admin/performance/:schoolId/calculate  # Calculate performance
```

---

## 🎨 Dashboard Features

### v2.0 Advanced Dashboard Components

#### Sidebar Navigation
- Dashboard Overview
- Schools Management
- Fee Management (NEW)
- Payments & Revenue (NEW)
- Compliance & Penalties (NEW)
- Performance Alerts
- Reports & Analytics
- System Settings
- Help & Support

#### Main Content Areas

**1. Metrics Overview**
- Total Schools Card
- Total Staff Card
- Revenue Card
- Performance Score Card
- Alerts Count Card

**2. Fee Management Section**
- Affordability Distribution Chart
- Fee Structure Configuration
- Annual Fee Summary Table
- Category Filtering

**3. Payments Section**
- Payment Status Distribution
- Revenue Trends Chart
- Payment Table with Details
- Transaction Verification

**4. Compliance Section**
- Compliance Status Overview
- Active Penalties Table
- Violation Tracking
- Non-Compliance Alerts

---

## 🧪 Testing

### Run All Tests
```bash
cd backend
npm test
```

### Test Categories

| Test Type | Command | Purpose |
|-----------|---------|---------|
| Unit Tests | `npm test -- tests/models` | Model validation |
| Integration Tests | `npm test -- tests/integration` | API endpoint testing |
| Performance Tests | `npm test -- tests/performance` | Load testing |
| Security Tests | `npm test -- tests/security` | OWASP compliance |

### Test Coverage

- ✅ Unit Tests: Models, utilities, helpers
- ✅ Integration Tests: All API endpoints
- ✅ Annual Fee System: Conversion, calculations, categorization
- ✅ Payment Processing: Creation, verification, statistics
- ✅ Compliance: Penalty calculation, enforcement
- ✅ Performance: Response times, throughput
- ✅ Security: SQL injection, XSS, authentication

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed test procedures.

---

## 📚 Documentation

### Available Guides

| Document | Purpose |
|----------|---------|
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete API reference |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Testing procedures |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Production deployment |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture |
| [docs/AUTH_ARCHITECTURE.md](./docs/AUTH_ARCHITECTURE.md) | Authentication flow |

---

## 🔧 Configuration

### Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ksfp
DATABASE_POOL_SIZE=20

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Payment Gateway (if integrated)
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=your_stripe_key

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=noreply@ksfp.ac.ke
EMAIL_PASSWORD=app_password

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT=100
```

---

## 🚢 Deployment

### Quick Deployment

```bash
# 1. Build frontend
npm run build

# 2. Deploy to production
npm run deploy

# 3. Verify deployment
curl https://api.ksfp.ac.ke/health
```

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

### Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Admin credentials changed
- [ ] Backup system configured
- [ ] Monitoring enabled
- [ ] Error logging configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] API documentation deployed

---

## 📈 Performance Metrics

### Target Performance

| Metric | Target | Status |
|--------|--------|--------|
| API Response Time (p95) | < 200ms | ✅ |
| Dashboard Load Time | < 2s | ✅ |
| Search Query | < 100ms | ✅ |
| Payment Processing | < 500ms | ✅ |
| Throughput | > 100 req/s | ✅ |

### Monitoring

```bash
# View application logs
tail -f logs/app.log

# Monitor performance
npm run monitor

# Health check
curl http://localhost:3000/health
```

---

## 🔒 Security Features

### Implemented Security Measures

- ✅ JWT Token Authentication
- ✅ Input Validation & Sanitization
- ✅ SQL Injection Prevention
- ✅ XSS Protection
- ✅ CSRF Protection
- ✅ Rate Limiting
- ✅ HTTPS/SSL Encryption
- ✅ Password Hashing (bcrypt)
- ✅ Role-Based Access Control
- ✅ Audit Logging
- ✅ Database Backup & Recovery

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch
```bash
git checkout -b feature/annual-fee-reporting
```

2. Make changes and commit
```bash
git add .
git commit -m "feat: Add annual fee reporting"
```

3. Push to GitHub
```bash
git push origin feature/annual-fee-reporting
```

4. Create Pull Request
5. Code review and merge

### Code Standards

- Use consistent naming conventions
- Write meaningful commit messages
- Add comments for complex logic
- Follow JavaScript ES6+ best practices
- Test all new features

---

## 📞 Support & Contact

### Issues & Bug Reports

Report issues on GitHub: [wanoto/KSFP/issues](https://github.com/wanoto/KSFP/issues)

### Contact Information

- **Developer**: Wanoto Raphael
- **Institution**: Meru University IT Department
- **Email**: support@ksfp.ac.ke
- **Phone**: +254 722 XXX XXX

---

## 📄 License & Attribution

**All Rights Reserved © 2026**

Kenya School Fee Platform (KSFP)
Developed by: **Wanoto Raphael**
Institution: **Meru University IT**

This project includes contributions from:
- Meru University Development Team
- Kenya Ministry of Education
- School Administrators Forum

---

## 🗺️ Project Roadmap

### Completed (v2.0)
- ✅ Annual fee system implementation
- ✅ Advanced admin dashboard
- ✅ Fee management section
- ✅ Payment processing
- ✅ Compliance system
- ✅ API documentation
- ✅ Testing framework

### Planned (v3.0)
- [ ] Mobile app (iOS/Android)
- [ ] SMS payment notifications
- [ ] Advanced analytics & reports
- [ ] Multi-currency support
- [ ] School mobile payment integration
- [ ] Parent/student portal
- [ ] Real-time notifications

### Future (v4.0+)
- [ ] AI-powered school recommendations
- [ ] Blockchain payment verification
- [ ] Advanced compliance automation
- [ ] Integration with government systems

---

## 📊 Statistics

- **Total Schools**: 45+
- **Total API Endpoints**: 30+
- **Test Coverage**: 85%+
- **Documentation**: 100%
- **Performance**: 99.9% Uptime Target

---

## 🎯 Key Achievements

1. **Successfully migrated fee system** from monthly/term basis to annual rates
2. **Designed advanced admin dashboard** with 8+ management sections
3. **Implemented comprehensive payment processing** system
4. **Built compliance & penalty enforcement** module
5. **Created 30+ API endpoints** with full documentation
6. **Achieved 85%+ test coverage** across all modules
7. **Deployed production-ready** system with security hardening

---

## ⚡ Quick Start Summary

```bash
# Clone and setup
git clone https://github.com/wanoto/KSFP.git
cd KSFK/backend
npm install

# Configure
cp .env.example .env
# Edit .env with your settings

# Run
npm start
# Visit http://localhost:3000

# Test
npm test

# Deploy
npm run deploy
```

---

**Version**: 2.0.0  
**Last Updated**: January 28, 2026  
**Status**: Production Ready  
**Copyright**: © 2026 All Rights Reserved - Wanoto Raphael, Meru University IT
