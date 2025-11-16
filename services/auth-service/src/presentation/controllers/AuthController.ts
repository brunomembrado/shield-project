/**
 * Auth Controller - Presentation Layer
 * 
 * Thin HTTP handler - only handles HTTP concerns, delegates to use cases
 * 
 * @module auth-service/presentation/controllers
 */

import { Request, Response } from 'express';
import { RegisterUserUseCase } from '../../domain/useCases/RegisterUserUseCase';
import { LoginUserUseCase } from '../../domain/useCases/LoginUserUseCase';
import { RefreshTokenUseCase } from '../../domain/useCases/RefreshTokenUseCase';
import { LogoutUserUseCase } from '../../domain/useCases/LogoutUserUseCase';
import { createSuccessResponse, createErrorResponse } from '@shield/shared/utils';
import {
  BaseError,
  handleUnknownError,
  ensureBaseError,
  shouldLogError,
} from '@shield/shared/errors';
import { auditLogger } from '../../index';
import { authServiceLogger } from '@shield/shared/logger/serviceLogger';
import { logControllerEntry, extractLogContext } from '@shield/shared/logger/helpers';
import { RequestStage } from '@shield/shared/logger';

/**
 * Auth Controller
 * 
 * Responsibilities:
 * - Extract data from HTTP request
 * - Call appropriate use case
 * - Format HTTP response
 * - Handle HTTP errors
 */
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase
  ) {}

  /**
   * Handles user registration
   */
  public async register(req: Request, res: Response): Promise<void> {
    const logger = authServiceLogger();
    
    try {
      logControllerEntry(logger, 'AuthController', 'register', req);
      logger.recordStage(
        this.getCorrelationId(req),
        RequestStage.CONTROLLER,
        { action: 'register' }
      );

      // Extract data from request (validation already done by Joi middleware)
      const { email, password } = req.body;

      // Call use case (business logic is in use case)
      const result = await this.registerUserUseCase.execute(
        email,
        password,
        this.getCorrelationId(req)
      );

      // Audit logging (HTTP concern - logging the HTTP request)
      auditLogger.logAuth('USER_REGISTERED', req, result.user.id, result.user.email, {
        registrationMethod: 'email',
        ipAddress: req.ip,
      });

      // Log success
      logger.info('User registered successfully', {
        ...extractLogContext(req),
        userId: result.user.id,
        userEmail: result.user.email,
      });

      // Format HTTP response
      res.status(201).json(
        createSuccessResponse(result, 'User registered successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'register',
        email: req.body?.email || 'unknown',
        ...extractLogContext(req),
      });

      const email = req.body?.email || 'unknown';
      auditLogger.logFromRequest('USER_REGISTERED', req, {
        userEmail: email,
        success: false,
        errorMessage: baseError.message,
        errorCode: baseError.code,
      });

      if (shouldLogError(baseError)) {
        logger.error('Registration failed', baseError, {
          ...extractLogContext(req),
          email,
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Handles user login
   */
  public async login(req: Request, res: Response): Promise<void> {
    const logger = authServiceLogger();
    
    try {
      logControllerEntry(logger, 'AuthController', 'login', req);
      logger.recordStage(
        this.getCorrelationId(req),
        RequestStage.CONTROLLER,
        { action: 'login' }
      );

      // Extract data from request (validation already done by Joi middleware)
      const { email, password } = req.body;

      // Call use case (business logic including account lock check is in use case)
      const result = await this.loginUserUseCase.execute(
        email,
        password,
        this.getCorrelationId(req),
        {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }
      );

      // Audit logging (HTTP concern)
      auditLogger.logAuth('USER_LOGIN_SUCCESS', req, result.user.id, result.user.email, {
        loginMethod: 'email-password',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      // Log success
      logger.info('Login successful', {
        ...extractLogContext(req),
        userId: result.user.id,
        userEmail: result.user.email,
      });

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(result, 'Login successful')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'login',
        email: req.body?.email || 'unknown',
        ...extractLogContext(req),
      });

      const email = req.body?.email || 'unknown';
      auditLogger.logAuthFailure(req, baseError.message, email);

      if (shouldLogError(baseError)) {
        logger.error('Login failed', baseError, {
          ...extractLogContext(req),
          email,
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Handles token refresh
   */
  public async refresh(req: Request, res: Response): Promise<void> {
    const logger = authServiceLogger();
    
    try {
      logControllerEntry(logger, 'AuthController', 'refresh', req);

      // Extract data from request (validation already done by Joi middleware)
      const { refreshToken } = req.body;

      // Call use case
      const result = await this.refreshTokenUseCase.execute(refreshToken);

      // Log success
      logger.info('Token refreshed successfully', extractLogContext(req));

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(result, 'Token refreshed successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'refresh',
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Token refresh failed', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Handles user logout
   */
  public async logout(req: Request, res: Response): Promise<void> {
    const logger = authServiceLogger();
    
    try {
      logControllerEntry(logger, 'AuthController', 'logout', req);

      // Extract data from request (validation already done by Joi middleware)
      const { refreshToken } = req.body;

      // Call use case
      const result = await this.logoutUserUseCase.execute(refreshToken);

      // Log success
      logger.info('Logout successful', extractLogContext(req));

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(result, 'Logout successful')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'logout',
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Logout failed', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Handles errors and formats HTTP error response
   * Uses strongly typed error handling
   */
  private handleError(error: BaseError, res: Response, path: string): void {
    res.status(error.statusCode).json(
      createErrorResponse(
        error.message,
        error.statusCode,
        path,
        {
          code: error.code,
          context: error.context,
        }
      )
    );
  }

  /**
   * Gets correlation ID from request
   */
  private getCorrelationId(req: Request): string {
    return (req as Request & { correlationId?: string }).correlationId || '';
  }
}
