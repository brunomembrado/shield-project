import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticationError, AuthorizationError, ensureBaseError, shouldLogError } from '../errors';
import { logError } from '../types';

/**
 * Extended Express Request with authenticated user information
 */
export interface AuthenticatedRequest extends Omit<Request, 'user'> {
  user?: {
    userId: string;
    email: string;
    iat: number;
    exp: number;
  };
}

/**
 * JWT Payload structure from auth-service
 */
interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware that verifies JWT tokens
 * 
 * This middleware:
 * 1. Extracts the Bearer token from the Authorization header
 * 2. Verifies the token using the JWT_SECRET (shared with auth-service)
 * 3. Attaches the decoded user information to req.user
 * 4. Throws AuthenticationError if token is missing or invalid
 * 
 * @example
 * router.get('/wallets', authenticate, walletController.getWallets);
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AuthenticationError('No authentication token provided', {
        path: req.path,
        method: req.method,
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Invalid authentication format. Expected: Bearer <token>', {
        path: req.path,
        method: req.method,
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      throw new AuthenticationError('Authentication token is empty', {
        path: req.path,
        method: req.method,
      });
    }

    // Get JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    // DEBUG: Log JWT secret length for verification
    console.log(`[DEBUG] JWT_SECRET length: ${jwtSecret.length}, First 20 chars: ${jwtSecret.substring(0, 20)}...`);

    // Verify token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (error: unknown) {
      const err = error as Error;
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationError('Authentication token has expired', {
          path: req.path,
          method: req.method,
          expiredAt: (err as any).expiredAt,
        });
      } else if (err.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid authentication token', {
          path: req.path,
          method: req.method,
          reason: err.message,
        });
      } else {
        throw new AuthenticationError('Token verification failed', {
          path: req.path,
          method: req.method,
          reason: err.message,
        });
      }
    }

    // Validate decoded payload
    if (!decoded.userId || !decoded.email) {
      throw new AuthenticationError('Invalid token payload', {
        path: req.path,
        method: req.method,
      });
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      userId: decoded.userId,
      email: decoded.email,
      iat: decoded.iat ?? 0,
      exp: decoded.exp ?? 0,
    };

    next();
  } catch (error: unknown) {
    const baseError = ensureBaseError(error, {
      operation: 'authenticate',
      path: req.path,
      method: req.method,
    });

    if (shouldLogError(baseError)) {
      logError(baseError, { message: 'Authentication failed' });
    }

    // CRITICAL: Send response and DO NOT call next()
    // Authentication failures must stop the request chain
    res.status(baseError.statusCode).json({
      success: false,
      error: baseError.code,
      message: baseError.message,
      statusCode: baseError.statusCode,
      timestamp: baseError.timestamp,
      path: req.path,
    });
    // Do NOT call next() - request stops here
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if token is missing
 * 
 * @example
 * router.get('/public-wallets', optionalAuth, walletController.getPublicWallets);
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No auth provided, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      
      if (decoded.userId && decoded.email) {
        (req as AuthenticatedRequest).user = {
          userId: decoded.userId,
          email: decoded.email,
          iat: decoded.iat ?? 0,
          exp: decoded.exp ?? 0,
        };
      }
    } catch (error) {
      // Invalid token, but that's okay for optional auth
    }

    next();
  } catch (error: unknown) {
    // Any unexpected error, just continue without auth
    next();
  }
};

