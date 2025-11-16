# Advanced Logging System

Comprehensive structured logging system that tracks requests from controller to response across all services.

## Features

- **Correlation IDs**: Track requests across services with unique correlation IDs
- **Request Lifecycle Tracking**: Monitor requests through all stages (INCOMING → VALIDATION → CONTROLLER → SERVICE → DATABASE → RESPONSE)
- **Performance Metrics**: Automatic duration tracking for all operations
- **Structured Logging**: JSON-formatted logs with consistent structure
- **Log Levels**: DEBUG, INFO, WARN, ERROR, FATAL
- **Type Safety**: Fully type-safe implementation (no `any` types)
- **Sensitive Data Sanitization**: Automatically redacts passwords, tokens, and secrets
- **Error Tracking**: Comprehensive error logging with stack traces

## Quick Start

### 1. Create a Logger Instance

```typescript
import { createLogger, LogLevel } from '@shield/shared/logger';

const logger = createLogger('auth-service', LogLevel.INFO);
```

### 2. Setup Middleware

```typescript
import express from 'express';
import { requestTrackingMiddleware, requestCompletionMiddleware } from '@shield/shared/logger';

const app = express();
const logger = createLogger('auth-service');

// Add request tracking (must be early in middleware chain)
app.use(requestTrackingMiddleware(logger));

// Add request completion (must be after routes)
app.use(requestCompletionMiddleware(logger));
```

### 3. Use in Controllers

```typescript
import { Request, Response } from 'express';
import { logControllerEntry, extractLogContext } from '@shield/shared/logger/helpers';

export async function login(req: Request, res: Response): Promise<void> {
  const logger = getLogger(); // Your logger instance
  
  try {
    // Log controller entry
    logControllerEntry(logger, 'AuthController', 'login', req);
    
    const { email, password } = req.body;
    
    // Call service
    const result = await authService.login(email, password);
    
    // Log success
    logger.info('Login successful', extractLogContext(req));
    
    res.status(200).json(createSuccessResponse(result));
  } catch (error) {
    logger.error('Login failed', error as Error, extractLogContext(req));
    // Handle error...
  }
}
```

### 4. Use in Services

```typescript
import { logServiceCall } from '@shield/shared/logger/helpers';

export async function login(email: string, password: string, correlationId: string) {
  const logger = getLogger();
  
  // Log service call
  logger.logServiceCall('AuthService', 'login', correlationId, { email });
  
  // Your business logic...
  const user = await findUserByEmail(email);
  
  // Log database operation
  logger.logDatabaseOperation('SELECT', 'users', correlationId, duration);
  
  return user;
}
```

## Advanced Usage

### Manual Request Tracking

```typescript
// Start tracking
const correlationId = logger.startRequestTracking(req);

// Record stages
logger.recordStage(correlationId, RequestStage.VALIDATION);
logger.recordStage(correlationId, RequestStage.SERVICE, { serviceName: 'auth' });

// Complete tracking
logger.completeRequestTracking(req, res);
```

### Database Operation Logging

```typescript
import { withDatabaseLogging } from '@shield/shared/logger/helpers';

const result = await withDatabaseLogging(
  logger,
  'SELECT',
  'users',
  correlationId,
  async () => {
    return await prisma.user.findUnique({ where: { email } });
  }
);
```

### External API Call Logging

```typescript
import { withExternalApiLogging } from '@shield/shared/logger/helpers';

const response = await withExternalApiLogging(
  logger,
  'ComplianceAPI',
  '/screen-address',
  'POST',
  correlationId,
  async () => {
    return await axios.post('https://api.compliance.com/screen', { address });
  }
);
```

### Log Levels

```typescript
logger.debug('Detailed debug information', context);
logger.info('General information', context);
logger.warn('Warning message', context);
logger.error('Error occurred', error, context);
logger.fatal('Fatal error - system may be unstable', error, context);
```

## Request Stages

The logger tracks requests through these stages:

- `INCOMING`: Request received
- `VALIDATION`: Input validation
- `AUTHENTICATION`: User authentication
- `AUTHORIZATION`: Permission checks
- `CONTROLLER`: Controller processing
- `SERVICE`: Business logic execution
- `DATABASE`: Database operations
- `EXTERNAL_API`: External API calls
- `RESPONSE`: Response sent
- `ERROR`: Error occurred

## Log Entry Structure

```typescript
{
  timestamp: "2024-01-01T00:00:00.000Z",
  level: "INFO",
  message: "Request completed: POST /auth/login",
  correlationId: "uuid-here",
  service: "auth-service",
  context: {
    userId: "user-123",
    method: "POST",
    path: "/auth/login"
  },
  performance: {
    duration: 245,
    unit: "ms"
  },
  metadata: {
    statusCode: 200,
    stages: [
      { stage: "INCOMING", duration: undefined },
      { stage: "CONTROLLER", duration: 5 },
      { stage: "SERVICE", duration: 200 },
      { stage: "RESPONSE", duration: 40 }
    ],
    totalDuration: 245
  }
}
```

## Integration Examples

### Auth Service Controller

```typescript
import { logControllerEntry, extractLogContext } from '@shield/shared/logger/helpers';

export async function register(req: Request, res: Response): Promise<void> {
  const logger = getLogger();
  
  try {
    logControllerEntry(logger, 'AuthController', 'register', req);
    
    const result = await authService.register(req.body.email, req.body.password);
    
    logger.info('User registered successfully', {
      ...extractLogContext(req),
      userId: result.user.id,
    });
    
    res.status(201).json(createSuccessResponse(result));
  } catch (error) {
    logger.error('Registration failed', error as Error, extractLogContext(req));
    // Handle error...
  }
}
```

### Wallet Service

```typescript
export async function createWallet(req: Request, res: Response): Promise<void> {
  const logger = getLogger();
  
  try {
    logControllerEntry(logger, 'WalletController', 'createWallet', req);
    
    const wallet = await walletService.createWallet(
      req.userId!,
      req.body,
      (req as Request & { correlationId?: string }).correlationId || ''
    );
    
    logger.info('Wallet created', {
      ...extractLogContext(req),
      walletId: wallet.id,
    });
    
    res.status(201).json(createSuccessResponse(wallet));
  } catch (error) {
    logger.error('Wallet creation failed', error as Error, extractLogContext(req));
    // Handle error...
  }
}
```

## Best Practices

1. **Always use correlation IDs**: Pass correlation IDs through service calls
2. **Log at appropriate levels**: Use DEBUG for detailed info, INFO for normal flow, ERROR for failures
3. **Sanitize sensitive data**: The logger automatically sanitizes passwords, tokens, etc.
4. **Track performance**: Use duration tracking for slow operations
5. **Log errors with context**: Always include correlation ID and relevant context when logging errors
6. **Use structured logging**: Always use the logger methods instead of console.log

## Production Considerations

In production, you should:

1. **Send logs to external service**: Uncomment the `sendToLoggingService` calls and integrate with CloudWatch, Datadog, or similar
2. **Set appropriate log levels**: Use `LogLevel.WARN` or `LogLevel.ERROR` in production
3. **Implement log rotation**: Configure log retention policies
4. **Monitor log volume**: Set up alerts for excessive logging
5. **Correlate across services**: Use correlation IDs to trace requests across microservices

