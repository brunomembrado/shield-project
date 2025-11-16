/**
 * Transaction Service Joi Validation Schemas
 * 
 * NASA-level robust validation for transaction endpoints
 * 
 * @module @shield/shared/validation/transactionSchemas
 */

import Joi from 'joi';
import { commonSchemas, idParamSchema, paginationQuerySchema } from './schemas';

/**
 * Transaction status enum validation
 */
const transactionStatusSchema = Joi.string()
  .valid(
    'PENDING',
    'PAYMENT_RECEIVED',
    'VALIDATING',
    'COMPLIANCE_CHECK',
    'APPROVED',
    'WIRE_SUBMITTED',
    'WIRE_PROCESSED',
    'FAILED',
    'REJECTED'
  )
  .required()
  .messages({
    'any.only': 'Status must be one of: PENDING, PAYMENT_RECEIVED, VALIDATING, COMPLIANCE_CHECK, APPROVED, WIRE_SUBMITTED, WIRE_PROCESSED, FAILED, REJECTED',
    'any.required': 'Status is required',
  });

/**
 * Create transaction schema
 */
export const createTransactionSchema = Joi.object({
  walletId: commonSchemas.uuid,
  chain: commonSchemas.chainType,
  amountUSDT: commonSchemas.positiveDecimal.custom((value, helpers) => {
    const amount = parseFloat(value);
    if (isNaN(amount) || amount <= 0) {
      return helpers.error('any.invalid', { message: 'Amount must be a positive number' });
    }
    if (amount > 1000000) {
      return helpers.error('any.invalid', { message: 'Amount exceeds maximum limit of 1,000,000 USDT' });
    }
    return value;
  }),
  bankAccountName: commonSchemas.nonEmptyString('Bank account name', 2, 100),
  bankAccountNumber: commonSchemas.nonEmptyString('Bank account number', 5, 34)
    .pattern(/^[A-Z0-9]+$/)
    .messages({
      'string.pattern.base': 'Bank account number must contain only alphanumeric characters',
    }),
  bankRoutingNumber: commonSchemas.optionalString(20)
    .pattern(/^[0-9]{9}$/)
    .messages({
      'string.pattern.base': 'Routing number must be exactly 9 digits',
    }),
})
  .strict()
  .custom((value, helpers) => {
    // Validate amount precision
    const amountParts = value.amountUSDT.split('.');
    if (amountParts.length === 2 && amountParts[1].length > 18) {
      return helpers.error('any.invalid', {
        message: 'Amount USDT cannot have more than 18 decimal places',
      });
    }
    return value;
  });

/**
 * Update transaction status schema
 */
export const updateTransactionStatusSchema = Joi.object({
  status: transactionStatusSchema,
  txHash: commonSchemas.transactionHash.optional(),
  fromAddress: Joi.when('txHash', {
    is: Joi.exist(),
    then: Joi.when('$chain', {
      is: 'POLYGON',
      then: commonSchemas.ethereumAddress,
      otherwise: commonSchemas.tronAddress,
    }),
    otherwise: Joi.optional(),
  }),
  notes: commonSchemas.optionalString(1000),
})
  .strict()
  .min(1)
  .messages({
    'object.min': 'At least status must be provided',
  });

/**
 * Transaction ID parameter schema
 */
export const transactionIdParamSchema = idParamSchema;

/**
 * List transactions query schema
 */
export const listTransactionsQuerySchema = paginationQuerySchema.keys({
  chain: commonSchemas.chainType.optional(),
  status: transactionStatusSchema.optional(),
}).strict();

