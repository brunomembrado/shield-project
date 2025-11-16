/**
 * Error Module
 * 
 * Exports all error types and utilities
 * 
 * @module @shield/shared/errors
 */

// Base error class
export { BaseError, type ErrorContext } from './BaseError';

// Application-specific errors
export {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceError,
  DatabaseError,
  ExternalServiceError,
  NetworkError,
  TimeoutError,
  ConfigurationError,
  BusinessLogicError,
  isBaseError,
  isOperationalError,
  isNonOperationalError,
} from './ApplicationErrors';

// Error handler utilities
export {
  handleUnknownError,
  ensureBaseError,
  shouldLogError,
  shouldNotifyError,
  getErrorHandlerResult,
  createValidationError,
  createMultipleValidationErrors,
  type ErrorHandlerResult,
} from './ErrorHandler';

