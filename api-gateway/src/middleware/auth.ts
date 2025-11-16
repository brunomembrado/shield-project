/**
 * Authentication Middleware for API Gateway
 * 
 * Validates JWT tokens for protected routes.
 * 
 * @module api-gateway/middleware/auth
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { publicRoutes } from '../config';

/**
 * Checks if a route is public (doesn't require authentication)
 */
function isPublicRoute(path: string): boolean {
  return publicRoutes.some(route => {
    if (route === path) return true;
    if (route.endsWith('*')) {
      const baseRoute = route.slice(0, -1);
      return path.startsWith(baseRoute);
    }
    return false;
  });
}

/**
 * Gateway authentication middleware
 * 
 * Validates JWT tokens and attaches user info to request headers
 * for downstream services.
 */
export function gatewayAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip authentication for public routes
  if (isPublicRoute(req.path)) {
    next();
    return;
  }

  // Extract token from Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Access token required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Verify token
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET not configured');
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Server configuration error',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Add user info to headers for downstream services
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-email'] = decoded.email;

    next();
  } catch (error) {
    res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
}

