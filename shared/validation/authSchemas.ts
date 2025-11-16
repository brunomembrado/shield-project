/**
 * Auth Service Joi Validation Schemas
 * 
 * NASA-level robust validation for authentication endpoints
 * 
 * @module @shield/shared/validation/authSchemas
 */

import Joi from 'joi';
import { commonSchemas } from './schemas';

/**
 * User registration schema
 */
export const registerSchema = Joi.object({
  email: commonSchemas.email,
  password: commonSchemas.password,
}).strict(); // Reject unknown fields

/**
 * User login schema
 */
export const loginSchema = Joi.object({
  email: commonSchemas.email,
  password: Joi.string().min(1).required().messages({
    'string.empty': 'Password cannot be empty',
    'any.required': 'Password is required',
  }),
}).strict();

/**
 * Refresh token schema
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.empty': 'Refresh token cannot be empty',
      'string.min': 'Invalid refresh token format',
      'any.required': 'Refresh token is required',
    }),
}).strict();

/**
 * Logout schema
 */
export const logoutSchema = Joi.object({
  refreshToken: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.empty': 'Refresh token cannot be empty',
      'string.min': 'Invalid refresh token format',
      'any.required': 'Refresh token is required',
    }),
}).strict();

