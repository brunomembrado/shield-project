/**
 * Type Guards and Validation Utilities
 * 
 * Clean code helpers using is... functions instead of === null checks
 * 
 * @module @shield/shared/utils/guards
 */

/**
 * Checks if a value is not null and not undefined
 */
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Checks if a value is null or undefined
 */
export function isNull<T>(value: T | null | undefined): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Checks if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Checks if a value is an empty string
 */
export function isEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length === 0;
}

/**
 * Checks if a value is a valid email format
 */
export function isValidEmailFormat(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Checks if a value is a valid UUID
 */
export function isValidUUID(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Checks if a value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && value > 0 && !isNaN(value);
}

/**
 * Checks if a value is a non-negative number
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
}

/**
 * Checks if a value is a valid Date object
 */
export function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Checks if a date is expired (in the past)
 */
export function isExpiredDate(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Checks if a value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Checks if an object has a specific key
 */
export function hasKey<T extends Record<string, unknown>>(
  obj: T,
  key: string
): key is keyof T {
  return key in obj;
}

/**
 * Checks if an array is not empty
 */
export function isNonEmptyArray<T>(value: unknown): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Checks if an array is empty
 */
export function isEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length === 0;
}

/**
 * Checks if a value is a function
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * Checks if a value is a boolean
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Checks if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Checks if a value is an integer
 */
export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

