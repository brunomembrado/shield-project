/**
 * Shared middleware functions for Shield microservices platform
 * 
 * This file contains reusable Express middleware used across all services.
 * 
 * @module @shield/shared/middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { Schema } from 'joi';
import {
  JWTPayload,
  logError,
} from '../types';
import {
  BaseError,
  ensureBaseError,
  shouldLogError,
  AuthenticationError,
  AuthorizationError,
} from '../errors';
import { createErrorResponse, createValidationErrorResponse } from '../utils';

// ============================================================================
// Request Extension
// ============================================================================

/**
 * Extends Express Request interface to include custom properties
 */
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      userId?: string;
    }
  }
}

// ============================================================================
// Authentication Middleware
// ============================================================================
// See auth.ts for robust JWT authentication middleware

// ============================================================================
// Error Handling Middleware
// ============================================================================

/**
 * Global error handler middleware
 * 
 * Catches all errors thrown in route handlers and formats them consistently.
 * Uses NASA-level robust error handling with strong typing.
 * Should be placed after all route definitions.
 * 
 * @param error - Error object (unknown type for strong typing)
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * 
 * @example
 * ```typescript
 * app.use(routes);
 * app.use(errorHandler); // Place at the end
 * ```
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Convert to BaseError with strong typing
  const baseError = ensureBaseError(error, {
    method: req.method,
    url: req.url,
    path: req.path,
    userId: req.userId,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Log error only if needed
  if (shouldLogError(baseError)) {
    console.error('[ERROR]', JSON.stringify({
      name: baseError.name,
      message: baseError.message,
      code: baseError.code,
      statusCode: baseError.statusCode,
      context: baseError.context,
      stack: baseError.stack,
      timestamp: baseError.timestamp.toISOString(),
      isOperational: baseError.isOperational,
    }, null, 2));
  }

  // Send error response with full error details
  res.status(baseError.statusCode).json(
    createErrorResponse(
      baseError.message,
      baseError.statusCode,
      req.path,
      {
        code: baseError.code,
        context: baseError.context,
      }
    )
  );

  next();
}

// ============================================================================
// Validation Middleware
// ============================================================================

/**
 * Creates validation middleware from Joi schema
 * 
 * Validates request body, query, or params against provided Joi schema.
 * Returns 400 with validation errors if validation fails.
 * 
 * @param schema - Joi validation schema
 * @param target - What to validate: 'body', 'query', or 'params' (default: 'body')
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * import Joi from 'joi';
 * 
 * const createWalletSchema = Joi.object({
 *   address: Joi.string().required(),
 *   chain: Joi.string().valid('POLYGON', 'TRON').required()
 * });
 * 
 * router.post('/wallets', validateRequest(createWalletSchema), createWallet);
 * router.get('/wallets', validateRequest(querySchema, 'query'), getWallets);
 * router.get('/wallets/:id', validateRequest(paramsSchema, 'params'), getWallet);
 * ```
 */
export function validateRequest(schema: Schema, target: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = req[target];
    
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
      convert: true, // Convert types when possible
    });

    if (error) {
      // Format validation errors
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''), // Remove quotes from messages
        value: detail.context?.value,
      }));

      res.status(400).json(createValidationErrorResponse(validationErrors));
      return;
    }

    // Replace req[target] with validated and sanitized value
    // Note: In Express 5, req.query is read-only, so we skip assignment for 'query'
    if (target !== 'query') {
      (req as any)[target] = value;
    }
    next();
  };
}

/**
 * Validates request query parameters
 * 
 * @param schema - Joi validation schema for query params
 * @returns Express middleware function
 */
export function validateQuery(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
        value: detail.context?.value,
      }));

      res.status(400).json(createValidationErrorResponse(validationErrors));
      return;
    }

    req.query = value as typeof req.query;
    next();
  };
}

/**
 * Validates request path parameters
 * 
 * @param schema - Joi validation schema for path params
 * @returns Express middleware function
 */
export function validateParams(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
        value: detail.context?.value,
      }));

      res.status(400).json(createValidationErrorResponse(validationErrors));
      return;
    }

    req.params = value as typeof req.params;
    next();
  };
}

/**
 * Validates request with context (for conditional validation)
 * 
 * @param schema - Joi validation schema
 * @param getContext - Function to get validation context
 * @returns Express middleware function
 */
export function validateWithContext(
  schema: Schema,
  getContext: (req: Request) => Record<string, unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const context = getContext(req);
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
      context,
    });

    if (error) {
      const validationErrors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
        value: detail.context?.value,
      }));

      res.status(400).json(createValidationErrorResponse(validationErrors));
      return;
    }

    req.body = value;
    next();
  };
}

// ============================================================================
// Async Handler Wrapper
// ============================================================================

/**
 * Wraps async route handlers to catch promise rejections
 * 
 * Eliminates need for try-catch blocks in async route handlers.
 * Automatically passes errors to error handling middleware.
 * 
 * @param fn - Async route handler function
 * @returns Wrapped function
 * 
 * @example
 * ```typescript
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.findAll();
 *   res.json(createSuccessResponse(users));
 * }));
 * ```
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================================================
// CORS Configuration
// ============================================================================

/**
 * Returns CORS options from environment variables
 * 
 * @returns CORS configuration object
 */
export function corsOptions() {
  return {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-User-Id',
      'X-User-Email',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Size'],
    maxAge: 86400, // 24 hours
  };
}

// ============================================================================
// Health Check Middleware
// ============================================================================

/**
 * Health check endpoint handler
 * 
 * Returns service health status with uptime and timestamp.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * 
 * @example
 * ```typescript
 * app.get('/health', healthCheck);
 * ```
 */
export function healthCheck(req: Request, res: Response): void {
  const healthInfo = {
    status: 'ok',
    service: process.env.SERVICE_NAME || 'shield-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };

  res.status(200).json(healthInfo);
}

// ============================================================================
// Rate Limiting Helper
// ============================================================================

/**
 * Creates a simple in-memory rate limiter
 * 
 * @param windowMs - Time window in milliseconds
 * @param maxRequests - Maximum requests per window
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * app.use('/api', rateLimiter(15 * 60 * 1000, 100)); // 100 requests per 15 minutes
 * ```
 * 
 * Note: For production, use a proper rate limiting solution like express-rate-limit
 * with Redis backend for distributed rate limiting.
 */
export function rateLimiter(windowMs: number, maxRequests: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Clean up expired entries periodically
    if (Math.random() < 0.01) {
      for (const [key, value] of requests.entries()) {
        if (now > value.resetTime) {
          requests.delete(key);
        }
      }
    }

    const record = requests.get(identifier);

    if (!record || now > record.resetTime) {
      // New window
      requests.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      next();
      return;
    }

    if (record.count >= maxRequests) {
      res.status(429).json(
        createErrorResponse(
          'Too many requests, please try again later',
          429,
          req.path
        )
      );
      return;
    }

    record.count++;
    next();
  };
}

// ============================================================================
// Request Logging Middleware
// ============================================================================

/**
 * Logs incoming requests with details
 * 
 * @deprecated Use Logger.requestTrackingMiddleware() instead for advanced logging
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * 
 * @example
 * ```typescript
 * app.use(requestLogger);
 * ```
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // Log after response is sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logEntry = {
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      userId: req.userId,
      timestamp: new Date().toISOString(),
    };

    // In production, send to logging service
    console.log('[REQUEST]', JSON.stringify(logEntry));
  });

  next();
}

// ============================================================================
// Service Availability Middleware
// ============================================================================

/**
 * Checks if required services are available
 * 
 * @param serviceName - Name of the service to check
 * @returns Express middleware function
 */
export function requireService(serviceName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const serviceUrl = process.env[`${serviceName.toUpperCase()}_SERVICE_URL`];
    
    if (!serviceUrl) {
      res.status(503).json(
        createErrorResponse(
          `${serviceName} service is not available`,
          503,
          req.path
        )
      );
      return;
    }

    next();
  };
}

// ============================================================================
// Security Middleware
// ============================================================================

export { setupSecurityHeaders } from './security';
export { authenticate, optionalAuth, type AuthenticatedRequest } from './auth';

// Legacy alias for backward compatibility
export { authenticate as authenticateToken } from './auth';

