/**
 * Auth Service Routes
 * 
 * Defines HTTP routes and maps them to controller methods
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

// Routes
router.post(
  '/register',
  validateRequest(registerSchema),
  (req, res) => authController.register(req, res)
);

router.post(
  '/login',
  validateRequest(loginSchema),
  (req, res) => authController.login(req, res)
);

router.post(
  '/refresh',
  validateRequest(refreshTokenSchema),
  (req, res) => authController.refresh(req, res)
);

router.post(
  '/logout',
  validateRequest(logoutSchema),
  (req, res) => authController.logout(req, res)
);

export default router;
