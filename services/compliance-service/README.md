# Compliance Service

Compliance Service handles KYC/KYB verification and transaction screening for the Shield platform. It ensures all transactions and entities comply with regulatory requirements.

## Overview

The Compliance Service is responsible for:
- KYC (Know Your Customer) verification for individual users
- KYB (Know Your Business) verification for business entities
- Wallet address screening against sanctions lists
- Transaction screening for AML (Anti-Money Laundering) compliance
- Risk assessment and manual review workflows

## Architecture

```
┌─────────────┐
│ API Gateway │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Compliance Service  │
└──────┬──────────────┘
       │
       ├──► External Compliance APIs (Elliptic, Chainalysis, etc.)
       └──► Database (compliance check records)
```

## Features

- **KYC Verification**: Verify individual user identities
- **KYB Verification**: Verify business entities
- **Address Screening**: Screen wallet addresses against sanctions lists
- **Transaction Screening**: Screen transactions for AML compliance
- **Risk Assessment**: Assign risk levels (LOW, MEDIUM, HIGH, CRITICAL)
- **Manual Review**: Support for manual compliance review workflows
- **Compliance Status Tracking**: Track compliance check status and history

## Compliance Check Status

- `PENDING`: Check initiated, awaiting results
- `APPROVED`: Check passed, entity approved
- `REJECTED`: Check failed, entity rejected
- `REVIEW_REQUIRED`: Manual review needed

## Risk Levels

- `LOW`: Low risk, auto-approved
- `MEDIUM`: Medium risk, may require review
- `HIGH`: High risk, requires review
- `CRITICAL`: Critical risk, auto-rejected

## API Endpoints

### POST /compliance/kyc
Perform KYC verification for a user.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "country": "US",
  "documentType": "PASSPORT",
  "documentNumber": "ABC123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "check-id",
    "entityType": "USER",
    "entityId": "user-id",
    "status": "PENDING",
    "riskLevel": "LOW",
    "checkType": "KYC",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /compliance/kyb
Perform KYB verification for a business.

**Request Body:**
```json
{
  "businessName": "Shield Security Inc.",
  "registrationNumber": "REG123456",
  "country": "US",
  "documents": ["doc1.pdf", "doc2.pdf"]
}
```

### POST /compliance/screen/wallet
Screen a wallet address for compliance.

**Request Body:**
```json
{
  "address": "0x1234567890123456789012345678901234567890",
  "chain": "POLYGON"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "check-id",
    "entityType": "WALLET",
    "entityId": "0x123...",
    "status": "APPROVED",
    "riskLevel": "LOW",
    "checkType": "AML_SANCTIONS",
    "details": {
      "address": "0x123...",
      "chain": "POLYGON",
      "isSanctioned": false
    }
  }
}
```

### POST /compliance/screen/transaction
Screen a transaction for compliance.

**Request Body:**
```json
{
  "transactionId": "tx-123",
  "fromAddress": "0x123...",
  "amount": "1000.00"
}
```

### GET /compliance/status/:id
Get compliance check status.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "check-id",
    "status": "APPROVED",
    "riskLevel": "LOW",
    "checkType": "KYC",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### POST /compliance/review/:id
Manually review a compliance check.

**Request Body:**
```json
{
  "decision": "APPROVED" | "REJECTED",
  "notes": "Approved after manual review"
}
```

## Environment Variables

```bash
# Service Configuration
PORT=3005
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/shield_compliance

# External Compliance API (optional)
COMPLIANCE_API_URL=https://api.compliance-provider.com
COMPLIANCE_API_KEY=your-api-key
```

## Database Schema

### ComplianceCheck Model

```prisma
model ComplianceCheck {
  id          String            @id @default(uuid())
  entityType  EntityType        // USER, BUSINESS, TRANSACTION, WALLET
  entityId    String            // ID of entity being checked
  status      ComplianceStatus  // PENDING, APPROVED, REJECTED, REVIEW_REQUIRED
  riskLevel   RiskLevel         // LOW, MEDIUM, HIGH, CRITICAL
  checkType   String            // KYC, KYB, AML_SANCTIONS, AML_TRANSACTION
  details     Json?             // Additional check details
  reviewNotes String?           // Manual review notes
  reviewedBy  String?           // Reviewer user ID
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}
```

## Integration with External Providers

The service can integrate with external compliance providers:

- **Elliptic**: Transaction monitoring and sanctions screening
- **Chainalysis**: Blockchain analytics and compliance
- **TRM Labs**: Digital asset compliance
- **Jumio**: KYC/KYB identity verification
- **Onfido**: Identity verification

To enable external provider integration:

1. Set `COMPLIANCE_API_URL` and `COMPLIANCE_API_KEY` environment variables
2. The service will automatically use the external API for screening
3. Fallback to basic screening if API is unavailable (development only)

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
docker build -t shield-compliance-service .
```

Run with Docker Compose:
```bash
docker-compose up compliance-service
```

## Security Considerations

- All compliance checks are logged and auditable
- Sensitive data is stored securely
- External API calls use secure authentication
- Manual reviews require proper authorization
- Compliance check results are immutable (status changes are tracked)

## Compliance Workflows

### KYC Workflow

1. User submits KYC information
2. Service creates compliance check record
3. Information is verified (manual or automated)
4. Risk level is assigned
5. Status updated to APPROVED or REJECTED

### Transaction Screening Workflow

1. Transaction is created
2. Sender address is screened
3. Transaction amount is evaluated
4. Risk level is assigned based on screening results
5. Large transactions (>$100k) automatically flagged for review
6. Status updated based on risk assessment

## Monitoring

The service exposes health check endpoint:
```
GET /health
```

Monitor compliance operations:
- KYC/KYB completion rate
- Screening response times
- Rejection rate
- Manual review queue size
- External API availability

## License

MIT © Shield Security, Inc.

