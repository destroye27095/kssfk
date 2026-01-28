# KSFP Developer Quick Reference Guide

**Version**: 2.0.0  
**Updated**: January 28, 2026

---

## 🚀 Quick Setup (5 minutes)

```bash
# 1. Clone repo
git clone https://github.com/wanoto/KSFP.git && cd KSFK

# 2. Install dependencies
cd backend && npm install

# 3. Setup environment
echo "DATABASE_URL=sqlite:./app.db
JWT_SECRET=dev_secret_key
PORT=3000" > .env

# 4. Start server
npm start

# Done! Visit http://localhost:3000
```

---

## 📝 Common Commands

```bash
# Development
npm start              # Start dev server
npm test               # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Production
npm run build          # Build for production
npm run deploy         # Deploy to production
npm run monitor        # Monitor performance

# Git operations
git status             # Check changes
git add .              # Stage all changes
git commit -m "msg"    # Commit changes
git push origin main   # Push to GitHub
```

---

## 🏗️ Project Architecture

```
Request → Middleware → Routes → Controllers → Models → Database
   ↓         (Auth)     (API)      (Logic)     (ORM)
Response ← Response    Response    Response    Response
```

### Directory Purpose

| Path | Purpose |
|------|---------|
| `backend/app.js` | Express app initialization |
| `backend/routes/` | API endpoint definitions |
| `backend/models/` | Database models (School, Payment, etc) |
| `backend/middleware/` | Auth, error handling, logging |
| `backend/compliance/` | Penalty calculation, enforcement |
| `data/` | Sample JSON data |
| `database/` | SQL schemas and migrations |
| `js/admin.js` | Admin panel JavaScript |
| `public/admin-dashboard.html` | Admin dashboard UI |

---

## 💾 Annual Fee System (CRITICAL)

### The Change
```javascript
// OLD (pre-v2.0)
monthlyFee = 5000
yearlyFee = 5000 * 12 = 60000

// NEW (v2.0+)
annualFee = 60000  // Direct annual, NOT calculated
```

### Affected Files
- ❗ `backend/models/School.js` - Uses `annualFee` only
- ❗ `backend/routes/schools.js` - Filters by `annualFee`
- ❗ `backend/compliance/penalties.js` - Calculates on `annualFee`
- ❗ `data/schools.json` - Contains `annualFee` only
- ❗ `js/admin.js` - Displays `annualFee`
- ❗ `database/fee-structure-update.sql` - Annual rates

### Implementation Pattern
```javascript
// Always verify: school.annualFee (never monthlyFee)
const affordability = school.annualFee === 0 ? 'FREE' :
                     school.annualFee < 50000 ? 'AFFORDABLE' :
                     school.annualFee < 150000 ? 'MODERATE' :
                     'PREMIUM';

// Penalties work on annualFee
const penaltyAmount = school.annualFee * 0.20;  // 20% penalty
```

---

## 🔑 Key Code Patterns

### Creating a School
```javascript
// POST /schools
const school = new School({
  name: 'School Name',
  grade: 'Primary',
  annualFee: 100000,  // ANNUAL FEE
  academicRating: 8.5
});

school.validate();  // Throws if invalid
school.save();      // Persists to DB
```

### Processing Payment
```javascript
// POST /payments
const payment = {
  schoolId: 'school-001',
  amount: 5000,
  purpose: 'Media Fee',
  status: 'pending'
};

// Later...
payment.markAsCompleted();
payment.verify('CODE123');
```

### Applying Compliance Penalty
```javascript
// POST /compliance/penalties
const school = await School.findById('school-001');
const originalFee = school.annualFee;  // e.g., 100000

school.annualFee = originalFee * 1.20;  // Add 20% penalty
school.save();

// Result: 100000 → 120000
```

---

## 📊 API Usage Examples

### Get Schools (with fee filtering)
```bash
# All schools
curl http://localhost:3000/schools

# Schools under 50K annual fee
curl http://localhost:3000/schools?maxFee=50000

# Private schools
curl http://localhost:3000/schools?type=private

# With pagination
curl "http://localhost:3000/schools?page=2&limit=20"
```

### Create Payment
```bash
curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "school-001",
    "amount": 5000,
    "purpose": "Annual Fee",
    "paymentMethod": "Bank Transfer"
  }'
```

### Get Dashboard Data
```bash
curl http://localhost:3000/admin/dashboard \
  -H "Authorization: Bearer {token}"
```

---

## 🐛 Debugging Tips

### Check Annual Fee Values
```javascript
// In browser console:
fetch('/schools')
  .then(r => r.json())
  .then(d => d.data.forEach(s => 
    console.log(s.name, 'Annual:', s.annualFee)));
```

### Verify Payment Flow
```javascript
// 1. Create payment
POST /payments { schoolId, amount, purpose }
// Response: { id, status: 'pending' }

// 2. Verify payment
PUT /payments/{id}/verify { verificationCode }
// Response: { status: 'completed' }
```

### Test Compliance Penalty
```javascript
// Check school fee before
GET /schools/school-001  // annualFee: 100000

// Apply penalty
POST /compliance/penalties { schoolId: 'school-001', penaltyPercentage: 20 }

// Check school fee after
GET /schools/school-001  // annualFee: 120000 (20% added)
```

---

## ⚠️ Common Mistakes

### ❌ Using monthlyFee
```javascript
// DON'T DO THIS
const annual = school.monthlyFee * 12;
const fee = school.monthlyFee;

// DO THIS
const annual = school.annualFee;
const fee = school.annualFee;
```

### ❌ Dividing annualFee by 12
```javascript
// DON'T DO THIS
const monthlyFee = school.annualFee / 12;

// The annualFee is ALREADY the full annual amount
```

### ❌ Mixing old/new fee fields
```javascript
// DON'T DO THIS in database query
SELECT monthlyFee, yearlyFee FROM schools;

// DO THIS
SELECT annualFee FROM schools;
```

### ❌ Creating school without annualFee
```javascript
// DON'T DO THIS
new School({ name: 'School', grade: 'Primary' });

// DO THIS - always include annualFee
new School({ 
  name: 'School', 
  grade: 'Primary',
  annualFee: 100000  // Required
});
```

---

## 📱 Frontend Development

### Admin Dashboard Structure
```html
<!-- Main Container -->
<div class="dashboard">
  <!-- Sidebar Navigation -->
  <aside class="sidebar">
    <nav> Dashboard, Schools, Fees, Payments, Compliance...</nav>
  </aside>
  
  <!-- Main Content -->
  <main class="content">
    <!-- Metrics Cards -->
    <div class="metrics">Schools, Staff, Revenue, etc</div>
    
    <!-- Selected Section -->
    <section class="active-section">
      Fee Management, Payments, Compliance...
    </section>
  </main>
</div>
```

### Loading Data in Dashboard
```javascript
// 1. Get schools
const schools = await fetch('/schools').then(r => r.json());

// 2. Categorize by annual fee
const affordable = schools.filter(s => s.annualFee < 50000);
const moderate = schools.filter(s => s.annualFee >= 50000 && s.annualFee < 150000);
const premium = schools.filter(s => s.annualFee >= 150000);

// 3. Update UI
document.querySelector('.affordable-count').textContent = affordable.length;
```

---

## 🔒 Security Checklist

Before deploying, verify:

- [ ] All API routes require authentication (except public list)
- [ ] Passwords hashed with bcrypt (not plaintext)
- [ ] JWT tokens validated on every request
- [ ] Rate limiting enabled (100 req/hour for unauthenticated)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (input sanitization)
- [ ] HTTPS enabled in production
- [ ] Admin credentials changed from defaults
- [ ] Database backups configured
- [ ] Error messages don't expose system details

---

## 📋 Testing Checklist

Before committing code:

```bash
# 1. Run tests
npm test

# 2. Check coverage
npm test -- --coverage

# 3. Verify API endpoints work
curl http://localhost:3000/schools

# 4. Test annual fee system
curl "http://localhost:3000/schools?maxFee=100000"

# 5. Check git status
git status

# 6. Commit with message
git add .
git commit -m "feat: Description of changes"
git push origin main
```

---

## 📚 Documentation Files

| Document | For |
|----------|-----|
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | API specs & endpoints |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Test procedures |
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Production setup |
| [PROJECT_README.md](./PROJECT_README.md) | Full project overview |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design |

---

## 🆘 Need Help?

### Common Issues

**Q: "monthlyFee is undefined"**
A: Use `annualFee` instead. Monthly fees were removed in v2.0.

**Q: Payment shows pending but should be completed**
A: Call `/payments/:id/verify` endpoint with verification code.

**Q: School fee is less than penalty amount?**
A: That's valid. 20% penalty can exceed original fee if small.

**Q: API returns 401 Unauthorized**
A: Check JWT token in Authorization header: `Bearer {token}`

**Q: Can't connect to database**
A: Verify DATABASE_URL in .env file and database is running.

---

## 📞 Developer Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: dev-support@ksfp.ac.ke

---

## ✅ Final Checklist Before Deployment

- [ ] All tests passing (npm test)
- [ ] Annual fee system verified
- [ ] API documentation complete
- [ ] Security hardening applied
- [ ] Database backups configured
- [ ] Error logging enabled
- [ ] Performance tested
- [ ] All changes committed to git
- [ ] Changes pushed to GitHub
- [ ] Deployment guide followed

---

**Version**: 2.0.0  
**Status**: Production Ready  
**Last Updated**: January 28, 2026  
**Developer**: Wanoto Raphael - Meru University IT  
**Copyright**: © 2026 All Rights Reserved
