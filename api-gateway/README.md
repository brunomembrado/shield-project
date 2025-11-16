# Shield API Gateway

Central entry point for the Shield microservices platform. Routes requests to appropriate services with authentication and rate limiting.

## Overview

The API Gateway serves as the single entry point for all client applications. It handles:

- **Request Routing**: Forwards requests to appropriate microservices
- **Authentication**: Validates JWT tokens before forwarding to services
- **Rate Limiting**: Protects services from abuse
- **Request Logging**: Centralized logging of all API calls
- **Error Handling**: Consistent error responses

## Architecture

```
Client Request
      ↓
API Gateway (Port 8080)
      ↓
   [Authentication]
      ↓
   [Rate Limiting]
      ↓
   [Request Logging]
      ↓
   [Proxy to Service]
      ↓
Microservice Response
```

## Routes

| Gateway Path | Service | Service URL |
|-------------|---------|-------------|
| `/api/auth/*` | Auth Service | `http://localhost:3001` |
| `/api/wallets/*` | Wallet Service | `http://localhost:3002` |
| `/api/transactions/*` | Transaction Service | `http://localhost:3003` |
| `/api/blockchain/*` | Blockchain Service | `http://localhost:3004` |
| `/api/compliance/*` | Compliance Service | `http://localhost:3005` |

## Public Routes (No Authentication Required)

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `GET /health` - Health check
- `GET /` - Gateway info

## Protected Routes

All other routes require a valid JWT token in the Authorization header:

```bash
Authorization: Bearer <access_token>
```

## Setup

### Environment Variables

```bash
# Gateway Configuration
PORT=8080
NODE_ENV=development

# JWT Configuration
JWT_SECRET=<your-jwt-secret>

# CORS
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window

# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
WALLET_SERVICE_URL=http://localhost:3002
TRANSACTION_SERVICE_URL=http://localhost:3003
BLOCKCHAIN_SERVICE_URL=http://localhost:3004
COMPLIANCE_SERVICE_URL=http://localhost:3005
```

### Installation

```bash
cd api-gateway
npm install
```

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## Usage Examples

### Register a User

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ss123"
  }'
```

### Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ss123"
  }'
```

### Create Wallet (Authenticated)

```bash
curl -X POST http://localhost:8080/api/wallets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "chain": "POLYGON",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
    "tag": "Main Wallet"
  }'
```

## Features

### Authentication Middleware

The gateway validates JWT tokens before forwarding requests to services. It extracts user information and passes it to downstream services via headers:

- `x-user-id`: User ID from JWT
- `x-user-email`: User email from JWT

Services can use these headers to identify the authenticated user without re-validating the token.

### Rate Limiting

Default configuration:
- **Window**: 15 minutes
- **Max Requests**: 100 per window per IP

Customize via environment variables.

### Error Handling

All errors return consistent JSON format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Common error codes:
- `UNAUTHORIZED` (401): Missing or invalid token
- `FORBIDDEN` (403): Expired token
- `NOT_FOUND` (404): Route not found
- `TOO_MANY_REQUESTS` (429): Rate limit exceeded
- `SERVICE_UNAVAILABLE` (503): Downstream service unavailable

## Health Check

```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "ok",
  "service": "api-gateway",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## Docker

```bash
# Build
docker build -t shield-api-gateway .

# Run
docker run -p 8080:8080 \
  -e JWT_SECRET=<secret> \
  -e AUTH_SERVICE_URL=http://auth-service:3001 \
  -e WALLET_SERVICE_URL=http://wallet-service:3002 \
  shield-api-gateway
```

## Monitoring

The gateway logs all requests in JSON format:

```json
{
  "method": "POST",
  "url": "/api/wallets",
  "statusCode": 201,
  "duration": "45ms",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## License

MIT © Shield Security, Inc.

