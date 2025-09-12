# EmailPro API Documentation

This document describes the REST API endpoints available in EmailPro.

## Authentication

All API endpoints require authentication. The application uses session-based authentication.

### Check Authentication Status
```http
GET /api/auth/me
```

Returns the current user information if authenticated.

## Campaigns

### List Campaigns
```http
GET /api/campaigns
```

Returns all campaigns for the authenticated user.

### Create Campaign
```http
POST /api/campaigns
Content-Type: application/json

{
  "name": "Campaign Name",
  "subject": "Email Subject",
  "htmlContent": "<html>...</html>",
  "textContent": "Plain text content",
  "contactListId": 1,
  "scheduledAt": "2025-08-16T10:00:00Z"
}
```

### Update Campaign
```http
PUT /api/campaigns/:id
Content-Type: application/json

{
  "name": "Updated Campaign Name",
  "subject": "Updated Subject"
}
```

### Delete Campaign
```http
DELETE /api/campaigns/:id
```

## Contact Lists

### List Contact Lists
```http
GET /api/contact-lists
```

### Create Contact List
```http
POST /api/contact-lists
Content-Type: application/json

{
  "name": "List Name",
  "description": "List Description"
}
```

### Get Contacts in List
```http
GET /api/contacts/:listId?limit=50&offset=0
```

### Import Contacts
```http
POST /api/contacts/import
Content-Type: application/json

{
  "contactListId": 1,
  "contacts": [
    {
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  ]
}
```

## Email Templates

### List Templates
```http
GET /api/email-templates
```

### Create Template
```http
POST /api/email-templates
Content-Type: application/json

{
  "name": "Template Name",
  "htmlContent": "<html>...</html>",
  "textContent": "Plain text version"
}
```

## SMTP Servers

### List SMTP Servers
```http
GET /api/smtp-servers
```

### Create SMTP Server
```http
POST /api/smtp-servers
Content-Type: application/json

{
  "name": "Server Name",
  "host": "smtp.example.com",
  "port": 587,
  "username": "user@example.com",
  "password": "password",
  "encryption": "tls",
  "dailyLimit": 1000
}
```

## Analytics

### Deliverability Analytics
```http
GET /api/analytics/deliverability/:days/:serverId
```

### Click Tracking
```http
GET /api/analytics/click-tracking/:campaignId/:days
```

### Bounce Analysis
```http
GET /api/analytics/bounce-analysis/:days
```

## PowerMTA Integration

### PowerMTA Status
```http
GET /api/pmta/status
```

### PowerMTA Queue Information
```http
GET /api/pmta/queue
```

### Send Test Email via PowerMTA
```http
POST /api/send-pmta-email
Content-Type: application/json

{
  "to": "test@example.com",
  "subject": "Test Subject",
  "html": "<h1>Test</h1>",
  "campaignType": "campaigns",
  "jobId": "test-001"
}
```

### Bulk Email Sending
```http
POST /api/send-bulk-pmta
Content-Type: application/json

{
  "recipients": [
    {"email": "user1@example.com", "name": "User 1"},
    {"email": "user2@example.com", "name": "User 2"}
  ],
  "subject": "Bulk Email Subject",
  "html": "<h1>Hello {{name}}!</h1>",
  "campaignId": "bulk-001"
}
```

## Error Responses

All endpoints return standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a JSON object with error details:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```