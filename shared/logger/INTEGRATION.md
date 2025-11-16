# Logger Integration Guide

This guide shows how to integrate the advanced logging system into all services.

## Step 1: Setup Middleware in Service Entry Point

Update your service's main `index.ts` or `app.ts`:

```typescript
import express from 'express';
import { requestTrackingMiddleware, requestCompletionMiddleware } from '@shield/shared/logger';
import { authServiceLogger } from '@shield/shared/logger/serviceLogger';

const app = express();
const logger = authServiceLogger(); // Use appropriate service logger

// Add request tracking early in middleware chain (before routes)
app.use(requestTrackingMiddleware(logger));

// ... other middleware (body parser, CORS, etc.) ...

// Add routes
app.use('/auth', authRoutes);

// Add request completion after routes (before error handlers)
app.use(requestCompletionMiddleware(logger));

// Error handlers
app.use(errorHandler);
```

## Step 2: Update Controllers

### Before:
```typescript
export async function createWallet(req: Request, res: Response): Promise<void> {
  try {
    const wallet = await walletService.createWallet(req.userId!, req.body);
    res.status(201).json(createSuccessResponse(wallet));
  } catch (error) {
    logError(error as Error, { path: req.path });
    res.status(500).json(createErrorResponse('Error', 500));
  }
}
```

### After:
```typescript
import { walletServiceLogger } from '@shield/shared/logger/serviceLogger';
import { logControllerEntry, extractLogContext } from '@shield/shared/logger/helpers';
import { RequestStage } from '@shield/shared/logger';

export async function createWallet(req: Request, res: Response): Promise<void> {
  const logger = walletServiceLogger();
  
  try {
    // Log controller entry
    logControllerEntry(logger, 'WalletController', 'createWallet', req);
    logger.recordStage(
      (req as Request & { correlationId?: string }).correlationId || '',
      RequestStage.CONTROLLER,
      { action: 'createWallet' }
    );

    const wallet = await walletService.createWallet(
      req.userId!,
      req.body,
      (req as Request & { correlationId?: string }).correlationId || ''
    );

    logger.info('Wallet created successfully', {
      ...extractLogContext(req),
      walletId: wallet.id,
    });

    res.status(201).json(createSuccessResponse(wallet));
  } catch (error) {
    logger.error('Wallet creation failed', error as Error, extractLogContext(req));
    
    if (error instanceof ServiceError) {
      res.status(error.statusCode).json(
        createErrorResponse(error.message, error.statusCode, req.path)
      );
    } else {
      res.status(500).json(createErrorResponse('Internal server error', 500, req.path));
    }
  }
}
```

## Step 3: Update Service Functions

### Before:
```typescript
export async function createWallet(userId: string, walletData: CreateWalletRequest) {
  const wallet = await prisma.wallet.create({
    data: {
      userId,
      ...walletData,
    },
  });
  return wallet;
}
```

### After:
```typescript
import { walletServiceLogger } from '@shield/shared/logger/serviceLogger';
import { withDatabaseLogging } from '@shield/shared/logger/helpers';
import { RequestStage } from '@shield/shared/logger';

export async function createWallet(
  userId: string,
  walletData: CreateWalletRequest,
  correlationId: string = ''
) {
  const logger = walletServiceLogger();
  
  try {
    logger.logServiceCall('WalletService', 'createWallet', correlationId, {
      userId,
      chain: walletData.chain,
    });
    logger.recordStage(correlationId, RequestStage.SERVICE, { action: 'createWallet' });

    const wallet = await withDatabaseLogging(
      logger,
      'INSERT',
      'wallets',
      correlationId,
      async () => {
        return await prisma.wallet.create({
          data: {
            userId,
            ...walletData,
          },
        });
      }
    );

    logger.info('Wallet created', {
      correlationId,
      walletId: wallet.id,
      userId,
    });

    return wallet;
  } catch (error) {
    logger.error('Wallet creation failed', error as Error, {
      correlationId,
      userId,
    });
    throw error;
  }
}
```

## Step 4: Update External API Calls

### Before:
```typescript
const response = await axios.post('https://api.compliance.com/screen', { address });
```

### After:
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

## Step 5: Update All Services

Apply the same pattern to:
- ✅ Auth Service (already updated)
- ⏳ Wallet Service
- ⏳ Transaction Service
- ⏳ Blockchain Service
- ⏳ Compliance Service
- ⏳ API Gateway

## Checklist for Each Service

- [ ] Add logger middleware to service entry point
- [ ] Update all controller functions with logging
- [ ] Update all service functions with logging
- [ ] Add correlationId parameter to service functions
- [ ] Wrap database operations with `withDatabaseLogging`
- [ ] Wrap external API calls with `withExternalApiLogging`
- [ ] Replace `logError`/`logInfo` with logger methods
- [ ] Add stage tracking for important operations

## Example: Complete Service Integration

See `services/auth-service/src/authController.ts` and `services/auth-service/src/authService.ts` for complete examples.

