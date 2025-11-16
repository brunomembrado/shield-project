# Shield Auth Service

Authentication microservice for the Shield platform. Handles user registration, login, JWT token management, and session control.

## Overview

The Auth Service is a critical component of the Shield platform that manages user authentication and authorization. It provides secure user registration, login functionality, and JWT-based token management with refresh token rotation.

## Features

- ✅ User registration with email and password
- ✅ Secure password hashing with bcrypt (12 salt rounds)
- ✅ JWT-based authentication (access + refresh tokens)
- ✅ Token refresh with automatic rotation
- ✅ User logout with token revocation
- ✅ Automatic cleanup of expired tokens
- ✅ Comprehensive input validation
- ✅ Detailed error handling and logging

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Joi
- **Testing**: Jest

## Database Schema

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  password      String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### POST /auth/register
Registers a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "User registered successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

---

### POST /auth/login
Authenticates a user and returns tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Login successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /auth/refresh
Refreshes access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Token refreshed successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Note:** Refresh token rotation is implemented - the old refresh token is revoked and a new one is issued.

---

### POST /auth/logout
Logs out a user by revoking their refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  },
  "message": "Logout successful",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

### GET /health
Health check endpoint.

**Response (200):**
```json
{
  "status": "ok",
  "service": "auth-service",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Service Configuration
NODE_ENV=development
PORT=3001
SERVICE_NAME=auth-service
SERVICE_VERSION=1.0.0

# Database
DATABASE_URL="postgresql://shield:shield_secure_password_2024@localhost:5432/shield_auth"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
```

**Generate secure JWT secrets:**
```bash
openssl rand -base64 32
```

## Setup & Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Installation Steps

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Generate Prisma client:**
```bash
npx prisma generate
```

4. **Run database migrations:**
```bash
npx prisma migrate dev
```

5. **Start the service:**
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

## Development

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Database Operations
```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# View database in Prisma Studio
npm run prisma:studio

# Reset database (warning: deletes all data)
npx prisma migrate reset
```

### Linting and Formatting
```bash
# Type check
npx tsc --noEmit

# Format code
npx prettier --write "src/**/*.ts"
```

## Docker Deployment

### Build Docker Image
```bash
docker build -t shield-auth-service .
```

### Run Container
```bash
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://shield:password@postgres:5432/shield_auth" \
  -e JWT_SECRET="your-secret" \
  -e JWT_REFRESH_SECRET="your-refresh-secret" \
  shield-auth-service
```

### Docker Compose
```bash
# Start service with dependencies
docker-compose up auth-service

# Start in detached mode
docker-compose up -d auth-service
```

## Security Considerations

1. **Password Storage**: Passwords are hashed using bcrypt with 12 salt rounds
2. **JWT Secrets**: Use strong, random secrets (minimum 256 bits)
3. **Token Expiration**: 
   - Access tokens: 15 minutes (short-lived)
   - Refresh tokens: 7 days (stored in database)
4. **Token Rotation**: Refresh tokens are rotated on each refresh request
5. **HTTPS**: Always use HTTPS in production
6. **Rate Limiting**: Consider implementing rate limiting for auth endpoints
7. **Account Lockout**: Consider implementing account lockout after N failed attempts

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "statusCode": 400,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/auth/register"
}
```

**Common Error Codes:**
- `400 BAD_REQUEST` - Validation failed
- `401 UNAUTHORIZED` - Invalid credentials or token
- `403 FORBIDDEN` - Access denied
- `404 NOT_FOUND` - Resource not found
- `409 CONFLICT` - User already exists
- `500 INTERNAL_SERVER_ERROR` - Server error

## Architecture

```
auth-service/
├── src/
│   ├── index.ts           # Service entry point
│   ├── routes.ts          # Route definitions
│   ├── authController.ts  # HTTP request handlers
│   ├── authService.ts     # Business logic
│   ├── validation.ts      # Input validation schemas
│   └── database.ts        # Prisma client
├── tests/
│   └── authService.test.ts # Unit tests
├── prisma/
│   └── schema.prisma      # Database schema
├── Dockerfile             # Container configuration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── README.md             # This file
```

## Monitoring & Logging

All logs are structured JSON for easy parsing:

```json
{
  "level": "INFO",
  "message": "User logged in successfully",
  "context": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### Common Issues

**Database Connection Error:**
```
Error: Can't reach database server
```
Solution: Check DATABASE_URL and ensure PostgreSQL is running.

**JWT Secret Not Configured:**
```
Error: JWT_SECRET is not configured
```
Solution: Set JWT_SECRET and JWT_REFRESH_SECRET in .env file.

**Port Already in Use:**
```
Error: listen EADDRINUSE: address already in use :::3001
```
Solution: Change PORT in .env or stop the process using port 3001.

## Contributing

1. Follow TypeScript best practices
2. Write unit tests for new features
3. Update documentation
4. Use conventional commit messages
5. Ensure all tests pass before submitting PR

## License

MIT © Shield Security, Inc.

## Support

For issues or questions:
- Email: dev@getshield.xyz
- GitHub Issues: [Create an issue](https://github.com/shield/shield-platform/issues)

