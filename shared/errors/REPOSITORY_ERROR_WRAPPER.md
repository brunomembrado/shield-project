# Repository Error Wrapping Guide

## Pattern for Wrapping Database Errors

All repositories should wrap Prisma errors in strongly typed DatabaseError:

```typescript
import { Prisma } from '@prisma/client';
import {
  DatabaseError,
  handleUnknownError,
} from '@shield/shared/errors';

try {
  const data = await this.prisma.model.findUnique({ where: { id } });
  return data ? Entity.fromPersistence(data) : null;
} catch (error: unknown) {
  // Wrap Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    throw new DatabaseError(
      `Database query failed: ${error.message}`,
      'findById',
      { id, code: error.code, meta: error.meta }
    );
  }

  // Wrap unknown errors
  throw handleUnknownError(error, 'Failed to find entity', {
    id,
    operation: 'findById',
  });
}
```

## Prisma Error Codes

Common Prisma error codes:
- `P2002`: Unique constraint violation
- `P2025`: Record not found
- `P2003`: Foreign key constraint violation
- `P2014`: Required relation violation

