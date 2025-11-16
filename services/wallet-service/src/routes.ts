/**
 * Wallet Service Routes
 * 
 * Defines HTTP routes and maps them to controller methods
 * 
 * @module wallet-service/routes
 */

import { Router } from 'express';
import { DependencyContainer } from './infrastructure/dependencyInjection';
import { validateRequest, validateQuery, validateParams, authenticateToken } from '../../../shared/middleware';
import {
  createWalletSchema,
  updateWalletSchema,
  walletIdParamSchema,
  listWalletsQuerySchema,
} from '../../../shared/validation';

// All routes require authentication
router.use(authenticateToken);

// Routes
router.post(
  '/',
  validateRequest(createWalletSchema),
  (req, res) => walletController.createWallet(req, res)
);

router.get(
  '/',
  validateQuery(listWalletsQuerySchema),
  (req, res) => walletController.getUserWallets(req, res)
);

router.get(
  '/:id',
  validateParams(walletIdParamSchema),
  (req, res) => walletController.getWalletById(req, res)
);

router.put(
  '/:id',
  validateParams(walletIdParamSchema),
  validateRequest(updateWalletSchema),
  (req, res) => walletController.updateWallet(req, res)
);

router.delete(
  '/:id',
  validateParams(walletIdParamSchema),
  (req, res) => walletController.deleteWallet(req, res)
);

export default router;
