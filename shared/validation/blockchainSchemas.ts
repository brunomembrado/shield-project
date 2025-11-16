/**
 * Blockchain Service Joi Validation Schemas
 * 
 * NASA-level robust validation for blockchain endpoints
 * 
 * @module @shield/shared/validation/blockchainSchemas
 */

import Joi from 'joi';
import { commonSchemas } from './schemas';

/**
 * Chain parameter schema
 */
export const chainParamSchema = Joi.object({
  chain: commonSchemas.chainType,
});

/**
 * Address parameter schema
 */
export const addressParamSchema = Joi.object({
  address: Joi.when('$chain', {
    is: 'POLYGON',
    then: commonSchemas.ethereumAddress,
    otherwise: commonSchemas.tronAddress,
  }),
});

/**
 * Transaction hash parameter schema
 */
export const transactionHashParamSchema = Joi.object({
  hash: commonSchemas.transactionHash,
});

/**
 * Validate transaction schema
 */
export const validateTransactionSchema = Joi.object({
  txHash: commonSchemas.transactionHash,
  expectedToAddress: Joi.when('$chain', {
    is: 'POLYGON',
    then: commonSchemas.ethereumAddress,
    otherwise: commonSchemas.tronAddress,
  }),
})
  .strict()
  .custom((value, helpers) => {
    // Ensure addresses match chain type
    const chain = helpers.prefs.context?.chain;
    if (chain === 'POLYGON' && !/^0x[a-fA-F0-9]{40}$/.test(value.expectedToAddress)) {
      return helpers.error('any.invalid', {
        message: 'Expected to address must be a valid Polygon address',
      });
    }
    if (chain === 'TRON' && !/^T[A-Za-z1-9]{33}$/.test(value.expectedToAddress)) {
      return helpers.error('any.invalid', {
        message: 'Expected to address must be a valid Tron address',
      });
    }
    return value;
  });

/**
 * Monitor transfers schema
 */
export const monitorTransfersSchema = Joi.object({
  toAddress: Joi.when('$chain', {
    is: 'POLYGON',
    then: commonSchemas.ethereumAddress,
    otherwise: commonSchemas.tronAddress,
  }),
  fromBlock: commonSchemas.nonNegativeInteger.optional(),
  toBlock: commonSchemas.nonNegativeInteger.optional(),
})
  .strict()
  .custom((value, helpers) => {
    // Validate block range
    if (value.fromBlock !== undefined && value.toBlock !== undefined) {
      if (value.toBlock < value.fromBlock) {
        return helpers.error('any.invalid', {
          message: 'To block must be greater than or equal to from block',
        });
      }
      // Prevent querying too many blocks at once
      const blockRange = value.toBlock - value.fromBlock;
      if (blockRange > 10000) {
        return helpers.error('any.invalid', {
          message: 'Block range cannot exceed 10,000 blocks',
        });
      }
    }
    return value;
  });

