/**
 * Application-Specific Error Classes
 * 
 * NASA-level robust error types for all application scenarios
 * 
 * @module @shield/shared/errors
 */

import { BaseError, ErrorContext } from './BaseError';

/**
 * Validation Error
 * Used when input validation fails
 */
export class ValidationError extends BaseError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, 'VALIDATION_ERROR', 400, context);
  }
}

/**
 * Authentication Error
 * Used when authentication fails
 */
export class AuthenticationError extends BaseError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, 'AUTHENTICATION_ERROR', 401, context);
  }
}

/**
 * Authorization Error
 * Used when user lacks permission
 */
export class AuthorizationError extends BaseError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, 'AUTHORIZATION_ERROR', 403, context);
  }
}

/**
 * Not Found Error
 * Used when resource doesn't exist
 */
export class NotFoundError extends BaseError {
  constructor(resource: string, identifier?: string, context: ErrorContext = {}) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND_ERROR', 404, { resource, identifier, ...context });
  }
}

/**
 * Conflict Error
 * Used when resource already exists or conflicts
 */
export class ConflictError extends BaseError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, 'CONFLICT_ERROR', 409, context);
  }
}

/**
 * Rate Limit Error
 * Used when rate limit is exceeded
 */
export class RateLimitError extends BaseError {
  constructor(message: string, retryAfter?: number, context: ErrorContext = {}) {
    super(message, 'RATE_LIMIT_ERROR', 429, { retryAfter, ...context });
  }
}

/**
 * Service Error
 * Used for general service-level errors
 */
export class ServiceError extends BaseError {
  constructor(message: string, statusCode = 500, context: ErrorContext = {}) {
    super(message, 'SERVICE_ERROR', statusCode, context);
  }
}

/**
 * Database Error
 * Used for database-related errors
 */
export class DatabaseError extends BaseError {
  constructor(message: string, operation?: string, context: ErrorContext = {}) {
    super(message, 'DATABASE_ERROR', 500, { operation, ...context }, false);
  }
}

/**
 * External Service Error
 * Used when external API calls fail
 */
export class ExternalServiceError extends BaseError {
  constructor(
    service: string,
    message: string,
    statusCode?: number,
    context: ErrorContext = {}
  ) {
    super(
      `External service '${service}' error: ${message}`,
      'EXTERNAL_SERVICE_ERROR',
      statusCode || 502,
      { service, ...context },
      false
    );
  }
}

/**
 * Network Error
 * Used for network-related errors
 */
export class NetworkError extends BaseError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, 'NETWORK_ERROR', 503, context, false);
  }
}

/**
 * Timeout Error
 * Used when operations timeout
 */
export class TimeoutError extends BaseError {
  constructor(operation: string, timeoutMs: number, context: ErrorContext = {}) {
    super(
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      'TIMEOUT_ERROR',
      504,
      { operation, timeoutMs, ...context },
      false
    );
  }
}

/**
 * Configuration Error
 * Used when configuration is invalid or missing
 */
export class ConfigurationError extends BaseError {
  constructor(setting: string, message?: string, context: ErrorContext = {}) {
    const errorMessage = message || `Configuration error: '${setting}' is invalid or missing`;
    super(errorMessage, 'CONFIGURATION_ERROR', 500, { setting, ...context }, false);
  }
}

/**
 * Business Logic Error
 * Used for domain/business rule violations
 */
export class BusinessLogicError extends BaseError {
  constructor(message: string, rule?: string, context: ErrorContext = {}) {
    super(message, 'BUSINESS_LOGIC_ERROR', 422, { rule, ...context });
  }
}

/**
 * Type guard to check if error is a BaseError
 */
export function isBaseError(error: unknown): error is BaseError {
  return error instanceof BaseError;
}

/**
 * Type guard to check if error is an operational error
 */
export function isOperationalError(error: unknown): error is BaseError {
  return isBaseError(error) && error.isOperational;
}

/**
 * Type guard to check if error is a non-operational error
 */
export function isNonOperationalError(error: unknown): error is BaseError {
  return isBaseError(error) && !error.isOperational;
}

