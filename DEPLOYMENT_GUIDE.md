# Kenya School Fee Platform - Deployment Guide

**Version**: 2.0.0 Advanced Edition  
**Release Date**: January 28, 2026  
**Author**: Wanoto Raphael, Meru University IT  
**All Rights Reserved © 2026**

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [System Requirements](#system-requirements)
3. [Frontend Deployment](#frontend-deployment)
4. [Backend Deployment](#backend-deployment)
5. [Database Setup](#database-setup)
6. [Configuration](#configuration)
7. [Security Hardening](#security-hardening)
8. [Deployment Process](#deployment-process)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality
- [x] All annual fees implemented (no monthly fees)
- [x] Admin dashboard enhanced with Fee Management section
- [x] Performance alerts configured
- [x] Compliance module updated
- [x] All files committed to git
- [x] No console errors or warnings

### Backend APIs
- [x] `/api/schools` - GET, POST, PUT, DELETE
- [x] `/api/payments` - GET, POST, PUT
- [x] `/api/admin/dashboard` - GET
- [x] `/api/admin/schools` - GET
- [x] `/api/admin/performance/alerts` - GET
- [x] `/api/admin/fees` - GET, POST
- [x] `/api/compliance/penalties` - GET, POST
- [x] Error handling implemented
- [x] Logging configured

### Frontend Features
- [x] Advanced admin dashboard loaded
- [x] School management functional
- [x] Fee management interface ready
- [x] Payments tracking enabled
- [x] Performance analytics displayed
- [x] Compliance section implemented
- [x] Responsive design tested
- [x] Cross-browser compatibility verified

### Database
- [x] Fee structure schema created
- [x] School data migrated to annual fees
- [x] Performance tracking tables ready
- [x] Audit logs configured
- [x] Backups scheduled

---

## System Requirements

### Server Requirements
```
- Node.js >= 14.0.0
- npm >= 6.0.0
- 2GB RAM minimum
- 10GB disk space minimum
- Internet connectivity
```

### Browser Support
```
- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90
- Mobile browsers (iOS Safari, Chrome Mobile)
```

### Database Options
```
- SQLite (development)
- PostgreSQL (recommended)
- MySQL 5.7+
```

---

## Frontend Deployment

### Step 1: Build Static Files
```bash
cd /path/to/KSSFK
# All frontend files are static - no build step required
# Files are ready to serve from public/ and root directories
```

### Step 2: Serve Static Files
```bash
# Option A: Using Node.js Express (recommended)
npm install express
node server/app.js

# Option B: Using a web server
# Copy files to /var/www/html (nginx/Apache)

# Option C: Using Docker
docker build -t ksfp-frontend .
docker run -p 80:3000 ksfp-frontend
```

### Step 3: Configure Assets
```bash
# Verify all asset paths are correct
# Update asset paths in HTML files if needed
find . -name "*.html" -exec grep -l "src=" {} \;
```

---

## Backend Deployment

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Environment Configuration
Create `.env` file:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/ksfp
LOG_LEVEL=info
ADMIN_EMAIL=admin@ksfp.ac.ke
JWT_SECRET=your-secret-key-here
```

### Step 3: Start Backend Server
```bash
# Development
npm run dev

# Production
npm start

# With PM2 (recommended for production)
pm2 start server/app.js --name "ksfp-api"
```

### Step 4: Verify APIs
```bash
# Test dashboard endpoint
curl http://localhost:3000/api/admin/dashboard

# Test schools endpoint
curl http://localhost:3000/api/schools

# Test fees endpoint
curl http://localhost:3000/api/admin/fees
```

---

## Database Setup

### Option A: PostgreSQL (Recommended)

```bash
# Create database
createdb ksfp

# Load schema
psql ksfp < database/phase5-admin-schema.sql
psql ksfp < database/fee-structure-update.sql

# Verify tables
psql ksfp -c "\dt"
```

### Option B: MySQL

```bash
# Create database
mysql -u root -p
CREATE DATABASE ksfp;
USE ksfp;

# Load schema
SOURCE database/phase5-admin-schema.sql;
SOURCE database/fee-structure-update.sql;

# Verify tables
SHOW TABLES;
```

### Option C: SQLite (Development)

```bash
# Initialize database
sqlite3 ksfp.db < database/fee-structure-update.sql

# Verify
sqlite3 ksfp.db ".tables"
```

---

## Configuration

### 1. API Configuration
Edit `server/config/index.js`:
```javascript
module.exports = {
  api: {
    port: process.env.PORT || 3000,
    baseUrl: 'https://api.ksfp.ac.ke',
    timeout: 30000
  },
  database: {
    url: process.env.DATABASE_URL,
    pool: { min: 2, max: 10 }
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    tokenExpiry: '24h'
  }
};
```

### 2. Fee Structure Configuration
Annual fee ranges are now configured in `database/fee-structure-update.sql`:
```sql
-- Primary School (Annual)
- FREE: 0 KES
- AFFORDABLE: 1,500 - 7,500 KES
- MODERATE: 7,500 - 50,000 KES
- PREMIUM: 50,000+ KES

-- Secondary School (Annual)
- FREE: 0 KES
- AFFORDABLE: 1,500 - 25,500 KES
- MODERATE: 25,500 - 100,000 KES
- PREMIUM: 100,000+ KES
```

### 3. Payment Gateway Setup
Configure in `server/services/PaymentService.js`:
```javascript
const paymentGateway = {
  provider: 'pesapal', // or 'mpesa', 'bank'
  apiKey: process.env.PAYMENT_API_KEY,
  apiSecret: process.env.PAYMENT_API_SECRET,
  callbackUrl: 'https://api.ksfp.ac.ke/api/payments/callback'
};
```

---

## Security Hardening

### 1. HTTPS Configuration
```bash
# Generate SSL certificates
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

# Update server
const https = require('https');
const fs = require('fs');
https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
}, app).listen(443);
```

### 2. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
```

### 3. CORS Configuration
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));
```

### 4. Input Validation
All endpoints should validate input:
```javascript
const { body, validationResult } = require('express-validator');

router.post('/api/schools', [
  body('name').notEmpty().trim().escape(),
  body('annualFee').isInt({ min: 0 }),
  body('email').isEmail().normalizeEmail()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process request
});
```

### 5. Database Security
```bash
# Create database user with limited permissions
CREATE USER ksfp_app WITH PASSWORD 'strong_password_here';
GRANT CONNECT ON DATABASE ksfp TO ksfp_app;
GRANT USAGE ON SCHEMA public TO ksfp_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO ksfp_app;
```

---

## Deployment Process

### Using Docker (Recommended)

Create `Dockerfile`:
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
```

Deploy:
```bash
# Build image
docker build -t ksfp:2.0 .

# Push to registry
docker tag ksfp:2.0 your-registry/ksfp:2.0
docker push your-registry/ksfp:2.0

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  --name ksfp-api \
  your-registry/ksfp:2.0
```

### Manual Deployment

```bash
# 1. Clone repository
git clone https://github.com/your-org/KSSFK.git
cd KSSFK

# 2. Install dependencies
npm install
cd backend && npm install
cd ..

# 3. Configure environment
cp .env.example .env
nano .env  # Edit with your values

# 4. Run migrations
psql ksfp < database/fee-structure-update.sql

# 5. Start services
npm start  # Starts frontend
node server/app.js  # Starts backend in another terminal

# 6. Verify health
curl http://localhost:3000/health
curl http://localhost:3000/api/admin/dashboard
```

---

## Post-Deployment Verification

### 1. Health Checks
```bash
# API health
curl -X GET http://localhost:3000/health

# Dashboard data
curl -X GET http://localhost:3000/api/admin/dashboard

# Schools data
curl -X GET http://localhost:3000/api/schools

# Fees data
curl -X GET http://localhost:3000/api/admin/fees
```

### 2. Frontend Verification
```bash
# Check if dashboard loads
# Navigate to: http://localhost:3000/public/admin-dashboard.html

# Verify:
- [ ] Admin sidebar loads
- [ ] Dashboard metrics display
- [ ] Charts render correctly
- [ ] Fee Management section visible
- [ ] Payments section functional
- [ ] Compliance section accessible
- [ ] No console errors
```

### 3. Database Verification
```bash
# Check tables exist
psql ksfp -c "\dt"

# Verify school data
psql ksfp -c "SELECT COUNT(*) FROM schools;"

# Check fee structure
psql ksfp -c "SELECT * FROM fee_guidelines LIMIT 5;"

# Verify audit logs
psql ksfp -c "SELECT COUNT(*) FROM audit_logs;"
```

### 4. Performance Testing
```bash
# Load test with Apache Bench
ab -n 1000 -c 10 http://localhost:3000/api/schools

# Monitor response times
watch -n 1 'curl -w "%{time_total}s\n" -o /dev/null http://localhost:3000/api/dashboard'
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

#### 2. Database Connection Error
```bash
# Test connection
psql -h localhost -U ksfp_app -d ksfp

# Check credentials in .env
cat .env | grep DATABASE_URL

# Verify PostgreSQL service
systemctl status postgresql
```

#### 3. Missing Dependencies
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for conflicts
npm audit
```

#### 4. CORS Errors
```bash
# Check CORS configuration
echo $ALLOWED_ORIGINS

# Add your domain to .env
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

#### 5. File Not Found Errors
```bash
# Verify file paths
ls -la public/admin-dashboard.html
ls -la data/schools.json

# Check asset references
grep -r "href=" public/*.html | grep -v "http"
```

### Logging and Monitoring

```bash
# View application logs
tail -f logs/application.log

# View error logs
tail -f logs/error.log

# Enable debug mode
DEBUG=* npm start

# Monitor with PM2
pm2 logs ksfp-api
```

---

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop current version
pm2 stop ksfp-api

# 2. Restore previous code
git rollback HEAD~1

# 3. Restore database (if needed)
pg_restore ksfp_backup.sql | psql ksfp

# 4. Start previous version
pm2 start ksfp-api

# 5. Verify
curl http://localhost:3000/api/admin/dashboard
```

---

## Support and Maintenance

### Regular Maintenance Tasks
- [ ] Daily: Check error logs
- [ ] Weekly: Review performance metrics
- [ ] Monthly: Database optimization
- [ ] Quarterly: Security updates
- [ ] Yearly: Full system audit

### Contact Information
- **Developer**: Wanoto Raphael
- **Institution**: Meru University IT Department
- **Email**: wanoto.raphael@meru.ac.ke
- **Support**: admin@ksfp.ac.ke

---

## Version History

### v2.0.0 (January 28, 2026)
- ✅ Advanced Admin Dashboard
- ✅ Annual Fee Management (replaces monthly fees)
- ✅ Enhanced UI/UX
- ✅ Payments tracking
- ✅ Performance analytics
- ✅ Compliance monitoring

### v1.0.0 (Previous)
- Initial release with monthly fee structure

---

**Copyright © 2026 Kenya School Fee Platform. All Rights Reserved.**  
**Developer: Wanoto Raphael - Meru University IT**
