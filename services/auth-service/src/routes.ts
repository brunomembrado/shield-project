/**
 * Auth Service Routes - API v1
 * 
 * Defines HTTP routes and maps them to controller methods
 * 
 * API Versioning Strategy:
 * - Current version: v1 (all routes prefixed with /v1)
 * - Future version: v2 (will be implemented when breaking changes are needed)
 * 
 * Why versioning?
 * - Allows backward compatibility when introducing breaking changes
 * - Enables gradual migration for API consumers
 * - API consumers can upgrade by simply changing /v1 to /v2 in their requests
 * - Maintains stable contracts for existing integrations
 * 
 * @module auth-service/routes
 */

import { Router } from 'express';
import { DependencyContainer } from './infrastructure/dependencyInjection';
import { validateRequest } from '@shield/shared/middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from '@shield/shared/validation';

const router = Router();
const container = DependencyContainer.getInstance();
const authController = container.authController;

/**
 * ============================================================================
 * API v1 Routes
 * ============================================================================
 */

/**
 * @swagger
 * /v1/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Creates a new user account with email and password. Password must meet enterprise security requirements.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests (rate limited)
 */
router.post(
  '/register',
  validateRequest(registerSchema),
  (req, res) => authController.register(req, res)
);

/**
 * @swagger
 * /v1/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     description: Authenticates user with email and password, returns JWT tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests (rate limited)
 */
router.post(
  '/login',
  validateRequest(loginSchema),
  (req, res) => authController.login(req, res)
);

/**
 * @swagger
 * /v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Generates new access and refresh tokens using a valid refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/refresh',
  validateRequest(refreshTokenSchema),
  (req, res) => authController.refresh(req, res)
);

/**
 * @swagger
 * /v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout user
 *     description: Revokes refresh token and logs out user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutRequest'
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/logout',
  validateRequest(logoutSchema),
  (req, res) => authController.logout(req, res)
);

/**
 * ============================================================================
 * Future API v2 Implementation
 * ============================================================================
 * 
 * When implementing v2, create a new router and mount it at /v2/auth
 * Example:
 * 
 * const v2Router = Router();
 * // ... v2 routes with updated schemas/controllers
 * router.use('/v2', v2Router);
 * 
 * This allows API consumers to migrate gradually by changing:
 * POST /v1/auth/register -> POST /v2/auth/register
 * 
 * Benefits:
 * - Zero downtime migration
 * - A/B testing capabilities
 * - Gradual deprecation of v1
 */

export default router;
