/**
 * Blockchain Service Routes
 * 
 * Defines HTTP routes and maps them to controller methods
 * 
 * @module blockchain-service/routes
 */

import { Router } from 'express';
import { DependencyContainer } from './infrastructure/dependencyInjection';
import { validateRequest, validateParams, validateWithContext, authenticateToken } from '../../../shared/middleware';
import {
  chainParamSchema,
  transactionHashParamSchema,
  validateTransactionSchema,
  monitorTransfersSchema,
  commonSchemas,
} from '../../../shared/validation';
import Joi from 'joi';

const router = Router();
const container = DependencyContainer.getInstance();
const blockchainController = container.blockchainController;

// Routes
router.get(
  '/:chain/balance/:address',
  authenticateToken,
  validateParams(Joi.object({
    chain: commonSchemas.chainType,
    address: Joi.when('chain', {
      is: 'POLYGON',
      then: commonSchemas.ethereumAddress,
      otherwise: commonSchemas.tronAddress,
    }),
  })),
  (req, res) => blockchainController.getBalance(req, res)
);

router.get(
  '/:chain/transaction/:hash',
  authenticateToken,
  validateParams(Joi.object({
    chain: commonSchemas.chainType,
    hash: commonSchemas.transactionHash,
  })),
  (req, res) => blockchainController.getTransaction(req, res)
);

router.post(
  '/:chain/validate',
  authenticateToken,
  validateParams(chainParamSchema),
  validateWithContext(validateTransactionSchema, (req) => ({ chain: req.params.chain })),
  (req, res) => blockchainController.validateTransaction(req, res)
);

router.post(
  '/:chain/monitor',
  authenticateToken,
  validateParams(chainParamSchema),
  validateWithContext(monitorTransfersSchema, (req) => ({ chain: req.params.chain })),
  (req, res) => blockchainController.monitorTransfers(req, res)
);

router.get(
  '/:chain/status',
  authenticateToken,
  validateParams(chainParamSchema),
  (req, res) => blockchainController.getNetworkStatus(req, res)
);

export default router;
