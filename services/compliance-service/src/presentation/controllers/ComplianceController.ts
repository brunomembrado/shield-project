/**
 * Compliance Controller - Presentation Layer
 * 
 * Thin HTTP handler - only handles HTTP concerns, delegates to use cases
 * 
 * @module compliance-service/presentation/controllers
 */

import { Request, Response } from 'express';
import { PerformKYCUseCase } from '../../domain/useCases/PerformKYCUseCase';
import { PerformKYBUseCase } from '../../domain/useCases/PerformKYBUseCase';
import { ScreenWalletUseCase } from '../../domain/useCases/ScreenWalletUseCase';
import { ScreenTransactionUseCase } from '../../domain/useCases/ScreenTransactionUseCase';
import { GetComplianceStatusUseCase } from '../../domain/useCases/GetComplianceStatusUseCase';
import { ReviewComplianceCheckUseCase } from '../../domain/useCases/ReviewComplianceCheckUseCase';
import { createSuccessResponse, createErrorResponse } from '../../../../shared/utils';
import {
  BaseError,
  ensureBaseError,
  shouldLogError,
  AuthorizationError,
} from '../../../../shared/errors';
import { complianceServiceLogger } from '../../../../shared/logger/serviceLogger';
import { logControllerEntry, extractLogContext } from '../../../../shared/logger/helpers';

/**
 * Compliance Controller
 * 
 * Responsibilities:
 * - Extract data from HTTP request
 * - Call appropriate use case
 * - Format HTTP response
 * - Handle HTTP errors
 */
export class ComplianceController {
  constructor(
    private readonly performKYCUseCase: PerformKYCUseCase,
    private readonly performKYBUseCase: PerformKYBUseCase,
    private readonly screenWalletUseCase: ScreenWalletUseCase,
    private readonly screenTransactionUseCase: ScreenTransactionUseCase,
    private readonly getComplianceStatusUseCase: GetComplianceStatusUseCase,
    private readonly reviewComplianceCheckUseCase: ReviewComplianceCheckUseCase
  ) {}

  /**
   * Performs KYC check
   */
  public async performKYC(req: Request, res: Response): Promise<void> {
    const logger = complianceServiceLogger();

    try {
      logControllerEntry(logger, 'ComplianceController', 'performKYC', req);

      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const kycData = req.body;

      // Call use case
      const result = await this.performKYCUseCase.execute(
        userId,
        kycData,
        this.getCorrelationId(req)
      );

      // Format HTTP response
      res.status(201).json(
        createSuccessResponse(result, 'KYC check initiated successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'performKYC',
        userId: this.getUserId(req),
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('KYC check failed', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Performs KYB check
   */
  public async performKYB(req: Request, res: Response): Promise<void> {
    const logger = complianceServiceLogger();

    try {
      logControllerEntry(logger, 'ComplianceController', 'performKYB', req);

      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const kybData = req.body;

      // Call use case
      const result = await this.performKYBUseCase.execute(
        userId,
        kybData,
        this.getCorrelationId(req)
      );

      // Format HTTP response
      res.status(201).json(
        createSuccessResponse(result, 'KYB check initiated successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'performKYB',
        userId: this.getUserId(req),
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('KYB check failed', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Screens wallet
   */
  public async screenWallet(req: Request, res: Response): Promise<void> {
    const logger = complianceServiceLogger();

    try {
      logControllerEntry(logger, 'ComplianceController', 'screenWallet', req);

      // Extract data from request (validation already done by Joi middleware)
      const { address, chain } = req.body;

      // Call use case
      const result = await this.screenWalletUseCase.execute(
        address,
        chain,
        this.getCorrelationId(req)
      );

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(result, 'Wallet screened successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'screenWallet',
        address: req.body.address,
        chain: req.body.chain,
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Wallet screening failed', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Screens transaction
   */
  public async screenTransaction(req: Request, res: Response): Promise<void> {
    const logger = complianceServiceLogger();

    try {
      logControllerEntry(logger, 'ComplianceController', 'screenTransaction', req);

      // Extract data from request (validation already done by Joi middleware)
      const { transactionId, fromAddress, amount } = req.body;

      // Call use case
      const result = await this.screenTransactionUseCase.execute(
        transactionId,
        fromAddress,
        amount,
        this.getCorrelationId(req)
      );

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(result, 'Transaction screened successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'screenTransaction',
        transactionId: req.body.transactionId,
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Transaction screening failed', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Gets compliance status
   */
  public async getComplianceStatus(req: Request, res: Response): Promise<void> {
    const logger = complianceServiceLogger();

    try {
      logControllerEntry(logger, 'ComplianceController', 'getComplianceStatus', req);

      // Extract data from request (validation already done by Joi middleware)
      const { id } = req.params;

      // Call use case
      const result = await this.getComplianceStatusUseCase.execute(
        id,
        this.getCorrelationId(req)
      );

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(result, 'Compliance status retrieved successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'getComplianceStatus',
        checkId: req.params.id,
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Failed to get compliance status', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Reviews compliance check
   */
  public async reviewComplianceCheck(req: Request, res: Response): Promise<void> {
    const logger = complianceServiceLogger();

    try {
      logControllerEntry(logger, 'ComplianceController', 'reviewComplianceCheck', req);

      // Extract data from request (validation already done by Joi middleware)
      const { id } = req.params;
      const { decision, notes } = req.body;
      const reviewerId = this.getUserId(req);

      // Call use case
      const result = await this.reviewComplianceCheckUseCase.execute(
        {
          checkId: id,
          reviewerId,
          decision,
          notes,
        },
        this.getCorrelationId(req)
      );

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(result, 'Compliance check reviewed successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'reviewComplianceCheck',
        checkId: req.params.id,
        reviewerId: this.getUserId(req),
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Compliance review failed', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Gets user ID from request
   */
  private getUserId(req: Request): string {
    const userId = (req as Request & { userId?: string }).userId;
    if (!userId) {
      throw new ServiceError('User ID not found in request', 401);
    }
    return userId;
  }

  /**
   * Gets correlation ID from request
   */
  private getCorrelationId(req: Request): string {
    return (req as Request & { correlationId?: string }).correlationId || '';
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
}
