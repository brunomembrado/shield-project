/**
 * Shared Joi Validation Schemas
 * 
 * NASA-level robust validation schemas for common types
 * Used across all services for consistent validation
 * 
 * @module @shield/shared/validation
 */

import Joi from 'joi';

/**
 * Common validation patterns
 */
export const commonSchemas = {
  /**
   * UUID v4 validation
   */
  uuid: Joi.string().uuid({ version: 'uuidv4' }).required().messages({
    'string.guid': 'Must be a valid UUID',
    'any.required': 'UUID is required',
  }),

  /**
   * Email validation (strict)
   */
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .min(5)
    .max(254)
    .lowercase()
    .trim()
    .required()
    .messages({
      'string.email': 'Must be a valid email address',
      'string.min': 'Email must be at least 5 characters',
      'string.max': 'Email must not exceed 254 characters',
      'any.required': 'Email is required',
    }),

  /**
   * Strong password validation
   */
  password: Joi.string()
    .min(12)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 12 characters',
      'string.max': 'Password must not exceed 128 characters',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#)',
      'any.required': 'Password is required',
    }),

  /**
   * Blockchain address validation (Ethereum/Polygon format)
   */
  ethereumAddress: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required()
    .messages({
      'string.pattern.base': 'Must be a valid Ethereum/Polygon address (0x followed by 40 hex characters)',
      'any.required': 'Address is required',
    }),

  /**
   * Tron address validation
   */
  tronAddress: Joi.string()
    .pattern(/^T[A-Za-z1-9]{33}$/)
    .required()
    .messages({
      'string.pattern.base': 'Must be a valid Tron address (T followed by 33 alphanumeric characters)',
      'any.required': 'Address is required',
    }),

  /**
   * Chain type validation
   */
  chainType: Joi.string()
    .valid('POLYGON', 'TRON')
    .required()
    .messages({
      'any.only': 'Chain type must be either POLYGON or TRON',
      'any.required': 'Chain type is required',
    }),

  /**
   * Positive decimal number (for amounts)
   */
  positiveDecimal: Joi.string()
    .pattern(/^\d+(\.\d{1,18})?$/)
    .required()
    .messages({
      'string.pattern.base': 'Must be a positive decimal number',
      'any.required': 'Amount is required',
    }),

  /**
   * Transaction hash validation
   */
  transactionHash: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{64}$|^[a-fA-F0-9]{64}$/)
    .required()
    .messages({
      'string.pattern.base': 'Must be a valid transaction hash (64 hex characters)',
      'any.required': 'Transaction hash is required',
    }),

  /**
   * Non-empty string
   */
  nonEmptyString: (fieldName: string, minLength = 1, maxLength = 1000) =>
    Joi.string()
      .trim()
      .min(minLength)
      .max(maxLength)
      .required()
      .messages({
        'string.empty': `${fieldName} cannot be empty`,
        'string.min': `${fieldName} must be at least ${minLength} characters`,
        'string.max': `${fieldName} must not exceed ${maxLength} characters`,
        'any.required': `${fieldName} is required`,
      }),

  /**
   * Optional string
   */
  optionalString: (maxLength = 1000) =>
    Joi.string().trim().max(maxLength).allow(null, '').optional(),

  /**
   * ISO date string
   */
  isoDate: Joi.string()
    .isoDate()
    .required()
    .messages({
      'string.isoDate': 'Must be a valid ISO date string',
      'any.required': 'Date is required',
    }),

  /**
   * Positive integer
   */
  positiveInteger: Joi.number().integer().positive().required().messages({
    'number.base': 'Must be a number',
    'number.integer': 'Must be an integer',
    'number.positive': 'Must be a positive number',
    'any.required': 'Number is required',
  }),

  /**
   * Non-negative integer
   */
  nonNegativeInteger: Joi.number().integer().min(0).required().messages({
    'number.base': 'Must be a number',
    'number.integer': 'Must be an integer',
    'number.min': 'Must be a non-negative number',
    'any.required': 'Number is required',
  }),

  /**
   * Boolean
   */
  boolean: Joi.boolean().required().messages({
    'boolean.base': 'Must be a boolean value',
    'any.required': 'Boolean value is required',
  }),

  /**
   * Pagination limit
   */
  paginationLimit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100',
  }),

  /**
   * Pagination offset
   */
  paginationOffset: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'Offset must be a number',
    'number.integer': 'Offset must be an integer',
    'number.min': 'Offset must be non-negative',
  }),
};

/**
 * Wallet address validation based on chain type
 */
export const walletAddressSchema = Joi.object({
  chain: commonSchemas.chainType,
  address: Joi.when('chain', {
    is: 'POLYGON',
    then: commonSchemas.ethereumAddress,
    otherwise: commonSchemas.tronAddress,
  }),
});

/**
 * Pagination query parameters
 */
export const paginationQuerySchema = Joi.object({
  limit: commonSchemas.paginationLimit,
  offset: commonSchemas.paginationOffset,
});

/**
 * ID parameter schema
 */
export const idParamSchema = Joi.object({
  id: commonSchemas.uuid,
});

/**
 * Chain parameter schema
 */
export const chainParamSchema = Joi.object({
  chain: commonSchemas.chainType,
});

