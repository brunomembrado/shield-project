/**
 * Wallet Service Routes
 * 
 * Defines HTTP routes and maps them to controller methods
 * 
 * @module wallet-service/routes
 */

import { Router, type Request, type Response } from 'express';
import { DependencyContainer } from './infrastructure/dependencyInjection';
import { authenticate, validateRequest } from '@shield/shared/middleware';
import Joi from 'joi';
import type { AuthenticatedRequest } from '@shield/shared/middleware';

const router = Router();
const container = DependencyContainer.getInstance();
const walletController = container.walletController;

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
 * Apply authentication middleware to ALL wallet routes up-front.
 * This guarantees no route can be registered without JWT protection.
 */
router.use(authenticate);

/**
 * Validation Schemas
 */

// POST /wallets - Create wallet
const createWalletSchema = Joi.object({
  chain: Joi.string().valid('POLYGON', 'TRON').required().messages({
    'any.only': 'chain must be either POLYGON or TRON',
    'any.required': 'chain is required',
  }),
  address: Joi.string().min(26).max(66).required().messages({
    'string.min': 'address must be at least 26 characters long',
    'string.max': 'address must be at most 66 characters long',
    'any.required': 'address is required',
  }),
  tag: Joi.string().max(100).optional().messages({
    'string.max': 'tag must be at most 100 characters long',
  }),
});

// PUT /wallets/:id - Update wallet
const updateWalletSchema = Joi.object({
  tag: Joi.string().max(100).optional().messages({
    'string.max': 'tag must be at most 100 characters long',
  }),
  isActive: Joi.boolean().optional(),
}).min(1).messages({
  'object.min': 'At least one field (tag or isActive) must be provided',
});

// URL param validation
const walletIdParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'Wallet ID must be a valid UUID format',
    'string.uuid': 'Wallet ID must be a valid UUID format',
    'any.required': 'Wallet ID is required',
  }),
});

// Query params for list wallets
const listWalletsQuerySchema = Joi.object({
  chain: Joi.string().valid('POLYGON', 'TRON').optional().messages({
    'any.only': 'chain must be either POLYGON or TRON',
  }),
  isActive: Joi.boolean().truthy('true', '1').falsy('false', '0').optional(),
}).options({ stripUnknown: true });

// POST /wallets/generate - Generate wallet
const generateWalletSchema = Joi.object({
  chain: Joi.string().valid('POLYGON', 'TRON').required().messages({
    'any.only': 'Invalid chain type. Must be either POLYGON or TRON',
    'any.required': 'Chain is required for wallet generation',
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).max(100).required().messages({
    'string.min': 'Password must be at least 8 characters long for secure encryption',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    'string.max': 'Password must be at most 100 characters long',
    'any.required': 'Password is required to encrypt the private key',
  }),
  tag: Joi.string().max(100).optional().trim().replace(/<script.*?>.*?<\/script>/gi, '').messages({
    'string.max': 'Tag must be at most 100 characters long',
  }),
});

// POST /wallets/:id/reveal-key - Reveal private key
const revealPrivateKeySchema = Joi.object({
  password: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Password cannot be empty',
    'string.min': 'Password cannot be empty',
    'string.max': 'Password must be at most 100 characters long',
    'any.required': 'Password is required to decrypt the private key',
  }),
});

/**
 * Routes - All require authentication
 */

// Generate a new blockchain wallet (with encrypted private key storage)
router.post(
  '/generate',
  validateRequest(generateWalletSchema),
  withAuth((req, res) => walletController.generateWallet(req, res))
);

// Create a new wallet (import existing address)
router.post(
  '/',
  validateRequest(createWalletSchema),
  withAuth((req, res) => walletController.createWallet(req, res))
);

// Get all wallets for authenticated user
router.get(
  '/',
  validateRequest(listWalletsQuerySchema, 'query'),
  withAuth((req, res) => walletController.getUserWallets(req, res))
);

// Get a specific wallet by ID
router.get(
  '/:id',
  validateRequest(walletIdParamSchema, 'params'),
  withAuth((req, res) => walletController.getWalletById(req, res))
);

// Update a wallet
router.put(
  '/:id',
  validateRequest(walletIdParamSchema, 'params'),
  validateRequest(updateWalletSchema),
  withAuth((req, res) => walletController.updateWallet(req, res))
);

// Delete a wallet
router.delete(
  '/:id',
  validateRequest(walletIdParamSchema, 'params'),
  withAuth((req, res) => walletController.deleteWallet(req, res))
);

// Reveal private key (system-generated wallets only, requires password)
router.post(
  '/:id/reveal-key',
  validateRequest(walletIdParamSchema, 'params'),
  validateRequest(revealPrivateKeySchema),
  withAuth((req, res) => walletController.revealPrivateKey(req, res))
);

export default router;
