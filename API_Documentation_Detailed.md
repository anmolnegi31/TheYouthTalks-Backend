# The Youth Talks API Documentation

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [Survey Form Endpoints](#survey-form-endpoints)
3. [Survey Response Endpoints](#survey-response-endpoints)
4. [Category Endpoints](#category-endpoints)
5. [System Endpoints](#system-endpoints)
6. [Request Body Schemas](#request-body-schemas)
7. [Error Response Formats](#error-response-formats)
8. [Enumerations and Constants](#enumerations-and-constants)

---

## Authentication Endpoints

| Endpoint | Method | Type | Description | Headers | Request Body | Expected Response | Status Codes |
|----------|---------|------|-------------|---------|--------------|-------------------|--------------|
| `/api/users/register` | POST | Public | Register new user | `Content-Type: application/json` | `{"name": "string", "email": "string", "password": "string"}` | `{"success": true, "message": "User registered successfully", "user": {...}, "token": "string"}` | 201, 400, 500 |
| `/api/users/register-brand` | POST | Public | Register brand account | `Content-Type: application/json` | `{"name": "string", "email": "string", "password": "string", "brandDetails": {...}}` | `{"success": true, "message": "Brand registered successfully", "user": {...}, "token": "string"}` | 201, 400, 500 |
| `/api/users/login` | POST | Public | User login | `Content-Type: application/json` | `{"email": "string", "password": "string"}` | `{"success": true, "message": "Login successful", "user": {...}, "token": "string"}` | 200, 400, 401, 500 |
| `/api/users/logout` | POST | Private | User logout | `Authorization: Bearer <token>` | None | `{"success": true, "message": "Logged out successfully"}` | 200, 401, 500 |
| `/api/users/logout-all` | POST | Private | Logout from all devices | `Authorization: Bearer <token>` | None | `{"success": true, "message": "Logged out from all devices successfully"}` | 200, 401, 500 |
| `/api/users/profile` | GET | Private | Get user profile | `Authorization: Bearer <token>` | None | `{"success": true, "user": {...}}` | 200, 401, 500 |
| `/api/users/brand-profile` | GET | Private (Brand) | Get brand profile | `Authorization: Bearer <brand-token>` | None | `{"success": true, "brand": {...}}` | 200, 401, 403, 500 |
| `/api/users/brand-profile` | PUT | Private (Brand) | Update brand profile | `Authorization: Bearer <brand-token>`, `Content-Type: application/json` | `{"name": "string", "preferences": {...}, "brandDetails": {...}}` | `{"success": true, "message": "Brand profile updated successfully"}` | 200, 400, 401, 403, 500 |
| `/api/users/change-password` | PUT | Private | Change password | `Authorization: Bearer <token>`, `Content-Type: application/json` | `{"currentPassword": "string", "newPassword": "string"}` | `{"success": true, "message": "Password changed successfully"}` | 200, 400, 401, 404, 500 |

---

## Survey Form Endpoints

| Endpoint | Method | Type | Description | Headers | Request Body | Query Parameters | Expected Response | Status Codes |
|----------|---------|------|-------------|---------|--------------|------------------|-------------------|--------------|
| `/api/forms` | GET | Public/Optional Auth | Get all forms | `Authorization: Bearer <token>` (optional) | None | `status, category, author, limit, page, myForms` | `{"success": true, "data": [...], "pagination": {...}}` | 200, 500 |
| `/api/forms/:id` | GET | Public/Optional Auth | Get single form | `Authorization: Bearer <token>` (optional) | None | None | `{"success": true, "data": {...}, "permissions": {...}}` | 200, 403, 404, 500 |
| `/api/forms` | POST | Private (Brand) | Create new form | `Authorization: Bearer <brand-token>`, `Content-Type: application/json` | Form creation schema (see below) | None | `{"success": true, "message": "Form created successfully", "data": {...}}` | 201, 400, 401, 403, 500 |
| `/api/forms/:id` | PUT | Private (Brand) | Update form | `Authorization: Bearer <brand-token>`, `Content-Type: application/json` | Form update schema | None | `{"success": true, "message": "Form updated successfully", "data": {...}}` | 200, 400, 401, 403, 404, 500 |
| `/api/forms/:id` | DELETE | Private (Brand) | Delete form | `Authorization: Bearer <brand-token>` | None | None | `{"success": true, "message": "Form deleted successfully"}` | 200, 401, 403, 404, 500 |
| `/api/forms/brand-forms` | GET | Private (Brand) | Get brand's forms | `Authorization: Bearer <brand-token>` | None | `limit, page` | `{"success": true, "data": [...], "count": number}` | 200, 401, 403, 500 |
| `/api/forms/status/:status` | GET | Public/Optional Auth | Get forms by status | `Authorization: Bearer <token>` (optional) | None | `limit, page, myForms` | `{"success": true, "data": [...], "pagination": {...}}` | 200, 500 |
| `/api/forms/:id/stats` | GET | Private (Brand) | Get form statistics | `Authorization: Bearer <brand-token>` | None | None | `{"success": true, "data": {"form": {...}, "analytics": {...}}}` | 200, 401, 403, 404, 500 |
| `/api/forms/:id/status` | PATCH | Private (Brand) | Change form status | `Authorization: Bearer <brand-token>`, `Content-Type: application/json` | `{"status": "draft|published|scheduled|closed"}` | None | `{"success": true, "message": "Form status changed", "data": {...}}` | 200, 400, 401, 403, 404, 500 |
| `/api/forms/:id/publish` | PATCH | Private (Brand) | Publish form | `Authorization: Bearer <brand-token>` | None | None | `{"success": true, "message": "Form published successfully", "data": {...}}` | 200, 400, 401, 403, 404, 500 |
| `/api/forms/:id/unpublish` | PATCH | Private (Brand) | Unpublish form | `Authorization: Bearer <brand-token>` | None | None | `{"success": true, "message": "Form unpublished successfully", "data": {...}}` | 200, 401, 403, 404, 500 |
| `/api/forms/:id/close` | PATCH | Private (Brand) | Close form | `Authorization: Bearer <brand-token>` | None | None | `{"success": true, "message": "Form closed successfully", "data": {...}}` | 200, 401, 403, 404, 500 |

---

## Survey Response Endpoints

| Endpoint | Method | Type | Description | Headers | Request Body | Query Parameters | Expected Response | Status Codes |
|----------|---------|------|-------------|---------|--------------|------------------|-------------------|--------------|
| `/api/responses` | POST | Public/Optional Auth | Submit response | `Authorization: Bearer <token>` (optional), `Content-Type: application/json` | Response submission schema (see below) | None | `{"success": true, "message": "Response submitted successfully", "data": {...}}` | 201, 400, 404, 500 |
| `/api/responses/my-responses` | GET | Private | Get user's responses | `Authorization: Bearer <token>` | None | `limit, page` | `{"success": true, "data": [...], "pagination": {...}}` | 200, 401, 500 |
| `/api/responses/survey/:surveyId` | GET | Private (Brand) | Get survey responses | `Authorization: Bearer <brand-token>` | None | `limit, page, includeDetails` | `{"success": true, "data": [...], "pagination": {...}}` | 200, 401, 403, 404, 500 |
| `/api/responses/:id` | GET | Private | Get single response | `Authorization: Bearer <token>` | None | None | `{"success": true, "data": {...}}` | 200, 401, 403, 404, 500 |
| `/api/responses/analytics/:surveyId` | GET | Private (Brand) | Get response analytics | `Authorization: Bearer <brand-token>` | None | None | `{"success": true, "data": {"surveyTitle": "string", "summary": {...}, "questionAnalysis": [...]}}` | 200, 401, 403, 404, 500 |
| `/api/responses/export/:surveyId` | GET | Private (Brand) | Export responses CSV | `Authorization: Bearer <brand-token>` | None | None | CSV file download | 200, 401, 403, 404, 500 |

---

## Category Endpoints

| Endpoint | Method | Type | Description | Headers | Request Body | Expected Response | Status Codes |
|----------|---------|------|-------------|---------|--------------|-------------------|--------------|
| `/api/categories` | GET | Public | Get all categories | None | None | `{"success": true, "data": [...]}` | 200, 500 |
| `/api/categories/:id` | GET | Public | Get single category | None | None | `{"success": true, "data": {...}}` | 200, 404, 500 |
| `/api/categories` | POST | Private (Admin) | Create category | `Authorization: Bearer <admin-token>`, `Content-Type: application/json` | `{"name": "string", "description": "string", "icon": "string", "color": "string", "slug": "string"}` | `{"success": true, "message": "Category created successfully", "data": {...}}` | 201, 400, 401, 403, 500 |

---

## System Endpoints

| Endpoint | Method | Type | Description | Expected Response | Status Codes |
|----------|---------|------|-------------|-------------------|--------------|
| `/api` | GET | Public | API info | `{"success": true, "message": "Youth Talks API Base Endpoint", "timestamp": "ISO Date", "environment": "string"}` | 200 |
| `/health` | GET | Public | Health check | `{"success": true, "message": "Youth Talks API is running", "timestamp": "ISO Date", "environment": "string"}` | 200 |
| `/api/ping` | GET | Public | Legacy ping | `{"message": "Hello from Youth Talks Express server!", "timestamp": "ISO Date"}` | 200 |

---

## Request Body Schemas

### User Registration Schema
```json
{
  "name": "string (required, max 100 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)",
  "role": "user (default)"
}
```

### Brand Registration Schema
```json
{
  "name": "string (required, max 100 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)",
  "phone": "string (optional)",
  "brandDetails": {
    "companyName": "string (optional)",
    "website": "string (optional, URL)",
    "industry": "string (optional)",
    "size": "string (optional, enum: '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')",
    "companySize": "string (optional)",
    "foundedYear": "number (optional)",
    "location": "string (optional)",
    "description": "string (optional)",
    "logo": "string (optional, URL)",
    "contactPhone": "string (optional)",
    "address": {
      "street": "string (optional)",
      "city": "string (optional)",
      "state": "string (optional)",
      "country": "string (optional)",
      "zipCode": "string (optional)"
    }
  }
}
```

### Form Creation Schema
```json
{
  "title": "string (required, max 200 chars)",
  "description": "string (optional, max 1000 chars)",
  "headerImage": "string (optional, URL)",
  "headline": "string (optional, max 300 chars)",
  "category": "string (required, enum: see categories below)",
  "customCategory": "string (optional)",
  "tags": ["string array (optional)"],
  "publishDate": "ISO Date (required)",
  "expiryDate": "ISO Date (required, must be after publishDate)",
  "status": "string (optional, default: 'draft')",
  "metaTitle": "string (optional, max 60 chars)",
  "metaDescription": "string (optional, max 160 chars)",
  "questions": [
    {
      "id": "string (required, unique within form)",
      "type": "string (required, enum: see question types below)",
      "title": "string (required)",
      "description": "string (optional)",
      "isRequired": "boolean (default: false)",
      "options": [
        {
          "id": "string (required for choice-based questions)",
          "text": "string (required)"
        }
      ],
      "validation": {
        "minLength": "number (optional)",
        "maxLength": "number (optional)",
        "minValue": "number (optional)",
        "maxValue": "number (optional)"
      }
    }
  ],
  "settings": {
    "allowMultipleSubmissions": "boolean (default: false)",
    "requireEmailVerification": "boolean (default: false)",
    "showProgressBar": "boolean (default: true)",
    "shuffleQuestions": "boolean (default: false)",
    "confirmationMessage": "string (optional)",
    "emailNotifications": "boolean (default: true)",
    "generateReports": "boolean (default: true)",
    "collectEmail": "boolean (default: true)",
    "collectName": "boolean (default: true)",
    "isPublic": "boolean (default: true)"
  }
}
```

### Response Submission Schema
```json
{
  "surveyId": "ObjectId (required)",
  "respondentEmail": "string (required for anonymous users)",
  "respondentName": "string (required for anonymous users)",
  "responses": [
    {
      "questionId": "string (required, must match question ID)",
      "questionType": "string (required)",
      "answer": "mixed (string, number, or array depending on question type)"
    }
  ],
  "timeTaken": "number (optional, in minutes)",
  "deviceInfo": {
    "type": "string (optional: 'desktop', 'mobile', 'tablet')",
    "browser": "string (optional)",
    "os": "string (optional)"
  }
}
```

---

## Error Response Formats

### Standard Error Response
```json
{
  "success": false,
  "message": "Human readable error message",
  "error": "ERROR_CODE",
  "details": {} // Optional additional error details
}
```

### Common Error Codes

| Error Code | Status | Description |
|------------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `MISSING_REQUIRED_FIELDS` | 400 | Required fields are missing |
| `INVALID_CREDENTIALS` | 401 | Login credentials are invalid |
| `NO_TOKEN` | 401 | Authorization token is missing |
| `TOKEN_EXPIRED` | 401 | Authorization token has expired |
| `INVALID_TOKEN` | 401 | Authorization token is invalid |
| `NOT_A_BRAND` | 403 | User is not a brand account |
| `OWNERSHIP_REQUIRED` | 403 | User doesn't own the resource |
| `USER_NOT_FOUND` | 404 | User account not found |
| `FORM_NOT_FOUND` | 404 | Survey form not found |
| `SURVEY_NOT_LIVE` | 400 | Survey is not accepting responses |
| `DUPLICATE_RESPONSE` | 400 | User has already responded |
| `INTERNAL_SERVER_ERROR` | 500 | Server-side error occurred |

---

## Enumerations and Constants

### User Roles
- `admin`: Full system access
- `brand`: Can create surveys and view analytics
- `user`: Can submit responses

### Survey Status
- `draft`: Not published, editable
- `published`: Live and accepting responses
- `scheduled`: Will be published later (based on publishDate)
- `closed`: No longer accepting responses

### Question Types
- `text`: Short text input
- `paragraph`: Long text input
- `multiple-choice`: Single selection from options
- `checkbox`: Multiple selections from options
- `dropdown`: Select from dropdown options
- `rating`: Numeric rating scale
- `number`: Numeric input
- `email`: Email format validation
- `date`: Date picker input

### Categories
- Food and Beverages
- Entertainment
- Luxury
- Logistics
- Vehicles
- NGO's
- Retail
- Education
- Fashion and Lifestyle
- Technology
- Marketing
- HR
- Others

### Company Sizes
- 1-10
- 11-50
- 51-200
- 201-500
- 501-1000
- 1000+

---

## Authentication & Authorization

### Token Format
- **Type**: JWT (JSON Web Token)
- **Header**: `Authorization: Bearer <token>`
- **Expiration**: 1 hour (configurable)

### Role-Based Permissions

| Action | Admin | Brand | User |
|--------|-------|-------|------|
| Create Survey | ✅ | ✅ | ❌ |
| View All Surveys | ✅ | ❌ | ❌ |
| Edit Own Survey | ✅ | ✅ | ❌ |
| Delete Own Survey | ✅ | ✅ | ❌ |
| Submit Response | ✅ | ✅ | ✅ |
| View Own Responses | ✅ | ✅ | ✅ |
| View Survey Analytics | ✅ | ✅ (own) | ❌ |
| Export Responses | ✅ | ✅ (own) | ❌ |
| Manage Categories | ✅ | ❌ | ❌ |
| Change Form Status | ✅ | ✅ (own) | ❌ |

---

## Base URL
**Development**: `http://localhost:5000/api`
**Production**: `https://your-domain.com/api`

## Content-Type
All POST/PUT/PATCH requests should include:
```
Content-Type: application/json
```

## Rate Limiting
Consider implementing rate limiting in production:
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user

---

*Last Updated: July 23, 2025*
*Version: 1.0.0*
