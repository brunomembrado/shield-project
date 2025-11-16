/**
 * Compliance Service Routes
 * 
 * Defines HTTP routes and maps them to controller methods
 * 
 * @module compliance-service/routes
 */

import { Router } from 'express';
import { DependencyContainer } from './infrastructure/dependencyInjection';
import { validateRequest, validateParams, authenticateToken } from '../../../shared/middleware';
import {
  kycSchema,
  kybSchema,
  screenWalletSchema,
  screenTransactionSchema,
  reviewComplianceCheckSchema,
  complianceCheckIdParamSchema,
} from '../../../shared/validation';

const router = Router();
const container = DependencyContainer.getInstance();
const complianceController = container.complianceController;

// Routes requiring authentication
router.post(
  '/kyc',
  authenticateToken,
  validateRequest(kycSchema),
  (req, res) => complianceController.performKYC(req, res)
);

router.post(
  '/kyb',
  authenticateToken,
  validateRequest(kybSchema),
  (req, res) => complianceController.performKYB(req, res)
);

router.post(
  '/screen/wallet',
  validateRequest(screenWalletSchema),
  (req, res) => complianceController.screenWallet(req, res)
);

router.post(
  '/screen/transaction',
  validateRequest(screenTransactionSchema),
  (req, res) => complianceController.screenTransaction(req, res)
);

router.get(
  '/status/:id',
  validateParams(complianceCheckIdParamSchema),
  (req, res) => complianceController.getComplianceStatus(req, res)
);

router.post(
  '/review/:id',
  authenticateToken,
  validateParams(complianceCheckIdParamSchema),
  validateRequest(reviewComplianceCheckSchema),
  (req, res) => complianceController.reviewComplianceCheck(req, res)
);

export default router;
