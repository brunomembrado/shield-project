# Transaction Service

Transaction Service handles USDT payment processing and tracking for the Shield platform. It manages the complete transaction lifecycle from payment initiation to bank wire settlement.

## Overview

The Transaction Service is responsible for:
- Creating and managing USDT-to-USD transactions
- Tracking transaction status through various stages
- Calculating exchange rates and service fees
- Managing bank account information for wire transfers
- Providing transaction statistics and reporting

## Architecture

```
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Transaction Service │
└──────┬──────────────┘
       │
       ├──► Wallet Service (wallet validation)
       ├──► Blockchain Service (payment verification)
       └──► Compliance Service (transaction screening)
```

## Features

- **Transaction Creation**: Create new USDT payment transactions
- **Status Tracking**: Track transactions through multiple states
- **Exchange Rate Management**: Fetch and apply USDT/USD exchange rates
- **Fee Calculation**: Calculate service fees based on transaction amount
- **Bank Account Management**: Store and manage bank account details for wire transfers
- **Transaction History**: Retrieve user transaction history with filtering
- **Statistics**: Provide transaction statistics and analytics

## Transaction Status Flow

```
PENDING → PAYMENT_RECEIVED → VALIDATING → COMPLIANCE_CHECK → 
APPROVED → WIRE_SUBMITTED → WIRE_PROCESSED
```

Failed transactions can occur at any stage and transition to `FAILED` or `REJECTED` status.

## API Endpoints

### POST /transactions
Create a new transaction.

**Request Body:**
```json
{
  "walletId": "uuid",
  "chain": "POLYGON" | "TRON",
  "amountUSDT": "100.0",
  "bankAccountName": "John Doe",
  "bankAccountNumber": "1234567890",
  "bankRoutingNumber": "123456789" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "transaction-id",
    "userId": "user-id",
    "walletId": "wallet-id",
    "chain": "POLYGON",
    "amountUSDT": "100.0",
    "amountUSD": "100.00",
    "exchangeRate": "1.0",
    "serviceFee": "1.00",
    "netAmount": "99.00",
    "status": "PENDING",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### GET /transactions
Get all transactions for authenticated user.

**Query Parameters:**
- `chain` (optional): Filter by chain (POLYGON, TRON)
- `status` (optional): Filter by status
- `limit` (optional): Number of results (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "total": 100,
      "limit": 20,
      "offset": 0,
      "totalPages": 5
    }
  }
}
```

### GET /transactions/:id
Get a specific transaction by ID.

### PATCH /transactions/:id/status
Update transaction status.

**Request Body:**
```json
{
  "status": "PAYMENT_RECEIVED",
  "txHash": "0x123...", // Optional
  "bankWireReference": "WIRE123", // Optional
  "notes": "Payment received" // Optional
}
```

### GET /transactions/stats
Get transaction statistics for authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 100,
    "pending": 5,
    "completed": 80,
    "totalVolumeUSD": "100000.00",
    "totalFees": "1000.00",
    "byChain": {
      "polygon": 60,
      "tron": 40
    },
    "byStatus": {
      "pending": 5,
      "paymentReceived": 10,
      "approved": 20,
      "wireProcessed": 80,
      "failed": 3,
      "rejected": 2
    }
  }
}
```

## Environment Variables

```bash
# Service Configuration
PORT=3003
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/shield_transactions

# Service URLs
BLOCKCHAIN_SERVICE_URL=http://blockchain-service:3004
COMPLIANCE_SERVICE_URL=http://compliance-service:3005

# Business Logic
SERVICE_FEE_PERCENTAGE=1 # Default service fee percentage
```

## Database Schema

### Transaction Model

```prisma
model Transaction {
  id                  String            @id @default(uuid())
  userId              String
  walletId            String
  chain               ChainType
  toAddress           String
  amountUSDT          String
  amountUSD           String
  exchangeRate        String
  serviceFeePercentage String
  serviceFee          String
  netAmount           String
  status              TransactionStatus
  txHash              String?
  bankAccountName     String
  bankAccountNumber   String
  bankRoutingNumber   String?
  bankWireReference   String?
  notes               String?
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
}
```

## Development

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- Docker (optional)

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run database migrations:
```bash
npm run prisma:migrate
```

4. Generate Prisma client:
```bash
npm run prisma:generate
```

5. Start the service:
```bash
npm run dev
```

### Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Docker

Build Docker image:
```bash
docker build -t shield-transaction-service .
```

Run with Docker Compose:
```bash
docker-compose up transaction-service
```

## Error Handling

The service uses standardized error responses:

- `400 Bad Request`: Invalid input or business logic error
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: User does not have permission
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Unexpected server error

## Security Considerations

- All endpoints require JWT authentication
- Users can only access their own transactions
- Bank account information is stored securely
- Transaction status transitions are validated
- Service fee calculations are auditable

## Monitoring

The service exposes health check endpoint:
```
GET /health
```

Monitor transaction processing:
- Transaction creation rate
- Status transition times
- Failed transaction rate
- Average service fee collected

## License

MIT © Shield Security, Inc.

