/**
 * Error Handler Utilities
 * 
 * NASA-level robust error handling utilities
 * 
 * @module @shield/shared/errors
 */

import { BaseError, ErrorContext } from './BaseError';
import { ValidationError, ServiceError, isBaseError, isOperationalError } from './ApplicationErrors';

/**
 * Error handler result
 */
export interface ErrorHandlerResult {
  readonly error: BaseError;
  readonly shouldLog: boolean;
  readonly shouldNotify: boolean;
}

/**
 * Handles unknown errors and converts them to typed errors
 * 
 * @param error - Unknown error to handle
 * @param defaultMessage - Default message if error is not a BaseError
 * @param context - Additional context
 * @returns Typed BaseError
 */
export function handleUnknownError(
  error: unknown,
  defaultMessage = 'An unexpected error occurred',
  context: ErrorContext = {}
): BaseError {
  // If it's already a BaseError, return it
  if (isBaseError(error)) {
    return error;
  }

  // If it's a standard Error, wrap it
  if (error instanceof Error) {
    return new ServiceError(
      error.message || defaultMessage,
      500,
      { originalError: error.name, stack: error.stack, ...context }
    );
  }

  // If it's a string, create error from it
  if (typeof error === 'string') {
    return new ServiceError(error, 500, context);
  }

  // Fallback for truly unknown errors
  return new ServiceError(
    defaultMessage,
    500,
    { errorType: typeof error, errorValue: String(error), ...context }
  );
}

/**
 * Validates error and ensures it's a BaseError
 * 
 * @param error - Error to validate
 * @param context - Additional context
 * @returns BaseError
 */
export function ensureBaseError(error: unknown, context: ErrorContext = {}): BaseError {
  if (isBaseError(error)) {
    return error;
  }

  return handleUnknownError(error, 'An unexpected error occurred', context);
}

/**
 * Determines if error should be logged
 * 
 * @param error - Error to check
 * @returns True if error should be logged
 */
export function shouldLogError(error: unknown): boolean {
  if (!isBaseError(error)) {
    return true; // Always log unknown errors
  }

  // Log all non-operational errors (system errors)
  if (!error.isOperational) {
    return true;
  }

  // Log operational errors with status >= 500
  return error.statusCode >= 500;
}

/**
 * Determines if error should trigger notifications (alerts, etc.)
 * 
 * @param error - Error to check
 * @returns True if error should trigger notifications
 */
export function shouldNotifyError(error: unknown): boolean {
  if (!isBaseError(error)) {
    return true; // Always notify on unknown errors
  }

  // Only notify on non-operational errors (system errors)
  return !error.isOperational;
}

/**
 * Gets error handler result
 * 
 * @param error - Error to handle
 * @param context - Additional context
 * @returns Error handler result
 */
export function getErrorHandlerResult(
  error: unknown,
  context: ErrorContext = {}
): ErrorHandlerResult {
  const baseError = ensureBaseError(error, context);

  return {
    error: baseError,
    shouldLog: shouldLogError(baseError),
    shouldNotify: shouldNotifyError(baseError),
  };
}

/**
 * Creates a validation error from validation details
 * 
 * @param field - Field that failed validation
 * @param message - Validation message
 * @param value - Invalid value
 * @param context - Additional context
 * @returns ValidationError
 */
export function createValidationError(
  field: string,
  message: string,
  value?: unknown,
  context: ErrorContext = {}
): ValidationError {
  return new ValidationError(message, {
    field,
    value,
    ...context,
  });
}

/**
 * Creates multiple validation errors
 * 
 * @param errors - Array of validation error details
 * @returns ValidationError with combined messages
 */
export function createMultipleValidationErrors(
  errors: Array<{ field: string; message: string; value?: unknown }>
): ValidationError {
  const messages = errors.map((e) => `${e.field}: ${e.message}`).join('; ');
  const context: ErrorContext = {
    errors: errors.map((e) => ({
      field: e.field,
      message: e.message,
      value: e.value,
    })),
  };

  return new ValidationError(`Validation failed: ${messages}`, context);
}

