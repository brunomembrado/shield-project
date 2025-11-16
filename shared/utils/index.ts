/**
 * Shared utility functions for Shield microservices platform
 * 
 * This file contains reusable helper functions used across all services.
 * 
 * @module @shield/shared/utils
 */

import { ApiResponse, ApiErrorResponse, ValidationErrorResponse } from '../types';

// Re-export guards for convenience
export * from './guards';

// ============================================================================
// Response Builders
// ============================================================================

/**
 * Creates a standardized success response
 * 
 * @param data - The data to include in the response
 * @param message - Optional success message
 * @returns Standardized API success response
 * 
 * @example
 * ```typescript
 * const response = createSuccessResponse({ id: '123', name: 'John' }, 'User created');
 * res.status(200).json(response);
 * ```
 */
export function createSuccessResponse<T>(
  data?: T,
  message?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a standardized error response
 * 
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param path - Optional request path
 * @param details - Optional additional error details
 * @returns Standardized API error response
 * 
 * @example
 * ```typescript
 * const response = createErrorResponse('User not found', 404, '/api/users/123');
 * res.status(404).json(response);
 * ```
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  path?: string,
  details?: Record<string, unknown>
): ApiErrorResponse {
  return {
    success: false,
    error: getErrorCodeFromStatus(statusCode),
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    path,
    details,
  };
}

/**
 * Creates a validation error response
 * 
 * @param errors - Array of validation errors
 * @returns Standardized validation error response
 * 
 * @example
 * ```typescript
 * const response = createValidationErrorResponse([
 *   { field: 'email', message: 'Invalid email format' }
 * ]);
 * res.status(400).json(response);
 * ```
 */
export function createValidationErrorResponse(
  errors: Array<{ field: string; message: string }>
): ValidationErrorResponse {
  return {
    success: false,
    message: 'Validation failed',
    errors,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Gets error code name from HTTP status code
 * 
 * @param statusCode - HTTP status code
 * @returns Error code string
 */
function getErrorCodeFromStatus(statusCode: number): string {
  const codes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'TOO_MANY_REQUESTS',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
  };
  
  return codes[statusCode] || 'UNKNOWN_ERROR';
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates if a string is a valid email address
 * 
 * @param email - Email address to validate
 * @returns True if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates if a string is a valid Ethereum address (used for Polygon)
 * 
 * @param address - Ethereum address to validate
 * @returns True if valid, false otherwise
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validates if a string is a valid Tron address
 * 
 * @param address - Tron address to validate
 * @returns True if valid, false otherwise
 */
export function isValidTronAddress(address: string): boolean {
  return /^T[a-zA-Z0-9]{33}$/.test(address);
}

/**
 * Validates if a string is a valid blockchain transaction hash
 * 
 * @param hash - Transaction hash to validate
 * @returns True if valid, false otherwise
 */
export function isValidTxHash(hash: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
}

/**
 * Validates if a string is a valid UUID v4
 * 
 * @param uuid - UUID to validate
 * @returns True if valid, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Masks sensitive data for logging (e.g., wallet addresses, emails)
 * 
 * @param value - Value to mask
 * @param visibleChars - Number of characters to show at start and end
 * @returns Masked string
 * 
 * @example
 * ```typescript
 * maskSensitiveData('0x1234567890abcdef', 6) // '0x1234...cdef'
 * ```
 */
export function maskSensitiveData(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars * 2) {
    return value;
  }
  
  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  return `${start}...${end}`;
}

/**
 * Generates a random reference ID for transactions
 * 
 * @param prefix - Optional prefix for the reference
 * @returns Random reference ID
 * 
 * @example
 * ```typescript
 * generateReferenceId('TXN') // 'TXN-1234567890'
 * ```
 */
export function generateReferenceId(prefix: string = 'REF'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}`;
}

// ============================================================================
// Number Utilities
// ============================================================================

/**
 * Converts wei (smallest unit) to token amount with decimals
 * 
 * @param weiAmount - Amount in wei (as string to maintain precision)
 * @param decimals - Number of decimals for the token (default: 6 for USDT)
 * @returns Token amount as string
 * 
 * @example
 * ```typescript
 * weiToToken('1000000', 6) // '1.000000'
 * ```
 */
export function weiToToken(weiAmount: string, decimals: number = 6): string {
  const divisor = Math.pow(10, decimals);
  const amount = parseFloat(weiAmount) / divisor;
  return amount.toFixed(decimals);
}

/**
 * Converts token amount to wei (smallest unit)
 * 
 * @param tokenAmount - Token amount (as string or number)
 * @param decimals - Number of decimals for the token (default: 6 for USDT)
 * @returns Wei amount as string
 * 
 * @example
 * ```typescript
 * tokenToWei('1.5', 6) // '1500000'
 * ```
 */
export function tokenToWei(tokenAmount: string | number, decimals: number = 6): string {
  const multiplier = Math.pow(10, decimals);
  const amount = typeof tokenAmount === 'string' ? parseFloat(tokenAmount) : tokenAmount;
  return Math.floor(amount * multiplier).toString();
}

/**
 * Calculates service fee based on transaction amount
 * 
 * @param amount - Transaction amount
 * @param feePercentage - Fee percentage (default: 1%)
 * @returns Fee amount
 * 
 * @example
 * ```typescript
 * calculateServiceFee('1000', 1) // '10'
 * ```
 */
export function calculateServiceFee(amount: string, feePercentage: number = 1): string {
  const amountNum = parseFloat(amount);
  const fee = (amountNum * feePercentage) / 100;
  return fee.toFixed(2);
}

/**
 * Calculates net amount after deducting fee
 * 
 * @param amount - Gross amount
 * @param fee - Fee amount
 * @returns Net amount
 */
export function calculateNetAmount(amount: string, fee: string): string {
  const amountNum = parseFloat(amount);
  const feeNum = parseFloat(fee);
  return (amountNum - feeNum).toFixed(2);
}

// ============================================================================
// Date Utilities
// ============================================================================

/**
 * Checks if a date is expired
 * 
 * @param date - Date to check
 * @returns True if expired, false otherwise
 */
export function isExpired(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Adds specified number of days to a date
 * 
 * @param date - Base date
 * @param days - Number of days to add
 * @returns New date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Formats a date to ISO string
 * 
 * @param date - Date to format
 * @returns ISO string
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

// ============================================================================
// Async Utilities
// ============================================================================

/**
 * Delays execution for specified milliseconds
 * 
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 * 
 * @example
 * ```typescript
 * await delay(1000); // Wait 1 second
 * ```
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an async function with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries
 * @param delayMs - Initial delay in milliseconds
 * @returns Promise with function result
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(() => fetchData(), 3, 1000);
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        const backoffDelay = delayMs * Math.pow(2, i);
        await delay(backoffDelay);
      }
    }
  }
  
  throw lastError!;
}

// ============================================================================
// Object Utilities
// ============================================================================

/**
 * Deep clones an object
 * 
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Omits specified keys from an object
 * 
 * @param obj - Source object
 * @param keys - Keys to omit
 * @returns New object without specified keys
 * 
 * @example
 * ```typescript
 * const user = { id: '1', name: 'John', password: 'secret' };
 * const safeUser = omit(user, ['password']); // { id: '1', name: 'John' }
 * ```
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

/**
 * Picks specified keys from an object
 * 
 * @param obj - Source object
 * @param keys - Keys to pick
 * @returns New object with only specified keys
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

