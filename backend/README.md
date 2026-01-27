# Kenya School Fee Platform - Backend

This is the backend server for the Kenya School Fee Platform.

## Quick Start

```bash
# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Start development server
npm run dev

# Start production server
npm start
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Update configuration values as needed
3. For production, ensure all sensitive values are properly set

## Available Routes

### Schools (`/api/schools`)
- GET `/api/schools` - List all schools
- GET `/api/schools/:id` - Get school details
- POST `/api/schools` - Create new school
- PUT `/api/schools/:id` - Update school
- DELETE `/api/schools/:id` - Delete school

### Uploads (`/api/uploads`)
- GET `/api/uploads` - List all uploads
- POST `/api/uploads` - Submit new upload
- GET `/api/uploads/school/:schoolId` - Get school uploads

### Payments (`/api/payments`)
- GET `/api/payments` - List all payments
- POST `/api/payments` - Create payment record
- PUT `/api/payments/:id/verify` - Verify payment

### Vacancies (`/api/vacancies`)
- GET `/api/vacancies` - List all vacancies
- GET `/api/vacancies/open` - List open vacancies
- POST `/api/vacancies` - Create vacancy
- PUT `/api/vacancies/:id/enroll` - Enroll student

### Admin (`/api/admin`)
- GET `/api/admin/stats` - Get dashboard stats
- PUT `/api/admin/uploads/:id/approve` - Approve upload
- PUT `/api/admin/uploads/:id/reject` - Reject upload

## Database

Default uses JSON file storage. For production, configure PostgreSQL or MySQL in `.env`

## Logging

All requests are automatically logged to `data/logs/` directory:
- `general.log` - General requests
- `uploads.log` - Upload-related requests
- `payments.log` - Payment-related requests
- `admin.log` - Admin operations

## Development

- Use `npm run dev` for auto-reload with nodemon
- Server runs on port 5000 by default
- Check `http://localhost:5000/health` for server status

## Production

- Set `NODE_ENV=production` in `.env`
- Use a production-grade database (PostgreSQL recommended)
- Implement SSL/TLS encryption
- Set strong JWT secret
- Enable CORS selectively
