/**
 * Validation Schemas for Wallet Service
 * 
 * Defines Joi validation schemas for wallet management endpoints.
 * Ensures data integrity and proper format before processing.
 * 
 * @module wallet-service/validation
 */

import Joi from 'joi';
import { ChainType } from '../../../shared/types';

/**
 * Schema for creating a new wallet
 * 
 * Validates:
 * - Chain type (POLYGON or TRON)
 * - Address format based on chain
 * - Optional tag/label
 * 
 * @example
 * ```json
 * {
 *   "chain": "POLYGON",
 *   "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
 *   "tag": "Main Wallet"
 * }
 * ```
 */
export const createWalletSchema = Joi.object({
  tag: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Tag must not exceed 100 characters',
    }),
  
  chain: Joi.string()
    .valid(...Object.values(ChainType))
    .required()
    .messages({
      'any.only': 'Chain must be either POLYGON or TRON',
      'any.required': 'Chain is required',
    }),
  
  address: Joi.string()
    .required()
    .custom((value, helpers) => {
      const chain = helpers.state.ancestors[0].chain;
      
      // Validate based on chain type
      if (chain === ChainType.POLYGON) {
        // Ethereum address format: 0x followed by 40 hex characters
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
          return helpers.error('address.invalid.polygon');
        }
      } else if (chain === ChainType.TRON) {
        // Tron address format: T followed by 33 alphanumeric characters
        if (!/^T[a-zA-Z0-9]{33}$/.test(value)) {
          return helpers.error('address.invalid.tron');
        }
      }
      
      return value;
    })
    .messages({
      'address.invalid.polygon': 
        'Invalid Polygon address format. Must start with 0x followed by 40 hexadecimal characters',
      'address.invalid.tron': 
        'Invalid Tron address format. Must start with T followed by 33 alphanumeric characters',
      'any.required': 'Address is required',
    }),
});

/**
 * Schema for updating a wallet
 * 
 * Validates:
 * - Optional tag/label
 * - Optional chain type
 * - Optional address (with format validation)
 * - Optional isActive status
 * 
 * @example
 * ```json
 * {
 *   "tag": "Updated Wallet Name",
 *   "isActive": true
 * }
 * ```
 */
export const updateWalletSchema = Joi.object({
  tag: Joi.string()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Tag must not exceed 100 characters',
    }),
  
  chain: Joi.string()
    .valid(...Object.values(ChainType))
    .optional()
    .messages({
      'any.only': 'Chain must be either POLYGON or TRON',
    }),
  
  address: Joi.string()
    .optional()
    .custom((value, helpers) => {
      const chain = helpers.state.ancestors[0].chain;
      
      if (!chain) {
        // If chain is not provided, skip address validation
        return value;
      }
      
      // Validate based on chain type
      if (chain === ChainType.POLYGON) {
        if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
          return helpers.error('address.invalid.polygon');
        }
      } else if (chain === ChainType.TRON) {
        if (!/^T[a-zA-Z0-9]{33}$/.test(value)) {
          return helpers.error('address.invalid.tron');
        }
      }
      
      return value;
    })
    .messages({
      'address.invalid.polygon': 
        'Invalid Polygon address format. Must start with 0x followed by 40 hexadecimal characters',
      'address.invalid.tron': 
        'Invalid Tron address format. Must start with T followed by 33 alphanumeric characters',
    }),
  
  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean value',
    }),
}).min(1).messages({
  'object.min': 'At least one field must be provided for update',
});

/**
 * Schema for wallet ID path parameter
 * 
 * Validates:
 * - UUID v4 format
 * 
 * @example
 * ```json
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000"
 * }
 * ```
 */
export const walletIdSchema = Joi.object({
  id: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'Invalid wallet ID format. Must be a valid UUID',
      'any.required': 'Wallet ID is required',
    }),
});

/**
 * Schema for query parameters when listing wallets
 * 
 * Validates:
 * - Optional chain filter
 * - Optional isActive filter
 * 
 * @example
 * ```
 * GET /wallets?chain=POLYGON&isActive=true
 * ```
 */
export const listWalletsQuerySchema = Joi.object({
  chain: Joi.string()
    .valid(...Object.values(ChainType))
    .optional()
    .messages({
      'any.only': 'Chain must be either POLYGON or TRON',
    }),
  
  isActive: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'isActive must be a boolean value',
    }),
});

