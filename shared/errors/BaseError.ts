/**
 * Base Error Class
 * 
 * NASA-level robust error handling with strong typing
 * All application errors extend from this base class
 * 
 * @module @shield/shared/errors
 */

/**
 * Error context for additional debugging information
 */
export interface ErrorContext {
  readonly [key: string]: unknown;
}

/**
 * Base error class for all application errors
 * 
 * Provides:
 * - Strong typing
 * - Error codes
 * - Context information
 * - Stack traces
 * - HTTP status codes
 */
export class BaseError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number,
    context: ErrorContext = {},
    isOperational = true
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.context = Object.freeze(context);
    this.timestamp = new Date();
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts error to JSON for logging/API responses
   */
  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

