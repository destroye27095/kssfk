# Kenya School Fee Platform (KSSFK)

## Project Overview

The Kenya School Fee Platform (KSSFK) is a comprehensive web application designed to help parents find and compare schools based on fees, quality, streams, and other factors. The platform also provides tools for school administrators to manage school information, handle uploads, post vacancies and job openings, and process payments.

## Features

### For Parents
- **School Search & Comparison**: Filter schools by level, type, stream, and fee range
- **Scoring Engine**: Schools ranked by academic performance, infrastructure, and facilities
- **Enrollment Management**: Submit enrollment requests directly through the platform
- **Analytics Dashboard**: View fee trends, popular schools, and parent preferences
- **Fee Trends Analysis**: Compare fees across different school types and levels

### For Schools
- **School Dashboard**: Manage school information and settings
- **Media Upload**: Upload school images, videos, and documents (1000 KES fee)
- **Vacancy Management**: Post and manage student vacancies with auto-close feature
- **Job Postings**: Advertise teaching and non-teaching positions
- **Academic Results**: Upload yearly exam results
- **Fee Management**: Update and manage school fee structure

### For Admins
- **Upload Approval**: Review and approve/reject school uploads
- **Compliance Enforcement**: Apply 20% penalties for false information
- **Payment Management**: Track and verify school payments
- **Penalty Tracking**: Monitor fake information penalties
- **Analytics Dashboard**: View platform-wide statistics and trends
- **Dispute Management**: Handle parent complaints and compensation

## Architecture

### Frontend
- **HTML/CSS/JavaScript**: Responsive user interface
- **Filter Engine**: Client-side filtering and sorting
- **Analytics Charts**: Data visualization using Chart.js

### Backend
- **Node.js/Express**: RESTful API server
- **ACID Compliance**: Transaction-safe database operations
- **Authentication**: JWT-based admin authentication
- **Logging**: Automatic audit trail creation

### Data Storage
- **JSON Files**: Default file-based storage
- **PostgreSQL**: Optional for production
- **MySQL**: Alternative relational database

## Project Structure

```
KSSFK/
├── index.html                   # Parent portal
├── admin.html                   # Admin panel
├── school-dashboard.html        # School dashboard
│
├── assets/
│   ├── images/                 # School images
│   ├── videos/                 # School videos
│   ├── icons/                  # UI icons
│   └── charts/                 # Chart templates
│
├── css/
│   ├── styles.css              # Parent UI styles
│   ├── admin.css               # Admin panel styles
│   └── school-dashboard.css    # School dashboard styles
│
├── js/
│   ├── script.js               # Parent portal logic
│   ├── admin.js                # Admin panel logic
│   ├── dashboard.js            # School dashboard logic
│   ├── charts.js               # Analytics charts
│   └── utils.js                # Utility functions
│
├── data/
│   ├── schools.json            # School information
│   ├── uploads.json            # Media uploads
│   ├── payments.json           # Payment records
│   ├── vacancies.json          # Student vacancies
│   ├── analytics.json          # Analytics data
│   └── logs/                   # Audit logs
│
├── components/
│   ├── header.html
│   ├── footer.html
│   ├── school-row.html
│   ├── filter-form.html
│   ├── upload-form.html
│   ├── media-card.html
│   └── vacancy-card.html
│
├── backend/
│   ├── app.js                  # Express server
│   ├── package.json            # Dependencies
│   │
│   ├── routes/
│   │   ├── schools.js          # School CRUD
│   │   ├── admin.js            # Admin operations
│   │   ├── payments.js         # Payment handling
│   │   ├── uploads.js          # Upload management
│   │   ├── vacancies.js        # Vacancy handling
│   │   ├── jobs.js             # Job postings
│   │   └── penalties.js        # Penalty enforcement
│   │
│   ├── models/
│   │   ├── School.js
│   │   ├── Payment.js
│   │   ├── Upload.js
│   │   ├── Vacancy.js
│   │   ├── Job.js
│   │   └── Logs.js
│   │
│   ├── middleware/
│   │   ├── auth.js             # Authentication
│   │   ├── logMiddleware.js    # Request logging
│   │   └── errorHandler.js     # Error handling
│   │
│   ├── compliance/
│   │   ├── terms.js            # Terms enforcement
│   │   ├── penalties.js        # Penalty application
│   │   └── disputes.js         # Dispute handling
│   │
│   └── database/
│       └── db.js               # Database abstraction
│
└── README.md                   # This file
```

## Key Features Implementation

### Filter Engine
```javascript
filterSchools(schools, {
    grade: 'Primary',
    stream: 'Coed',
    maxFee: 15000
})
```

### Scoring Engine
- Academic Rating: 35%
- Infrastructure: 20%
- Facilities: 20%
- Sports Rating: 15%
- Vacancy Rate: 10%

### Private Fee Logic
- Private schools can have fees doubled based on conditions
- Automatically applied during filtering

### Penalty System
- **Fake Information Detection**: Automatic flag suspicious school data
- **20% Penalty Enforcement**: Penalty = monthly_fee × 0.20
- **Cumulative Tracking**: Track penalties per school

### Vacancy Management
- Auto-close when capacity reached
- Real-time seat availability tracking
- Enrollment management

## Installation & Setup

### Frontend Only
1. Clone the repository
2. Open `index.html` in a web browser

### Full Stack Setup

1. **Install Node.js and npm**
   ```bash
   # Download from https://nodejs.org/
   ```

2. **Navigate to backend directory**
   ```bash
   cd backend
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Create .env file**
   ```
   PORT=5000
   NODE_ENV=development
   DB_TYPE=json
   JWT_SECRET=your-secret-key
   ```

5. **Start the server**
   ```bash
   npm start
   # Or for development with auto-reload
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:5000
   ```

## API Endpoints

### Schools
- `GET /api/schools` - Get all schools
- `GET /api/schools/:id` - Get school details
- `POST /api/schools` - Create school
- `PUT /api/schools/:id` - Update school
- `DELETE /api/schools/:id` - Delete school
- `POST /api/schools/search` - Search/filter schools

### Uploads
- `GET /api/uploads` - Get all uploads
- `POST /api/uploads` - Submit upload
- `GET /api/uploads/school/:schoolId` - Get school uploads

### Payments
- `GET /api/payments` - Get all payments
- `POST /api/payments` - Create payment
- `PUT /api/payments/:id/verify` - Verify payment

### Vacancies
- `GET /api/vacancies` - Get all vacancies
- `GET /api/vacancies/open` - Get open vacancies
- `POST /api/vacancies` - Create vacancy
- `PUT /api/vacancies/:id/enroll` - Enroll student

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `PUT /api/admin/uploads/:id/approve` - Approve upload
- `PUT /api/admin/uploads/:id/reject` - Reject upload
- `PUT /api/admin/penalties/:id/enforce` - Enforce penalty

## Compliance & Terms

### Upload Requirements
- ✓ Terms of Service acceptance mandatory
- ✓ Payment verification (KES 1,000) required
- ✓ Content authenticity verification
- ✓ Admin approval before publication

### Penalty System
- Fake information detection with 20% fee penalty
- Automatic enforcement by admin
- Cumulative penalty tracking
- Victim compensation mechanism

### Logging & Audit
- Automatic logging of all uploads
- Payment transaction tracking
- Parent action logging
- Fake info detection logs
- Penalty enforcement logs

## User Roles

### Parent
- Search and filter schools
- View school details and media
- Submit enrollment requests
- View analytics and fee trends

### School Administrator
- Manage school information
- Upload media, results, and documents
- Post and manage vacancies
- Post job openings
- View analytics

### Platform Admin
- Approve/reject uploads
- Verify payments
- Apply penalties for fake information
- Review disputes and complaints
- View platform analytics

## Database Schema

### Schools Table
```json
{
  "id": "school-001",
  "name": "School Name",
  "grade": "Primary",
  "type": "private",
  "streams": ["Coed"],
  "monthlyFee": 10000,
  "yearlyFee": 120000,
  "academicRating": 8.5,
  "infrastructure": 8.0,
  "facilities": 8.2,
  "sportsRating": 7.8,
  "vacancyRate": 35
}
```

### Payments Table
```json
{
  "id": "payment-001",
  "schoolId": "school-001",
  "amount": 1000,
  "paymentDate": "2025-01-20T10:00:00Z",
  "status": "completed",
  "purpose": "Media upload fee"
}
```

### Uploads Table
```json
{
  "id": "upload-001",
  "schoolId": "school-001",
  "title": "Campus Photos",
  "type": "Images",
  "status": "approved",
  "termsAccepted": true,
  "paymentVerified": true
}
```

## Security Considerations

1. **Authentication**: JWT-based admin authentication
2. **Input Validation**: All inputs validated before processing
3. **ACID Compliance**: Transaction-safe database operations
4. **Logging**: All actions logged for audit trail
5. **Error Handling**: Safe error messages without exposing internals

## Future Enhancements

- [ ] User registration and authentication
- [ ] Payment gateway integration (M-Pesa, bank transfers)
- [ ] Email notifications for parents and schools
- [ ] Advanced analytics and reporting
- [ ] Mobile app (React Native)
- [ ] Machine learning for school recommendations
- [ ] Video conferencing for virtual tours
- [ ] Integration with KCSE results database

## Developer Information

**Author**: Wamoto Raphael  
**Institution**: Meru University  
**Role**: IT Student / Developer  
**Phone**: 0768331888  
**Email**: wamotoraphael327@gmail.com  

## License

This project is licensed under the MIT License.

## Support

For issues, feature requests, or questions, please contact:
- Email: wamotoraphael327@gmail.com
- Phone: 0768331888

---

**Last Updated**: January 27, 2025  
**Version**: 1.0.0
