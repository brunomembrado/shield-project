/**
 * Validation Schemas for Transaction Service
 */

import Joi from 'joi';
import { ChainType, TransactionStatus } from '../../../shared/types';

export const createTransactionSchema = Joi.object({
  walletId: Joi.string().uuid().required(),
  chain: Joi.string().valid(...Object.values(ChainType)).required(),
  amountUSDT: Joi.string().pattern(/^\d+(\.\d{1,6})?$/).required(),
  bankAccountName: Joi.string().min(1).max(200).required(),
  bankAccountNumber: Joi.string().min(1).max(50).required(),
  bankRoutingNumber: Joi.string().pattern(/^\d{9}$/).optional(),
});

export const updateTransactionStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(TransactionStatus)).required(),
  txHash: Joi.string().optional(),
  bankWireReference: Joi.string().optional(),
  notes: Joi.string().max(1000).optional(),
});

export const transactionIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

export const listTransactionsQuerySchema = Joi.object({
  chain: Joi.string().valid(...Object.values(ChainType)).optional(),
  status: Joi.string().valid(...Object.values(TransactionStatus)).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
});

