/**
 * Transaction Service Routes
 * 
 * Defines HTTP routes and maps them to controller methods
 * 
 * @module transaction-service/routes
 */

import { Router } from 'express';
import { DependencyContainer } from './infrastructure/dependencyInjection';
import { validateRequest, validateQuery, validateParams, authenticateToken } from '../../../shared/middleware';
import {
  createTransactionSchema,
  updateTransactionStatusSchema,
  transactionIdParamSchema,
  listTransactionsQuerySchema,
} from '../../../shared/validation';

// All routes require authentication
router.use(authenticateToken);

// Routes
router.post(
  '/',
  validateRequest(createTransactionSchema),
  (req, res) => transactionController.createTransaction(req, res)
);

router.get(
  '/',
  validateQuery(listTransactionsQuerySchema),
  (req, res) => transactionController.getUserTransactions(req, res)
);

router.get(
  '/:id',
  validateParams(transactionIdParamSchema),
  (req, res) => transactionController.getTransactionById(req, res)
);

router.put(
  '/:id/status',
  validateParams(transactionIdParamSchema),
  validateRequest(updateTransactionStatusSchema),
  (req, res) => transactionController.updateTransactionStatus(req, res)
);

export default router;
