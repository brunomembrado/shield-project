/**
 * Wallet Controller - Presentation Layer
 * 
 * Thin HTTP handler - only handles HTTP concerns, delegates to use cases
 * 
 * @module wallet-service/presentation/controllers
 */

import { Request, Response } from 'express';
import { CreateWalletUseCase } from '../../domain/useCases/CreateWalletUseCase';
import { GetUserWalletsUseCase } from '../../domain/useCases/GetUserWalletsUseCase';
import { GetWalletByIdUseCase } from '../../domain/useCases/GetWalletByIdUseCase';
import { UpdateWalletUseCase } from '../../domain/useCases/UpdateWalletUseCase';
import { DeleteWalletUseCase } from '../../domain/useCases/DeleteWalletUseCase';
import { createSuccessResponse, createErrorResponse } from '../../../../shared/utils';
import {
  BaseError,
  ensureBaseError,
  shouldLogError,
  AuthorizationError,
} from '../../../../shared/errors';
import { walletServiceLogger } from '../../../../shared/logger/serviceLogger';
import { logControllerEntry, extractLogContext } from '../../../../shared/logger/helpers';
import { RequestStage } from '../../../../shared/logger';

/**
 * Wallet Controller
 * 
 * Responsibilities:
 * - Extract data from HTTP request
 * - Call appropriate use case
 * - Format HTTP response
 * - Handle HTTP errors
 */
export class WalletController {
  constructor(
    private readonly createWalletUseCase: CreateWalletUseCase,
    private readonly getUserWalletsUseCase: GetUserWalletsUseCase,
    private readonly getWalletByIdUseCase: GetWalletByIdUseCase,
    private readonly updateWalletUseCase: UpdateWalletUseCase,
    private readonly deleteWalletUseCase: DeleteWalletUseCase
  ) {}

  /**
   * Creates a new wallet
   */
  public async createWallet(req: Request, res: Response): Promise<void> {
    const logger = walletServiceLogger();

    try {
      logControllerEntry(logger, 'WalletController', 'createWallet', req);
      logger.recordStage(this.getCorrelationId(req), RequestStage.CONTROLLER, {
        action: 'createWallet',
      });

      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const { chain, address, tag } = req.body;

      // Call use case
      const wallet = await this.createWalletUseCase.execute(
        {
          userId,
          chain,
          address,
          tag,
        },
        this.getCorrelationId(req)
      );

      // Log success
      logger.info('Wallet created successfully', {
        ...extractLogContext(req),
        walletId: wallet.id,
        chain: wallet.chain,
      });

      // Format HTTP response
      res.status(201).json(
        createSuccessResponse(wallet.toPlainObject(), 'Wallet created successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'createWallet',
        userId: this.getUserId(req),
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Wallet creation failed', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Gets all wallets for the authenticated user
   */
  public async getUserWallets(req: Request, res: Response): Promise<void> {
    const logger = walletServiceLogger();

    try {
      logControllerEntry(logger, 'WalletController', 'getUserWallets', req);

      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const filters = req.query as { chain?: string; isActive?: boolean };

      // Call use case
      const wallets = await this.getUserWalletsUseCase.execute(
        userId,
        filters,
        this.getCorrelationId(req)
      );

      // Log success
      logger.info('Wallets retrieved successfully', {
        ...extractLogContext(req),
        count: wallets.length,
      });

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(
          wallets.map((w) => w.toPlainObject()),
          'Wallets retrieved successfully'
        )
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'getUserWallets',
        userId: this.getUserId(req),
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Failed to retrieve wallets', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Gets a specific wallet by ID
   */
  public async getWalletById(req: Request, res: Response): Promise<void> {
    const logger = walletServiceLogger();

    try {
      logControllerEntry(logger, 'WalletController', 'getWalletById', req);

      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const { id } = req.params;

      // Call use case
      const wallet = await this.getWalletByIdUseCase.execute(
        id,
        userId,
        this.getCorrelationId(req)
      );

      // Log success
      logger.info('Wallet retrieved successfully', {
        ...extractLogContext(req),
        walletId: wallet.id,
      });

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(wallet.toPlainObject(), 'Wallet retrieved successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'getWalletById',
        walletId: req.params.id,
        userId: this.getUserId(req),
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Failed to retrieve wallet', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Updates a wallet
   */
  public async updateWallet(req: Request, res: Response): Promise<void> {
    const logger = walletServiceLogger();

    try {
      logControllerEntry(logger, 'WalletController', 'updateWallet', req);

      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const { id } = req.params;
      const { tag, isActive } = req.body;

      // Call use case
      const wallet = await this.updateWalletUseCase.execute(
        {
          walletId: id,
          userId,
          tag,
          isActive,
        },
        this.getCorrelationId(req)
      );

      // Log success
      logger.info('Wallet updated successfully', {
        ...extractLogContext(req),
        walletId: wallet.id,
      });

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(wallet.toPlainObject(), 'Wallet updated successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'updateWallet',
        walletId: req.params.id,
        userId: this.getUserId(req),
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Wallet update failed', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Deletes a wallet
   */
  public async deleteWallet(req: Request, res: Response): Promise<void> {
    const logger = walletServiceLogger();

    try {
      logControllerEntry(logger, 'WalletController', 'deleteWallet', req);

      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const { id } = req.params;

      // Call use case
      await this.deleteWalletUseCase.execute(id, userId, this.getCorrelationId(req));

      // Log success
      logger.info('Wallet deleted successfully', {
        ...extractLogContext(req),
        walletId: id,
      });

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse({ message: 'Wallet deleted successfully' }, 'Wallet deleted successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'deleteWallet',
        walletId: req.params.id,
        userId: this.getUserId(req),
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Wallet deletion failed', baseError, {
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
      throw new AuthorizationError('User ID not found in request', {
        path: req.path,
      });
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
