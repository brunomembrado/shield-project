/**
 * Validation Schemas for Auth Service
 * 
 * Defines Joi validation schemas for all authentication endpoints.
 * Uses enterprise-grade password validation with entropy checking.
 * 
 * @module auth-service/validation
 */

import Joi from 'joi';
import { 
  validatePassword, 
  ENTERPRISE_REQUIREMENTS 
} from '@shield/shared/security/passwordValidator';

/**
 * Schema for user registration
 * 
 * Validates:
 * - Email format and presence
 * - Password strength using enterprise requirements
 * - Entropy calculation
 * - Common password detection
 * 
 * @example
 * ```json
 * {
 *   "email": "user@example.com",
 *   "password": "SecureP@ss123!Complex"
 * }
 * ```
 */
export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .min(ENTERPRISE_REQUIREMENTS.minLength)
    .max(ENTERPRISE_REQUIREMENTS.maxLength)
    .required()
    .custom((value, helpers) => {
      // Use enterprise password validation
      const email = helpers.state.ancestors[0]?.email;
      const result = validatePassword(value, ENTERPRISE_REQUIREMENTS, { email });
      
      if (!result.isValid) {
        return helpers.error('any.invalid', { 
          message: result.errors.join('; '),
          details: {
            errors: result.errors,
            warnings: result.warnings,
            strength: result.strength,
            score: result.score,
            entropy: result.entropy,
          }
        });
      }
      
      // Log warnings but don't fail validation
      if (result.warnings.length > 0) {
        console.warn('⚠️ Password warnings:', result.warnings);
      }
      
      return value;
    })
    .messages({
      'string.min': `Password must be at least ${ENTERPRISE_REQUIREMENTS.minLength} characters long`,
      'string.max': `Password must not exceed ${ENTERPRISE_REQUIREMENTS.maxLength} characters`,
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
      'any.invalid': '{{#message}}',
    }),
});

/**
 * Schema for user login
 * 
 * Validates:
 * - Email format and presence
 * - Password presence
 * 
 * @example
 * ```json
 * {
 *   "email": "user@example.com",
 *   "password": "SecureP@ss123"
 * }
 * ```
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required',
    }),
});

/**
 * Schema for token refresh
 * 
 * Validates:
 * - Refresh token presence
 * 
 * @example
 * ```json
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * ```
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'string.empty': 'Refresh token is required',
      'any.required': 'Refresh token is required',
    }),
});

/**
 * Schema for logout
 * 
 * Validates:
 * - Refresh token presence (to revoke it)
 * 
 * @example
 * ```json
 * {
 *   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * ```
 */
export const logoutSchema = Joi.object({
  refreshToken: Joi.string()
    .required()
    .messages({
      'string.empty': 'Refresh token is required',
      'any.required': 'Refresh token is required',
    }),
});

