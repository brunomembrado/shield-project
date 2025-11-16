/**
 * Blockchain Service Routes
 * 
 * Defines HTTP routes and maps them to controller methods
 * 
 * @module blockchain-service/routes
 */

import { Router, type Request, type Response } from 'express';
import { DependencyContainer } from './infrastructure/dependencyInjection';
import { authenticate, validateRequest } from '@shield/shared/middleware';
import Joi from 'joi';
import type { AuthenticatedRequest } from '@shield/shared/middleware';

const router = Router();
const container = DependencyContainer.getInstance();
const blockchainController = container.blockchainController;

/**
 * Helper to ensure Express passes AuthenticatedRequest to controller methods
 */
const withAuth =
  (
    handler: (req: AuthenticatedRequest, res: Response) => Promise<void> | void
  ) =>
    (req: Request, res: Response) => handler(req as AuthenticatedRequest, res);

/**
 * 🚨 Security Hardening
 * Apply authentication middleware to ALL blockchain routes up-front.
 */
router.use(authenticate);

/**
 * Validation Schemas
 */

// Common address validator that adapts to chain
const addressSchema = Joi.alternatives().try(
  Joi.string().pattern(/^0x[0-9a-fA-F]{40}$/),
  Joi.string().pattern(/^T[1-9A-HJ-NP-Za-km-z]{33}$/)
).required().messages({
  'alternatives.match': 'Invalid address format for the specified chain',
  'any.required': 'Address is required',
});

// Chain parameter schema
const chainParamSchema = Joi.object({
  chain: Joi.string().valid('POLYGON', 'TRON').required().messages({
    'any.only': 'Chain must be either POLYGON or TRON',
    'any.required': 'Chain parameter is required',
  }),
});

// Address parameter schema
const addressParamSchema = chainParamSchema.keys({
  address: addressSchema,
});

// Transaction hash parameter schema
const txHashParamSchema = chainParamSchema.keys({
  hash: Joi.alternatives().try(
    Joi.string().pattern(/^0x[0-9a-fA-F]{64}$/), // Polygon
    Joi.string().pattern(/^[0-9a-fA-F]{64}$/) // Tron
  ).required().messages({
    'alternatives.match': 'Invalid transaction hash format',
    'any.required': 'Transaction hash is required',
  }),
});

// Validate transaction body schema
const validateTransactionBodySchema = Joi.object({
  txHash: Joi.alternatives().try(
    Joi.string().pattern(/^0x[0-9a-fA-F]{64}$/),
    Joi.string().pattern(/^[0-9a-fA-F]{64}$/)
  ).required(),
  expectedToAddress: addressSchema,
});

// Monitor transfers body schema
const monitorTransfersBodySchema = Joi.object({
  toAddress: addressSchema,
  fromBlock: Joi.number().integer().min(0).optional().default(0),
  toBlock: Joi.number().integer().min(0).optional().default(0),
});

// Token balance query schema
const tokenBalanceQuerySchema = Joi.object({
  token: addressSchema.optional(),
});

// Gas estimation query schema
const gasEstimateQuerySchema = Joi.object({
  type: Joi.string()
    .valid('transfer_native', 'transfer_token', 'approve_token', 'swap')
    .optional()
    .default('transfer_token'),
});

/**
 * ============================================================================
 * EXISTING ROUTES (USDT Balance, Transactions, Validation)
 * ============================================================================
 */

// GET /:chain/balance/:address - Get USDT balance for an address
router.get(
  '/:chain/balance/:address',
  validateRequest(addressParamSchema, 'params'),
  withAuth((req, res) => blockchainController.getBalance(req, res))
);

// GET /:chain/transaction/:hash - Get transaction details
router.get(
  '/:chain/transaction/:hash',
  validateRequest(txHashParamSchema, 'params'),
  withAuth((req, res) => blockchainController.getTransaction(req, res))
);

// POST /:chain/validate - Validate a USDT transaction
router.post(
  '/:chain/validate',
  validateRequest(chainParamSchema, 'params'),
  validateRequest(validateTransactionBodySchema),
  withAuth((req, res) => blockchainController.validateTransaction(req, res))
);

// POST /:chain/monitor - Monitor USDT transfers to an address
router.post(
  '/:chain/monitor',
  validateRequest(chainParamSchema, 'params'),
  validateRequest(monitorTransfersBodySchema),
  withAuth((req, res) => blockchainController.monitorTransfers(req, res))
);

// GET /:chain/status - Get network status
router.get(
  '/:chain/status',
  validateRequest(chainParamSchema, 'params'),
  withAuth((req, res) => blockchainController.getNetworkStatus(req, res))
);

/**
 * ============================================================================
 * NEW ROUTES (Wallet Verification, Balance Cache, Gas Estimation)
 * ============================================================================
 */

// GET /:chain/verify/:address - Verify wallet exists on blockchain (DIRECT RPC)
router.get(
  '/:chain/verify/:address',
  validateRequest(addressParamSchema, 'params'),
  withAuth(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chain, address } = req.params;
      const useCase =
        chain === 'POLYGON'
          ? container.polygonVerifyWalletUseCase
          : container.tronVerifyWalletUseCase;

      const result = await useCase.execute(
        chain as 'POLYGON' | 'TRON',
        address,
        req.correlationId || ''
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Wallet verified successfully (direct blockchain call)',
      });
    } catch (error: unknown) {
      res.status((error as { statusCode?: number }).statusCode || 500).json({
        success: false,
        error: (error as Error).name,
        message: (error as Error).message,
      });
    }
  })
);

// GET /:chain/token-balance/:address - Get token balance (DIRECT RPC)
router.get(
  '/:chain/token-balance/:address',
  validateRequest(addressParamSchema, 'params'),
  validateRequest(tokenBalanceQuerySchema, 'query'),
  withAuth(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chain, address } = req.params;
      const { token } = req.query;

      // Default to USDT contract if not specified
      const tokenAddress =
        (token as string) ||
        (chain === 'POLYGON'
          ? process.env.POLYGON_USDT_ADDRESS!
          : process.env.TRON_USDT_ADDRESS!);

      const useCase =
        chain === 'POLYGON'
          ? container.polygonGetTokenBalanceUseCase
          : container.tronGetTokenBalanceUseCase;

      const result = await useCase.execute(
        chain as 'POLYGON' | 'TRON',
        address,
        tokenAddress,
        req.correlationId || ''
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Balance retrieved successfully (direct blockchain call)',
      });
    } catch (error: unknown) {
      res.status((error as { statusCode?: number }).statusCode || 500).json({
        success: false,
        error: (error as Error).name,
        message: (error as Error).message,
      });
    }
  })
);

// GET /:chain/gas-estimate - Estimate gas/energy cost (DIRECT RPC)
router.get(
  '/:chain/gas-estimate',
  validateRequest(chainParamSchema, 'params'),
  validateRequest(gasEstimateQuerySchema, 'query'),
  withAuth(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { chain } = req.params;
      const { type } = req.query;

      const useCase =
        chain === 'POLYGON'
          ? container.polygonEstimateGasUseCase
          : container.tronEstimateGasUseCase;

      const result = await useCase.execute(
        chain as 'POLYGON' | 'TRON',
        type as string,
        req.correlationId || ''
      );

      res.status(200).json({
        success: true,
        data: result,
        message: 'Gas estimate retrieved successfully (direct blockchain call)',
      });
    } catch (error: unknown) {
      res.status((error as { statusCode?: number }).statusCode || 500).json({
        success: false,
        error: (error as Error).name,
        message: (error as Error).message,
      });
    }
  })
);

/**
 * ============================================================================
 * UTILITY ROUTES
 * ============================================================================
 */

// GET /supported-chains - Get list of supported blockchain networks
router.get('/supported-chains', withAuth((req, res) => {
  res.status(200).json({
    success: true,
    data: {
      chains: [
        {
          name: 'POLYGON',
          displayName: 'Polygon',
          nativeToken: 'MATIC',
          usdtContract: process.env.POLYGON_USDT_ADDRESS,
        },
        {
          name: 'TRON',
          displayName: 'Tron',
          nativeToken: 'TRX',
          usdtContract: process.env.TRON_USDT_ADDRESS,
        },
      ],
    },
    message: 'Supported chains retrieved successfully',
  });
}));

export default router;
