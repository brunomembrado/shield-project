/**
 * Wallet Service Joi Validation Schemas
 * 
 * NASA-level robust validation for wallet endpoints
 * 
 * @module @shield/shared/validation/walletSchemas
 */

import Joi from 'joi';
import { commonSchemas, idParamSchema } from './schemas';

/**
 * Create wallet schema
 */
export const createWalletSchema = Joi.object({
  tag: commonSchemas.optionalString(100),
  chain: commonSchemas.chainType,
  address: Joi.when('chain', {
    is: 'POLYGON',
    then: commonSchemas.ethereumAddress,
    otherwise: commonSchemas.tronAddress,
  }),
})
  .strict()
  .custom((value, helpers) => {
    // Cross-field validation: address format must match chain type
    if (value.chain === 'POLYGON' && !/^0x[a-fA-F0-9]{40}$/.test(value.address)) {
      return helpers.error('any.invalid', {
        message: 'Polygon addresses must start with 0x and be 40 hex characters',
      });
    }
    if (value.chain === 'TRON' && !/^T[A-Za-z1-9]{33}$/.test(value.address)) {
      return helpers.error('any.invalid', {
        message: 'Tron addresses must start with T and be 34 characters total',
      });
    }
    return value;
  });

/**
 * Update wallet schema
 */
export const updateWalletSchema = Joi.object({
  tag: commonSchemas.optionalString(100),
  isActive: commonSchemas.boolean.optional(),
})
  .min(1)
  .strict()
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

/**
 * Wallet ID parameter schema
 */
export const walletIdParamSchema = idParamSchema;

/**
 * List wallets query schema
 */
export const listWalletsQuerySchema = Joi.object({
  chain: commonSchemas.chainType.optional(),
  isActive: commonSchemas.boolean.optional(),
}).strict();

