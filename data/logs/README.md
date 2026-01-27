# KSSFK Log Files

## Log File Types

This directory contains audit logs for the platform:

- **uploads.log** - All upload-related activities
  - Upload submissions
  - Admin approvals/rejections
  - Upload status changes

- **payments.log** - Payment transaction logs
  - Payment submissions
  - Payment verifications
  - Payment status updates

- **parent_actions.log** - Parent portal activities
  - School searches
  - Filter applications
  - Enrollment submissions
  - Analytics views

- **admin_actions.log** - Admin panel activities
  - Upload approvals
  - Penalty applications
  - System configurations
  - School management

- **misinformation.log** - Fake information detection
  - Suspicious data flagged
  - Detection timestamps
  - School identities
  - Recommended actions

- **penalties.log** - Penalty enforcement logs
  - Applied penalties
  - Enforcement dates
  - Penalty amounts
  - Affected schools

## Log Format

Each log entry is a JSON object containing:
```json
{
  "timestamp": "2025-01-20T10:30:00Z",
  "type": "log_type",
  "action": "action_performed",
  "details": {},
  "status": "success|failure"
}
```

## Retention Policy

- Logs are kept for compliance and audit purposes
- Logs are automatically archived monthly
- Critical logs retained for 1 year
- General logs retained for 6 months

## Access

Only platform administrators can view these logs.
All log access is itself logged.
