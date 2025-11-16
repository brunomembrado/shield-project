/**
 * Logger Helper Functions
 * 
 * Utility functions for easy logging integration in controllers and services
 * 
 * @module @shield/shared/logger/helpers
 */

import { Request } from 'express';
import { Logger, RequestStage, LogContext } from './index';

// ============================================================================
// Controller Helpers
// ============================================================================

/**
 * Decorates a controller function with automatic logging
 */
export function withControllerLogging<T extends unknown[]>(
  logger: Logger,
  controllerName: string,
  methodName: string
) {
  return function(
    target: unknown,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<void>>
  ): TypedPropertyDescriptor<(...args: T) => Promise<void>> {
    const method = descriptor.value;
    
    if (!method) {
      return descriptor;
    }

    descriptor.value = async function(...args: T): Promise<void> {
      const req = args[0] as Request;
      const correlationId = (req as Request & { correlationId?: string }).correlationId || '';

      try {
        // Log controller entry
        logger.logControllerEntry(controllerName, methodName, req, {
          body: req.body,
          query: req.query,
          params: req.params,
        });

        // Execute controller
        await method.apply(this, args);
      } catch (error) {
        logger.error(
          `Controller error in ${controllerName}.${methodName}`,
          error as Error,
          {
            correlationId,
            controller: controllerName,
            method: methodName,
            service: logger['serviceName'],
          }
        );
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Helper to log controller entry manually
 */
export function logControllerEntry(
  logger: Logger,
  controllerName: string,
  methodName: string,
  req: Request,
  params?: Record<string, unknown>
): void {
  logger.logControllerEntry(controllerName, methodName, req, params);
}

// ============================================================================
// Service Helpers
// ============================================================================

/**
 * Wraps a service function with automatic logging and performance tracking
 */
export function withServiceLogging<T extends unknown[], R>(
  logger: Logger,
  serviceName: string,
  methodName: string
) {
  return function(
    target: unknown,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ): TypedPropertyDescriptor<(...args: T) => Promise<R>> {
    const method = descriptor.value;
    
    if (!method) {
      return descriptor;
    }

    descriptor.value = async function(...args: T): Promise<R> {
      // Try to extract correlation ID from first argument if it's a Request
      let correlationId = '';
      if (args[0] && typeof args[0] === 'object' && 'correlationId' in args[0]) {
        correlationId = (args[0] as { correlationId?: string }).correlationId || '';
      }

      const startTime = Date.now();

      try {
        logger.logServiceCall(serviceName, methodName, correlationId, {
          args: args.length > 0 ? args : undefined,
        });

        const result = await method.apply(this, args);

        const duration = Date.now() - startTime;
        logger.logServiceCall(serviceName, methodName, correlationId, undefined, duration);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(
          `Service error in ${serviceName}.${methodName}`,
          error as Error,
          {
            correlationId,
            service: serviceName,
            method: methodName,
            performance: { duration, unit: 'ms' as const },
          }
        );
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Helper to log service call manually
 */
export function logServiceCall(
  logger: Logger,
  serviceName: string,
  methodName: string,
  correlationId: string,
  params?: Record<string, unknown>
): void {
  logger.logServiceCall(serviceName, methodName, correlationId, params);
}

// ============================================================================
// Database Helpers
// ============================================================================

/**
 * Wraps a database operation with logging
 */
export async function withDatabaseLogging<T>(
  logger: Logger,
  operation: string,
  table: string,
  correlationId: string,
  operationFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await operationFn();
    const duration = Date.now() - startTime;
    
    logger.logDatabaseOperation(operation, table, correlationId, duration, {
      success: true,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.logDatabaseOperation(operation, table, correlationId, duration, {
      success: false,
      error: (error as Error).message,
    });

    throw error;
  }
}

// ============================================================================
// External API Helpers
// ============================================================================

/**
 * Wraps an external API call with logging
 */
export async function withExternalApiLogging<T>(
  logger: Logger,
  apiName: string,
  endpoint: string,
  method: string,
  correlationId: string,
  apiCallFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await apiCallFn();
    const duration = Date.now() - startTime;
    
    logger.logExternalApiCall(apiName, endpoint, method, correlationId, duration);

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.logExternalApiCall(
      apiName,
      endpoint,
      method,
      correlationId,
      duration,
      undefined,
      error as Error
    );

    throw error;
  }
}

// ============================================================================
// Context Helpers
// ============================================================================

/**
 * Extracts log context from Express request
 */
export function extractLogContext(req: Request): LogContext {
  return {
    correlationId: (req as Request & { correlationId?: string }).correlationId,
    userId: (req as Request & { userId?: string }).userId,
    userEmail: (req as Request & { user?: { email?: string } }).user?.email,
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'],
  };
}

/**
 * Creates a child logger context with additional metadata
 */
export function createChildContext(
  parentContext: LogContext,
  additionalContext: Record<string, unknown>
): LogContext {
  return {
    ...parentContext,
    ...additionalContext,
  };
}

