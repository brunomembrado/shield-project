# @shield/shared

Shared utilities, types, and middleware for Shield microservices platform.

## Overview

This package contains common code shared across all Shield microservices, including:

- **Types**: TypeScript interfaces and type definitions
- **Utils**: Helper functions for common operations  
- **Middleware**: Express middleware for authentication, validation, error handling

## Installation

```bash
npm install
```

## Structure

```
shared/
├── types/          # TypeScript type definitions
│   └── index.ts   # All shared types and interfaces
├── utils/          # Utility functions
│   └── index.ts   # Helper functions
├── middleware/     # Express middleware
│   └── index.ts   # Reusable middleware
└── README.md
```

## Usage

### Importing Types

```typescript
import {
  User,
  Wallet,
  Transaction,
  ChainType,
  TransactionStatus,
  ServiceError
} from '../../../shared/types';
```

### Using Utilities

```typescript
import {
  createSuccessResponse,
  createErrorResponse,
  isValidEmail,
  isValidEthereumAddress,
  maskSensitiveData
} from '../../../shared/utils';

// Success response
res.json(createSuccessResponse(data, 'Operation successful'));

// Error response
res.status(404).json(createErrorResponse('Not found', 404));

// Validation
if (!isValidEmail(email)) {
  throw new ServiceError('Invalid email format', 400);
}
```

### Using Middleware

```typescript
import {
  authenticateToken,
  validateRequest,
  errorHandler,
  healthCheck,
  asyncHandler
} from '../../../shared/middleware';

// Authentication
router.get('/protected', authenticateToken, handler);

// Validation with Joi
router.post('/users', validateRequest(userSchema), createUser);

// Async handler wrapper
router.get('/users', asyncHandler(async (req, res) => {
  const users = await userService.findAll();
  res.json(createSuccessResponse(users));
}));

// Error handling (place at the end)
app.use(errorHandler);

// Health check
app.get('/health', healthCheck);
```

## Key Features

### Type Safety
All shared types ensure consistency across services and provide full IntelliSense support.

### Error Handling
Standardized error responses and custom error classes for different scenarios.

### Authentication
JWT-based authentication middleware with support for optional authentication.

### Validation
Schema-based validation using Joi for request body, query params, and path params.

### Utilities
Helper functions for:
- Response formatting
- Data validation (email, addresses, UUIDs)
- String manipulation and masking
- Number/token conversions
- Date operations
- Async utilities with retry logic

## Best Practices

1. **Always use asyncHandler** for async route handlers to avoid unhandled promise rejections
2. **Use ServiceError** for predictable error handling across services
3. **Validate inputs** using validateRequest middleware with Joi schemas
4. **Mask sensitive data** in logs using maskSensitiveData()
5. **Use typed responses** with createSuccessResponse() and createErrorResponse()

## Development

```bash
# Build TypeScript
npm run build

# Run tests
npm test
```

## License

MIT © Shield Security, Inc.

