# The Youth Talks - Survey Platform Backend

A comprehensive Node.js backend API for a modern survey and feedback collection platform, built with Express.js and MongoDB.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication with token management
- Role-based access control (Admin, Brand, User)
- Secure password hashing with bcrypt
- Token cleanup and management system
- Automated token expiration and cleanup

### 📊 Survey Management
- Create, update, delete surveys with rich question types
- Multiple question types: multiple-choice, checkbox, rating, text, paragraph, dropdown, email, number, date
- Survey status management (draft, published, scheduled, closed)
- Advanced survey settings and customization
- Form analytics and statistics

### 📝 Response Collection
- Support for both authenticated and anonymous responses
- Real-time response validation
- Duplicate response prevention
- Device and browser tracking
- Response analytics and insights

### 📈 Analytics & Reporting
- Comprehensive survey analytics
- Response export to CSV format
- Question-wise analysis
- Completion rates and time tracking
- Visual data representation ready endpoints

### 🏷️ Category Management
- Organized survey categories
- Category-based filtering
- Custom category support

### 🔧 System Features
- Automated database seeding
- Scheduled token cleanup
- Error handling and logging
- CORS support
- Rate limiting ready
- Docker support

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Task Scheduling**: node-cron
- **Environment**: dotenv
- **Containerization**: Docker

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd TheYouthTalks-Backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the development server**
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Docker Setup

1. **Build the Docker image**
```bash
docker build -t youth-talks-backend .
```

2. **Run the container**
```bash
docker run -p 5000:5000 --env-file .env youth-talks-backend
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/youthtalks

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE_TIME=1h

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080

# Token Cleanup (Optional)
CLEANUP_EXPIRED_TOKENS=true
TOKEN_CLEANUP_INTERVAL=3600000
```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

#### Register Brand
```http
POST /api/users/register-brand
Content-Type: application/json

{
  "name": "Tech Solutions",
  "email": "contact@techsolutions.com",
  "password": "password123",
  "brandDetails": {
    "companyName": "Tech Solutions Inc.",
    "website": "https://techsolutions.com",
    "industry": "Technology",
    "companySize": "51-200"
  }
}
```

#### Login
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Survey Form Endpoints

#### Get All Forms
```http
GET /api/forms
Authorization: Bearer <token> (optional)
```

#### Create Form
```http
POST /api/forms
Authorization: Bearer <brand-token>
Content-Type: application/json

{
  "title": "Customer Satisfaction Survey",
  "description": "Help us improve our services",
  "category": "Retail",
  "publishDate": "2025-01-01T00:00:00Z",
  "expiryDate": "2025-12-31T23:59:59Z",
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "title": "How satisfied are you?",
      "isRequired": true,
      "options": [
        {"id": "opt1", "text": "Very Satisfied"},
        {"id": "opt2", "text": "Satisfied"},
        {"id": "opt3", "text": "Neutral"}
      ]
    }
  ]
}
```

#### Update Form Status
```http
PATCH /api/forms/:id/status
Authorization: Bearer <brand-token>
Content-Type: application/json

{
  "status": "published"
}
```

### Response Endpoints

#### Submit Response (Anonymous)
```http
POST /api/responses
Content-Type: application/json

{
  "surveyId": "survey-id-here",
  "respondentEmail": "user@example.com",
  "respondentName": "Anonymous User",
  "responses": [
    {
      "questionId": "q1",
      "questionType": "multiple-choice",
      "answer": "Very Satisfied"
    }
  ],
  "timeTaken": 3.5
}
```

#### Get Survey Analytics
```http
GET /api/responses/analytics/:surveyId
Authorization: Bearer <brand-token>
```

#### Export Responses as CSV
```http
GET /api/responses/export/:surveyId
Authorization: Bearer <brand-token>
```

### Category Endpoints

#### Get All Categories
```http
GET /api/categories
```

## Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ["admin", "user", "brand"],
  isActive: Boolean,
  brandDetails: {
    companyName: String,
    website: String,
    industry: String,
    // ... more fields
  },
  timestamps: true
}
```

### Survey Form Model
```javascript
{
  title: String,
  description: String,
  author: String,
  authorId: ObjectId,
  category: String,
  publishDate: Date,
  expiryDate: Date,
  status: ["draft", "published", "scheduled", "closed"],
  questions: [QuestionSchema],
  settings: SettingsSchema,
  timestamps: true
}
```

### Survey Response Model
```javascript
{
  surveyId: ObjectId,
  respondentId: ObjectId (optional),
  respondentEmail: String,
  respondentName: String,
  responses: [ResponseSchema],
  timeTaken: Number,
  ipAddress: String,
  timestamps: true
}
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Token Management
- Access tokens expire after 1 hour (configurable)
- Automatic token cleanup runs periodically
- Support for token revocation and logout

### Role-Based Access
- **Admin**: Full system access
- **Brand**: Can create and manage surveys, view analytics
- **User**: Can submit responses, view own responses

## Deployment

### Environment Setup

1. **Production Environment Variables**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/youthtalks
JWT_SECRET=your-production-secret
ALLOWED_ORIGINS=https://yourdomain.com
```

2. **Database Indexing**
The application automatically creates necessary database indexes for optimal performance.

3. **Health Check**
```http
GET /health
```

### Docker Deployment

```bash
# Build production image
docker build -t youth-talks-backend .

# Run with environment file
docker run -d -p 5000:5000 --env-file .env.production youth-talks-backend
```

### Vercel Deployment

The project includes a `vercel.json` configuration for easy Vercel deployment:

```bash
npm install -g vercel
vercel
```

## Scheduled Tasks

The application includes automated cleanup tasks:

- **Hourly**: Clean expired access tokens
- **Every 12 hours**: Clean revoked tokens
- **Every 6 hours**: Clean inactive sessions
- **Daily**: Clean overused tokens
- **Weekly**: Comprehensive cleanup

## Error Handling

The API provides consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": {}
}
```

## Development

### Available Scripts

```bash
# Start development server with nodemon
npm run dev

# Start production server
npm start

# Run with PM2
npm run prod

# Docker build
npm run docker:build

# Docker run
npm run docker:run
```

### Code Structure

```
src/
├── config/          # Database and configuration
├── controllers/     # Route controllers
├── middleware/      # Authentication and other middleware
├── models/          # Mongoose models
├── routes/          # Express routes
├── services/        # Business logic and external services
└── utils/           # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code patterns and naming conventions
- Add appropriate error handling
- Include JSDoc comments for functions
- Test your changes thoroughly
- Update documentation as needed

## API Rate Limiting

Consider implementing rate limiting for production:

```javascript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api', limiter);
```

## Security Considerations

- JWT secrets should be strong and unique
- Use HTTPS in production
- Implement proper CORS configuration
- Validate and sanitize all inputs
- Regular security audits
- Keep dependencies updated

## Support

For support and questions:
- Create an issue in the repository
- Check existing documentation
- Review API endpoints and examples

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**The Youth Talks Survey Platform** - Empowering voices through comprehensive feedback collection and analysis.