# NASA-Level Error Handling Guide

## Overview

All error handling in the Shield Platform uses **strongly typed errors** with comprehensive error classes and utilities.

## Error Types

### Base Error Class

All errors extend from `BaseError`:

```typescript
import { BaseError } from '@shield/shared/errors';

// BaseError provides:
// - code: string (error code)
// - statusCode: number (HTTP status code)
// - context: ErrorContext (additional debugging info)
// - timestamp: Date
// - isOperational: boolean (operational vs system errors)
```

### Application Error Classes

```typescript
import {
  ValidationError,        // 400 - Input validation failed
  AuthenticationError,     // 401 - Authentication failed
  AuthorizationError,      // 403 - Permission denied
  NotFoundError,          // 404 - Resource not found
  ConflictError,          // 409 - Resource conflict
  RateLimitError,         // 429 - Rate limit exceeded
  ServiceError,          // 500 - General service error
  DatabaseError,         // 500 - Database operation failed
  ExternalServiceError,  // 502 - External API failed
  NetworkError,          // 503 - Network issue
  TimeoutError,          // 504 - Operation timeout
  ConfigurationError,    // 500 - Configuration issue
  BusinessLogicError,    // 422 - Business rule violation
} from '@shield/shared/errors';
```

## Usage Patterns

### ✅ Correct: Strongly Typed Error Handling

```typescript
import {
  BaseError,
  ensureBaseError,
  shouldLogError,
  NotFoundError,
  ValidationError,
} from '@shield/shared/errors';

try {
  // Your code
} catch (error: unknown) {
  // Convert unknown error to BaseError
  const baseError = ensureBaseError(error, {
    action: 'getUser',
    userId: req.params.id,
  });

  // Log only if needed
  if (shouldLogError(baseError)) {
    logger.error('Operation failed', baseError, {
      errorCode: baseError.code,
      statusCode: baseError.statusCode,
    });
  }

  // Handle error
  this.handleError(baseError, res, req.path);
}
```

### ❌ Incorrect: Untyped Error Handling

```typescript
// ❌ BAD - error is unknown
try {
  // code
} catch (error) {
  logger.error('Failed', error as Error); // Type assertion needed
}

// ❌ BAD - No error type checking
catch (error: unknown) {
  if (error instanceof ServiceError) { // Old pattern
    // ...
  }
}
```

## Controller Error Handling

All controllers should use this pattern:

```typescript
import {
  BaseError,
  ensureBaseError,
  shouldLogError,
} from '@shield/shared/errors';

export class MyController {
  public async handleRequest(req: Request, res: Response): Promise<void> {
    const logger = serviceLogger();
    
    try {
      // Extract data
      const data = req.body;

      // Call use case
      const result = await this.useCase.execute(data);

      // Format response
      res.status(200).json(createSuccessResponse(result));
    } catch (error: unknown) {
      // Convert to BaseError with context
      const baseError = ensureBaseError(error, {
        action: 'handleRequest',
        ...extractLogContext(req),
      });

      // Log if needed
      if (shouldLogError(baseError)) {
        logger.error('Request failed', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      // Handle error
      this.handleError(baseError, res, req.path);
    }
  }

  private handleError(error: BaseError, res: Response, path: string): void {
    res.status(error.statusCode).json(
      createErrorResponse(
        error.message,
        error.statusCode,
        path,
        {
          code: error.code,
          context: error.context,
        }
      )
    );
  }
}
```

## Use Case Error Handling

Use cases should throw specific error types:

```typescript
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessLogicError,
  DatabaseError,
  handleUnknownError,
} from '@shield/shared/errors';

export class GetUserUseCase {
  public async execute(userId: string): Promise<User> {
    try {
      // Validate input
      if (!userId) {
        throw new ValidationError('User ID is required', { userId });
      }

      // Business logic
      const user = await this.repository.findById(userId);
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      return user;
    } catch (error: unknown) {
      // Re-throw known errors
      if (error instanceof NotFoundError || 
          error instanceof ValidationError) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to get user', {
        userId,
        operation: 'getUser',
      });
    }
  }
}
```

## Repository Error Handling

Repositories should wrap database errors:

```typescript
import {
  DatabaseError,
  NotFoundError,
  handleUnknownError,
} from '@shield/shared/errors';

export class UserRepository {
  public async findById(id: string): Promise<User | null> {
    try {
      const userData = await this.prisma.user.findUnique({
        where: { id },
      });

      return userData ? User.fromPersistence(userData) : null;
    } catch (error: unknown) {
      // Wrap database errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(
          `Database query failed: ${error.message}`,
          'findById',
          { id, code: error.code }
        );
      }

      throw handleUnknownError(error, 'Failed to find user', {
        id,
        operation: 'findById',
      });
    }
  }
}
```

## Error Utilities

### `ensureBaseError(error, context)`

Converts any unknown error to a `BaseError`:

```typescript
const baseError = ensureBaseError(error, {
  userId: '123',
  operation: 'createUser',
});
```

### `handleUnknownError(error, defaultMessage, context)`

Handles truly unknown errors:

```typescript
throw handleUnknownError(
  error,
  'An unexpected error occurred',
  { context: 'additional info' }
);
```

### `shouldLogError(error)`

Determines if error should be logged:

```typescript
if (shouldLogError(baseError)) {
  logger.error('Error occurred', baseError);
}
```

### `isBaseError(error)`

Type guard to check if error is BaseError:

```typescript
if (isBaseError(error)) {
  console.log(error.code, error.statusCode);
}
```

## Best Practices

1. ✅ **Always type catch blocks**: `catch (error: unknown)`
2. ✅ **Use `ensureBaseError`** to convert unknown errors
3. ✅ **Throw specific error types** in use cases
4. ✅ **Add context** to errors for debugging
5. ✅ **Log only when needed** using `shouldLogError`
6. ✅ **Never use `error as Error`** - use proper error handling
7. ✅ **Never use `any`** - always use `unknown` and convert

## Migration Checklist

- [ ] Update all `catch (error)` to `catch (error: unknown)`
- [ ] Replace `error instanceof ServiceError` with `ensureBaseError`
- [ ] Update all `handleError` methods to accept `BaseError`
- [ ] Add context to all error handling
- [ ] Use `shouldLogError` before logging
- [ ] Replace all `error as Error` with proper error handling

