# Kenya School Fee Platform - API Documentation

**Version**: 2.0.0  
**Base URL**: `http://localhost:3000/api`  
**Authentication**: JWT Bearer Token  
**Content-Type**: `application/json`

---

## Table of Contents
1. [Authentication](#authentication)
2. [Schools API](#schools-api)
3. [Fees API](#fees-api)
4. [Payments API](#payments-api)
5. [Admin Dashboard API](#admin-dashboard-api)
6. [Performance API](#performance-api)
7. [Compliance API](#compliance-api)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## Authentication

### Login Endpoint
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@ksfp.ac.ke",
  "password": "secure_password"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "admin-001",
    "email": "admin@ksfp.ac.ke",
    "role": "admin",
    "name": "System Administrator"
  },
  "expiresIn": "24h"
}
```

### Using Token
All authenticated requests must include:
```http
Authorization: Bearer {token}
```

---

## Schools API

### List All Schools
```http
GET /schools
```

**Query Parameters**:
- `type` (string): 'primary', 'secondary', 'university'
- `grade` (string): School level
- `location` (string): Search by location
- `maxFee` (number): Maximum annual fee (KES)
- `page` (number): Pagination (default: 1)
- `limit` (number): Items per page (default: 20)

**Response (200 OK)**:
```json
{
  "success": true,
  "count": 45,
  "data": [
    {
      "id": "school-001",
      "name": "St. Mary's Academy",
      "grade": "Primary",
      "type": "private",
      "location": "Nairobi",
      "annualFee": 144000,
      "academicRating": 8.5,
      "infrastructure": 8.0,
      "facilities": 8.2,
      "sportsRating": 7.8,
      "streams": ["Coed"],
      "createdAt": "2026-01-28T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 3,
    "limit": 20
  }
}
```

### Get School Details
```http
GET /schools/:schoolId
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "school-001",
    "name": "St. Mary's Academy",
    "grade": "Primary",
    "type": "private",
    "annualFee": 144000,
    "email": "admin@stmarys.ac.ke",
    "phone": "+254722111111",
    "location": "Nairobi",
    "contactPerson": "Mr. John Muthuri",
    "website": "https://stmarys.ac.ke",
    "academicRating": 8.5,
    "infrastructure": 8.0,
    "facilities": 8.2,
    "sportsRating": 7.8,
    "streams": ["Coed"],
    "staffCount": 25,
    "studentCount": 450,
    "performanceScore": 82,
    "createdAt": "2026-01-28T10:30:00Z",
    "updatedAt": "2026-01-28T15:45:00Z"
  }
}
```

### Search Schools
```http
POST /schools/search
Content-Type: application/json

{
  "type": "private",
  "grade": "Primary",
  "maxFee": 150000,
  "location": "Nairobi",
  "minRating": 7.5
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "id": "school-001",
      "name": "St. Mary's Academy",
      "annualFee": 144000,
      "academicRating": 8.5
    }
  ]
}
```

### Create School (Admin Only)
```http
POST /schools
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "New School Academy",
  "grade": "Secondary",
  "type": "private",
  "annualFee": 120000,
  "email": "admin@newschool.ac.ke",
  "phone": "+254722999999",
  "location": "Mombasa",
  "streams": ["Coed"],
  "academicRating": 7.5,
  "infrastructure": 7.0,
  "facilities": 7.2,
  "sportsRating": 7.3
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "school-046",
    "name": "New School Academy",
    "annualFee": 120000,
    "createdAt": "2026-01-28T16:00:00Z"
  }
}
```

### Update School
```http
PUT /schools/:schoolId
Content-Type: application/json
Authorization: Bearer {token}

{
  "annualFee": 130000,
  "academicRating": 7.8,
  "infrastructure": 7.5
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "school-046",
    "name": "New School Academy",
    "annualFee": 130000,
    "updatedAt": "2026-01-28T16:15:00Z"
  }
}
```

### Delete School (Admin Only)
```http
DELETE /schools/:schoolId
Authorization: Bearer {token}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "School deleted successfully"
}
```

---

## Fees API

### Get All Fee Guidelines
```http
GET /admin/fees
Authorization: Bearer {token}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "schoolLevel": "primary",
      "schoolType": "public",
      "tuitionFee": 7500,
      "enrollmentFee": 1500,
      "developmentFee": 900,
      "activityFee": 600,
      "annualTotal": 10500,
      "affordabilityCategory": "AFFORDABLE",
      "effectiveFrom": "2026-01-01",
      "governmentSubsidy": 70
    }
  ]
}
```

### Get School Fee Details
```http
GET /admin/fees/:schoolId
Authorization: Bearer {token}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "schoolId": "school-001",
    "schoolName": "St. Mary's Academy",
    "tuitionFee": 144000,
    "enrollmentFee": 0,
    "developmentFee": 0,
    "activityFee": 0,
    "annualTotal": 144000,
    "billingPeriod": "annual",
    "affordabilityCategory": "PREMIUM",
    "isFree": false,
    "lastUpdated": "2026-01-28T10:30:00Z"
  }
}
```

### Update Fee Structure
```http
POST /admin/fees
Content-Type: application/json
Authorization: Bearer {token}

{
  "schoolLevel": "secondary",
  "schoolType": "public",
  "tuitionFee": 25500,
  "enrollmentFee": 3000,
  "developmentFee": 2400,
  "activityFee": 1500,
  "billingPeriod": "annual"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": 15,
    "schoolLevel": "secondary",
    "annualTotal": 32400,
    "createdAt": "2026-01-28T16:30:00Z"
  }
}
```

### Get Affordability Report
```http
GET /admin/fees/report/affordability
Authorization: Bearer {token}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "freeSchools": 5,
    "affordable": 12,
    "moderate": 18,
    "premium": 10,
    "averageAnnualFee": 87500,
    "distribution": {
      "0-50000": 12,
      "50000-100000": 18,
      "100000-200000": 12,
      "200000+": 3
    }
  }
}
```

---

## Payments API

### List All Payments
```http
GET /payments
Authorization: Bearer {token}

Query:
- status: 'pending', 'completed', 'failed'
- schoolId: Filter by school
- from: Start date (YYYY-MM-DD)
- to: End date (YYYY-MM-DD)
```

**Response (200 OK)**:
```json
{
  "success": true,
  "count": 125,
  "data": [
    {
      "id": "payment-001",
      "schoolId": "school-001",
      "schoolName": "St. Mary's Academy",
      "amount": 1000,
      "purpose": "Media Upload Fee",
      "paymentDate": "2026-01-20T09:30:00Z",
      "status": "completed",
      "paymentMethod": "Bank Transfer",
      "transactionId": "BT20260120001"
    }
  ]
}
```

### Get Payment Details
```http
GET /payments/:paymentId
Authorization: Bearer {token}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "payment-001",
    "schoolId": "school-001",
    "schoolName": "St. Mary's Academy",
    "amount": 1000,
    "purpose": "Media Upload Fee",
    "paymentDate": "2026-01-20T09:30:00Z",
    "status": "completed",
    "paymentMethod": "Bank Transfer",
    "transactionId": "BT20260120001",
    "verifiedDate": "2026-01-20T10:00:00Z",
    "receipt": "RCP-2026-001"
  }
}
```

### Create Payment
```http
POST /payments
Content-Type: application/json

{
  "schoolId": "school-001",
  "schoolName": "St. Mary's Academy",
  "amount": 5000,
  "purpose": "Annual Fee Payment",
  "paymentMethod": "Mobile Money",
  "reference": "REF-20260128-001"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "payment-126",
    "schoolId": "school-001",
    "amount": 5000,
    "status": "pending",
    "createdAt": "2026-01-28T16:45:00Z"
  }
}
```

### Verify Payment
```http
PUT /payments/:paymentId/verify
Content-Type: application/json
Authorization: Bearer {token}

{
  "verificationCode": "VERIFY123",
  "notes": "Payment verified successfully"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "payment-001",
    "status": "completed",
    "verifiedDate": "2026-01-28T17:00:00Z"
  }
}
```

### Get Payment Statistics
```http
GET /payments/stats/summary
Authorization: Bearer {token}

Query:
- from: Start date
- to: End date
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "totalPayments": 125,
    "totalAmount": 450000,
    "completedCount": 95,
    "completedAmount": 425000,
    "pendingCount": 25,
    "pendingAmount": 20000,
    "failedCount": 5,
    "failedAmount": 5000,
    "averageAmount": 3600,
    "successRate": 76
  }
}
```

---

## Admin Dashboard API

### Get Dashboard Overview
```http
GET /admin/dashboard
Authorization: Bearer {token}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "schools_summary": {
      "total_schools": 45,
      "primary_schools": 18,
      "secondary_schools": 20,
      "universities": 5,
      "vocational_centers": 2,
      "avg_staff_per_school": 24
    },
    "performance_stats": {
      "avg_overall_score": 78.5,
      "excellent_schools": 15,
      "good_schools": 25,
      "average_schools": 5,
      "poor_schools": 0
    },
    "revenue": {
      "total_collected": 4500000,
      "pending": 850000,
      "monthly_average": 375000
    },
    "alerts_count": 5,
    "compliance_status": {
      "compliant": 40,
      "at_risk": 4,
      "non_compliant": 1
    },
    "recent_activity": [
      {
        "description": "New school registered",
        "school_name": "Test School",
        "timestamp": "2026-01-28T15:30:00Z",
        "type": "school_registered"
      }
    ]
  }
}
```

### Get Schools for Admin
```http
GET /admin/schools
Authorization: Bearer {token}

Query:
- type: Filter by type
- status: 'active', 'inactive'
- sort: 'name', 'performance', 'revenue'
- order: 'asc', 'desc'
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "school_id": 1,
      "name": "St. Mary's Academy",
      "location": "Nairobi",
      "institution_type": "private",
      "level": "primary",
      "total_staff_count": 25,
      "overall_score": 82.5,
      "status": "active"
    }
  ]
}
```

---

## Performance API

### Get Performance Alerts
```http
GET /admin/performance/alerts
Authorization: Bearer {token}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "school_id": 12,
      "name": "School A",
      "overall_score": 45,
      "alert_reason": "Performance below expected threshold",
      "status": "active",
      "created_at": "2026-01-25T10:00:00Z"
    }
  ]
}
```

### Calculate School Performance
```http
POST /admin/performance/:schoolId/calculate
Content-Type: application/json
Authorization: Bearer {token}

{
  "academicScore": 85,
  "teacherPerformance": 80,
  "infrastructureScore": 75,
  "period": "2026-Q1"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "schoolId": 1,
    "period": "2026-Q1",
    "overallScore": 81.25,
    "components": {
      "academic": 85,
      "teacher": 80,
      "infrastructure": 75,
      "facilities": 78
    },
    "calculatedAt": "2026-01-28T17:15:00Z"
  }
}
```

---

## Compliance API

### Get Compliance Status
```http
GET /compliance/status
Authorization: Bearer {token}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "total_schools": 45,
    "compliant": 40,
    "at_risk": 4,
    "non_compliant": 1,
    "compliance_rate": 88.9,
    "violations": [
      {
        "school_id": 15,
        "schoolName": "School X",
        "violation": "Missing accreditation",
        "severity": "high",
        "penaltyApplied": true,
        "penalty": 24000
      }
    ]
  }
}
```

### Apply Penalty
```http
POST /compliance/penalties
Content-Type: application/json
Authorization: Bearer {token}

{
  "schoolId": "school-015",
  "violationType": "fake_information",
  "reason": "False fees reported",
  "penaltyPercentage": 20
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "penaltyId": "penalty-001",
    "schoolId": "school-015",
    "originalFee": 120000,
    "penaltyAmount": 24000,
    "newFee": 144000,
    "status": "enforced",
    "appliedAt": "2026-01-28T17:30:00Z"
  }
}
```

---

## Error Handling

### Standard Error Response
All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "School name is required",
    "details": {
      "field": "name",
      "validation": "required"
    }
  },
  "timestamp": "2026-01-28T17:45:00Z"
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_REQUEST` | 400 | Missing or invalid parameters |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Rate Limiting

### Limits
- **Authenticated**: 1000 requests per hour
- **Unauthenticated**: 100 requests per hour
- **Per IP**: 10,000 requests per day

### Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1643379600
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `sort` (string): Sort field
- `order` (string): 'asc' or 'desc'

**Response**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "pages": 8,
    "limit": 20
  }
}
```

---

## Notes

- All timestamps are in ISO 8601 format
- All currency amounts are in KES (Kenyan Shilling)
- Annual fees have replaced monthly fees as of v2.0
- Fee ranges are: FREE, AFFORDABLE, MODERATE, PREMIUM
- All endpoints require authentication except public school list

---

**Last Updated**: January 28, 2026  
**Version**: 2.0.0  
**Developer**: Wanoto Raphael - Meru University IT
