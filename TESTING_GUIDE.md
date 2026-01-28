# Kenya School Fee Platform - Testing & QA Guide

**Version**: 2.0.0  
**Created**: January 28, 2026  
**Last Updated**: January 28, 2026

---

## Table of Contents
1. [Unit Testing](#unit-testing)
2. [Integration Testing](#integration-testing)
3. [Performance Testing](#performance-testing)
4. [Security Testing](#security-testing)
5. [User Acceptance Testing](#user-acceptance-testing)
6. [Test Cases](#test-cases)
7. [Testing Checklist](#testing-checklist)

---

## Unit Testing

### Testing Backend Models

#### School Model Tests
```javascript
// File: tests/models/School.test.js

const School = require('../../backend/models/School');

describe('School Model', () => {
  
  describe('Constructor & Initialization', () => {
    test('should create school with annual fee', () => {
      const school = new School({
        name: 'Test School',
        grade: 'Primary',
        annualFee: 100000
      });
      
      expect(school.name).toBe('Test School');
      expect(school.annualFee).toBe(100000);
    });

    test('should validate negative annual fees', () => {
      const school = new School({
        name: 'Test School',
        annualFee: -50000
      });
      
      expect(() => school.validate()).toThrow('Annual fee cannot be negative');
    });
  });

  describe('Fee Calculations', () => {
    test('should calculate correct annual fee', () => {
      const school = new School({
        name: 'Test School',
        annualFee: 120000
      });
      
      expect(school.getAnnualFee()).toBe(120000);
    });

    test('should handle zero annual fee (free school)', () => {
      const school = new School({
        name: 'Public School',
        annualFee: 0
      });
      
      expect(school.isFreeSchool()).toBe(true);
    });
  });

  describe('Affordability Categories', () => {
    test('should categorize free school', () => {
      const school = new School({ annualFee: 0 });
      expect(school.getAffordabilityCategory()).toBe('FREE');
    });

    test('should categorize affordable school', () => {
      const school = new School({ annualFee: 40000 });
      expect(school.getAffordabilityCategory()).toBe('AFFORDABLE');
    });

    test('should categorize moderate school', () => {
      const school = new School({ annualFee: 100000 });
      expect(school.getAffordabilityCategory()).toBe('MODERATE');
    });

    test('should categorize premium school', () => {
      const school = new School({ annualFee: 250000 });
      expect(school.getAffordabilityCategory()).toBe('PREMIUM');
    });
  });

  describe('School Rating', () => {
    test('should validate rating range (0-10)', () => {
      const school = new School({
        name: 'Test School',
        academicRating: 11
      });
      
      expect(() => school.validate()).toThrow('Rating must be between 0 and 10');
    });

    test('should calculate overall performance score', () => {
      const school = new School({
        name: 'Test School',
        academicRating: 8.5,
        infrastructure: 8.0,
        facilities: 8.2,
        sportsRating: 7.8
      });
      
      const avgScore = school.calculateOverallScore();
      expect(avgScore).toBeCloseTo(8.125, 2);
    });
  });
});
```

#### Payment Model Tests
```javascript
// File: tests/models/Payment.test.js

const Payment = require('../../backend/models/Payment');

describe('Payment Model', () => {
  
  describe('Payment Creation', () => {
    test('should create valid payment', () => {
      const payment = new Payment({
        schoolId: 'school-001',
        amount: 5000,
        purpose: 'Annual Fee',
        status: 'pending'
      });
      
      expect(payment.schoolId).toBe('school-001');
      expect(payment.amount).toBe(5000);
      expect(payment.status).toBe('pending');
    });

    test('should reject negative amount', () => {
      const payment = new Payment({
        amount: -1000
      });
      
      expect(() => payment.validate()).toThrow('Amount must be positive');
    });
  });

  describe('Payment Status', () => {
    test('should transition from pending to completed', () => {
      const payment = new Payment({ status: 'pending' });
      payment.markAsCompleted();
      
      expect(payment.status).toBe('completed');
      expect(payment.completedDate).toBeDefined();
    });

    test('should not allow invalid status transitions', () => {
      const payment = new Payment({ status: 'completed' });
      
      expect(() => {
        payment.markAsCompleted(); // Already completed
      }).toThrow('Invalid status transition');
    });
  });

  describe('Payment Verification', () => {
    test('should verify payment with correct code', () => {
      const payment = new Payment({
        verificationCode: 'VERIFY123'
      });
      
      expect(payment.verify('VERIFY123')).toBe(true);
    });

    test('should reject incorrect verification code', () => {
      const payment = new Payment({
        verificationCode: 'VERIFY123'
      });
      
      expect(payment.verify('WRONG_CODE')).toBe(false);
    });
  });
});
```

### Running Unit Tests
```bash
# Install testing dependencies
npm install --save-dev jest @babel/preset-env

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/models/School.test.js

# Watch mode
npm test -- --watch
```

---

## Integration Testing

### API Endpoint Tests

#### Schools API Integration Tests
```javascript
// File: tests/integration/schools.test.js

const request = require('supertest');
const app = require('../../backend/app');
const db = require('../../backend/database/db');

describe('Schools API Integration', () => {
  
  let authToken;
  const testSchool = {
    name: 'Integration Test School',
    grade: 'Secondary',
    type: 'private',
    annualFee: 150000,
    location: 'Nairobi'
  };

  beforeAll(async () => {
    // Authenticate before running tests
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@ksfp.ac.ke',
        password: 'test_password'
      });
    authToken = res.body.token;
  });

  describe('GET /schools', () => {
    test('should list all schools', async () => {
      const res = await request(app)
        .get('/schools')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
    });

    test('should filter schools by annual fee', async () => {
      const res = await request(app)
        .get('/schools?maxFee=50000')
        .expect(200);
      
      res.body.data.forEach(school => {
        expect(school.annualFee).toBeLessThanOrEqual(50000);
      });
    });

    test('should filter schools by type', async () => {
      const res = await request(app)
        .get('/schools?type=private')
        .expect(200);
      
      res.body.data.forEach(school => {
        expect(school.type).toBe('private');
      });
    });

    test('should handle pagination', async () => {
      const res = await request(app)
        .get('/schools?page=1&limit=10')
        .expect(200);
      
      expect(res.body.pagination.limit).toBe(10);
      expect(res.body.pagination.page).toBe(1);
    });
  });

  describe('GET /schools/:schoolId', () => {
    test('should retrieve school details', async () => {
      const res = await request(app)
        .get('/schools/school-001')
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('school-001');
      expect(res.body.data.annualFee).toBeDefined();
    });

    test('should return 404 for non-existent school', async () => {
      const res = await request(app)
        .get('/schools/non-existent')
        .expect(404);
      
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /schools (Create)', () => {
    test('should create new school with valid data', async () => {
      const res = await request(app)
        .post('/schools')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testSchool)
        .expect(201);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testSchool.name);
      expect(res.body.data.annualFee).toBe(testSchool.annualFee);
    });

    test('should validate required fields', async () => {
      const res = await request(app)
        .post('/schools')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          grade: 'Secondary'
          // Missing 'name' field
        })
        .expect(400);
      
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('required');
    });

    test('should reject invalid annual fee', async () => {
      const res = await request(app)
        .post('/schools')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testSchool,
          annualFee: -50000
        })
        .expect(400);
      
      expect(res.body.success).toBe(false);
    });

    test('should require authentication', async () => {
      const res = await request(app)
        .post('/schools')
        .send(testSchool)
        .expect(401);
      
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /schools/:schoolId (Update)', () => {
    test('should update school with valid data', async () => {
      const res = await request(app)
        .put('/schools/school-001')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          annualFee: 160000,
          academicRating: 8.7
        })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.annualFee).toBe(160000);
    });

    test('should partially update school', async () => {
      const res = await request(app)
        .put('/schools/school-001')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          academicRating: 8.2
        })
        .expect(200);
      
      expect(res.body.data.academicRating).toBe(8.2);
    });
  });

  describe('DELETE /schools/:schoolId', () => {
    test('should delete school', async () => {
      const res = await request(app)
        .delete('/schools/school-046')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
    });

    test('should return 404 if school not found', async () => {
      const res = await request(app)
        .delete('/schools/non-existent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      expect(res.body.success).toBe(false);
    });
  });

  afterAll(async () => {
    await db.close();
  });
});
```

#### Fees API Integration Tests
```javascript
// File: tests/integration/fees.test.js

describe('Fees API Integration', () => {
  
  let authToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@ksfp.ac.ke',
        password: 'admin_password'
      });
    authToken = res.body.token;
  });

  describe('GET /admin/fees', () => {
    test('should retrieve all fee guidelines', async () => {
      const res = await request(app)
        .get('/admin/fees')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('annualTotal');
    });
  });

  describe('GET /admin/fees/report/affordability', () => {
    test('should generate affordability report', async () => {
      const res = await request(app)
        .get('/admin/fees/report/affordability')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('freeSchools');
      expect(res.body.data).toHaveProperty('affordable');
      expect(res.body.data).toHaveProperty('moderate');
      expect(res.body.data).toHaveProperty('premium');
    });
  });

  describe('POST /admin/fees (Create Fee Structure)', () => {
    test('should create new fee structure', async () => {
      const res = await request(app)
        .post('/admin/fees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          schoolLevel: 'primary',
          schoolType: 'private',
          tuitionFee: 80000,
          enrollmentFee: 5000,
          developmentFee: 10000,
          activityFee: 5000,
          billingPeriod: 'annual'
        })
        .expect(201);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.annualTotal).toBe(100000);
    });
  });
});
```

#### Payments API Integration Tests
```javascript
// File: tests/integration/payments.test.js

describe('Payments API Integration', () => {
  
  let authToken;
  let testPaymentId;

  beforeAll(async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@ksfp.ac.ke',
        password: 'admin_password'
      });
    authToken = res.body.token;
  });

  describe('POST /payments (Create Payment)', () => {
    test('should create payment', async () => {
      const res = await request(app)
        .post('/payments')
        .send({
          schoolId: 'school-001',
          amount: 15000,
          purpose: 'Media Upload Fee',
          paymentMethod: 'Bank Transfer'
        })
        .expect(201);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
      testPaymentId = res.body.data.id;
    });

    test('should validate amount is positive', async () => {
      const res = await request(app)
        .post('/payments')
        .send({
          schoolId: 'school-001',
          amount: -5000,
          purpose: 'Media Upload Fee'
        })
        .expect(400);
      
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /payments', () => {
    test('should list all payments', async () => {
      const res = await request(app)
        .get('/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('should filter by status', async () => {
      const res = await request(app)
        .get('/payments?status=completed')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      res.body.data.forEach(payment => {
        expect(payment.status).toBe('completed');
      });
    });
  });

  describe('GET /payments/:paymentId', () => {
    test('should retrieve payment details', async () => {
      const res = await request(app)
        .get(`/payments/${testPaymentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testPaymentId);
    });
  });

  describe('PUT /payments/:paymentId/verify', () => {
    test('should verify payment', async () => {
      const res = await request(app)
        .put(`/payments/${testPaymentId}/verify`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          verificationCode: 'VERIFY123'
        })
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('completed');
    });
  });

  describe('GET /payments/stats/summary', () => {
    test('should get payment statistics', async () => {
      const res = await request(app)
        .get('/payments/stats/summary')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalPayments');
      expect(res.body.data).toHaveProperty('totalAmount');
      expect(res.body.data).toHaveProperty('successRate');
    });
  });
});
```

---

## Performance Testing

### Load Testing Script
```javascript
// File: tests/performance/load-test.js

const autocannon = require('autocannon');

const testConfigs = {
  listSchools: {
    url: 'http://localhost:3000/schools',
    connections: 100,
    duration: 30,
    pipelining: 10
  },
  createPayment: {
    url: 'http://localhost:3000/payments',
    method: 'POST',
    body: JSON.stringify({
      schoolId: 'school-001',
      amount: 5000,
      purpose: 'Fee Payment'
    }),
    connections: 50,
    duration: 30
  }
};

async function runLoadTests() {
  console.log('Starting Performance Tests...\n');

  for (const [testName, config] of Object.entries(testConfigs)) {
    console.log(`Running: ${testName}`);
    const result = await autocannon(config);
    
    console.log(`\nResults for ${testName}:`);
    console.log(`Throughput: ${result.throughput.sum} req/s`);
    console.log(`Latency (avg): ${result.latency.mean}ms`);
    console.log(`Latency (p99): ${result.latency.p99}ms`);
    console.log(`Errors: ${result.errors}`);
    console.log('---\n');

    // Check performance thresholds
    if (result.latency.mean > 500) {
      console.warn(`⚠️ Warning: ${testName} latency exceeds 500ms`);
    }
  }
}

runLoadTests();
```

### Running Performance Tests
```bash
# Install autocannon
npm install --save-dev autocannon

# Run load tests
node tests/performance/load-test.js

# Memory profiling
node --prof tests/performance/load-test.js
```

### Performance Benchmarks

**Target Performance Metrics:**
- API Response Time: < 200ms (p95)
- Dashboard Load Time: < 2 seconds
- Search Query: < 100ms
- Payment Processing: < 500ms
- Throughput: > 100 requests/second

---

## Security Testing

### OWASP Top 10 Validation

```javascript
// File: tests/security/owasp.test.js

describe('Security Tests - OWASP Top 10', () => {
  
  describe('A01: Injection', () => {
    test('should prevent SQL injection', async () => {
      const res = await request(app)
        .get('/schools?type=private" OR "1"="1')
        .expect(400);
      
      expect(res.body.success).toBe(false);
    });

    test('should sanitize XSS attempts', async () => {
      const res = await request(app)
        .post('/schools')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '<script>alert("XSS")</script>',
          grade: 'Primary'
        })
        .expect(400);
      
      expect(res.body.success).toBe(false);
    });
  });

  describe('A02: Broken Authentication', () => {
    test('should require authentication for protected endpoints', async () => {
      const res = await request(app)
        .post('/schools')
        .send({ name: 'Test' })
        .expect(401);
      
      expect(res.body.success).toBe(false);
    });

    test('should validate token expiration', async () => {
      const expiredToken = jwt.sign({ id: 1 }, 'secret', { expiresIn: '-1h' });
      
      const res = await request(app)
        .get('/schools')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      
      expect(res.body.success).toBe(false);
    });
  });

  describe('A03: Broken Access Control', () => {
    test('should prevent unauthorized fee modifications', async () => {
      const userToken = generateUserToken(); // Non-admin user
      
      const res = await request(app)
        .post('/admin/fees')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          schoolLevel: 'primary',
          tuitionFee: 100000
        })
        .expect(403);
      
      expect(res.body.success).toBe(false);
    });
  });

  describe('A05: Security Misconfiguration', () => {
    test('should not expose sensitive headers', async () => {
      const res = await request(app).get('/schools');
      
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['server']).not.toContain('Express');
    });

    test('should enforce HTTPS redirects', async () => {
      const res = await request(app)
        .get('/schools')
        .expect(200);
      
      expect(res.headers['strict-transport-security']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    test('should enforce rate limits', async () => {
      let res;
      
      // Make 101 requests (limit is 100)
      for (let i = 0; i < 101; i++) {
        res = await request(app).get('/schools');
      }
      
      expect(res.status).toBe(429);
      expect(res.body.error).toContain('Too many requests');
    });
  });
});
```

---

## User Acceptance Testing

### UAT Checklist

| Feature | Test Case | Expected Result | Status |
|---------|-----------|-----------------|--------|
| School Search | Filter by annual fee | Shows schools within fee range | ☐ |
| School Search | Sort by rating | Schools sorted by academic rating | ☐ |
| School Profile | View details | All school info displayed correctly | ☐ |
| School Management | Create school | New school added with annual fee | ☐ |
| School Management | Edit school | Annual fee updates reflected | ☐ |
| School Management | Delete school | School removed from system | ☐ |
| Fee Management | View fee guidelines | All fee structures displayed | ☐ |
| Fee Management | Create fee rule | New rule saved successfully | ☐ |
| Fee Management | Generate report | Affordability report shows correct data | ☐ |
| Payment | Create payment | Payment created with pending status | ☐ |
| Payment | Verify payment | Status changes to completed | ☐ |
| Payment | View statistics | Summary shows correct totals | ☐ |
| Compliance | View violations | List of non-compliant schools shown | ☐ |
| Compliance | Apply penalty | Penalty calculated and applied | ☐ |
| Admin Dashboard | Load overview | All metrics displayed | ☐ |
| Admin Dashboard | Responsive design | Works on desktop/tablet/mobile | ☐ |
| Authentication | Login | User logged in successfully | ☐ |
| Authentication | Logout | Session cleared | ☐ |
| Error Handling | Invalid input | Appropriate error message shown | ☐ |
| Performance | Dashboard load | Loads within 2 seconds | ☐ |

---

## Test Cases

### Critical Test Cases

**TC-001: Annual Fee Conversion**
- **Objective**: Verify monthly fee system converted to annual
- **Precondition**: Database migrated
- **Steps**:
  1. Create school with 50,000 annual fee
  2. Query school data
  3. Verify annualFee field contains correct value
- **Expected**: annualFee = 50,000 (not 50,000/12)

**TC-002: Fee Affordability Categorization**
- **Objective**: Verify schools categorized by affordability
- **Steps**:
  1. Create schools with fees: 0, 40000, 100000, 250000
  2. Call affordability report
- **Expected**: FREE, AFFORDABLE, MODERATE, PREMIUM

**TC-003: Penalty Calculation**
- **Objective**: Verify 20% penalty applied to annual fee
- **Steps**:
  1. Create school with 100,000 annual fee
  2. Apply 20% penalty
  3. Check updated fee
- **Expected**: New fee = 120,000

**TC-004: Payment Processing**
- **Objective**: Verify payment flow from creation to verification
- **Steps**:
  1. Create payment (status: pending)
  2. Verify with code
  3. Check status
- **Expected**: Status changes to completed

**TC-005: Dashboard Performance**
- **Objective**: Verify dashboard loads within acceptable time
- **Steps**:
  1. Load admin dashboard
  2. Measure load time
  3. Load with 1000+ records
- **Expected**: < 2 seconds

---

## Testing Checklist

### Pre-Deployment Testing

- [ ] All unit tests passing (npm test)
- [ ] All integration tests passing
- [ ] Performance tests show acceptable metrics
- [ ] Security tests validate OWASP compliance
- [ ] Database migrations applied successfully
- [ ] Annual fee system verified across all endpoints
- [ ] Affordability categorization working correctly
- [ ] Payment processing verified
- [ ] Admin dashboard responsive on all devices
- [ ] Error handling returns appropriate messages
- [ ] Rate limiting enforced
- [ ] HTTPS/SSL certificates valid
- [ ] Authentication and authorization working
- [ ] API documentation complete and accurate
- [ ] User acceptance testing completed
- [ ] Performance load testing passed
- [ ] Security penetration testing completed
- [ ] Database backup verified
- [ ] Rollback procedures documented
- [ ] Production environment variables configured

### Regression Testing Checklist

- [ ] All existing features still working
- [ ] No breaking changes to API
- [ ] Database backward compatibility verified
- [ ] Previous payment records accessible
- [ ] School data integrity maintained
- [ ] User permissions unchanged
- [ ] Authentication flows working

---

## Running Tests

```bash
# Install all testing dependencies
npm install --save-dev jest supertest autocannon

# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test suite
npm test -- tests/integration/schools.test.js

# Run with verbose output
npm test -- --verbose

# Watch mode for development
npm test -- --watch

# Generate coverage HTML
npm test -- --coverage --coverageReporters=html
```

---

**Version**: 2.0.0  
**Last Updated**: January 28, 2026  
**Developer**: Wanoto Raphael - Meru University IT  
**Status**: Ready for Implementation
