/**
 * Wallet Controller - Presentation Layer
 * 
 * Thin HTTP handler - only handles HTTP concerns, delegates to use cases
 * 
 * @module wallet-service/presentation/controllers
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '@shield/shared/middleware';
import { CreateWalletUseCase } from '../../domain/useCases/CreateWalletUseCase';
import { GetUserWalletsUseCase } from '../../domain/useCases/GetUserWalletsUseCase';
import { GetWalletByIdUseCase } from '../../domain/useCases/GetWalletByIdUseCase';
import { UpdateWalletUseCase } from '../../domain/useCases/UpdateWalletUseCase';
import { DeleteWalletUseCase } from '../../domain/useCases/DeleteWalletUseCase';
import { GenerateWalletUseCase } from '../../domain/useCases/GenerateWalletUseCase';
import { RevealPrivateKeyUseCase } from '../../domain/useCases/RevealPrivateKeyUseCase';
import {
  BaseError,
  ensureBaseError,
  shouldLogError,
  AuthorizationError,
} from '@shield/shared/errors';
import { logError, logInfo } from '@shield/shared/types';

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
    private readonly deleteWalletUseCase: DeleteWalletUseCase,
    private readonly generateWalletUseCase: GenerateWalletUseCase,
    private readonly revealPrivateKeyUseCase: RevealPrivateKeyUseCase
  ) {}

  /**
   * Creates a new wallet
   */
  public async createWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
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
        }
      );

      // Log success
      logInfo('Wallet created successfully', {
        path: req.path,
        method: req.method,
        walletId: wallet.id,
        chain: wallet.chain,
        userId,
      });

      // Format HTTP response
      res.status(201).json({
        success: true,
        data: wallet.toPlainObject(),
        message: 'Wallet created successfully',
      });
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'createWallet',
        userId: req.user?.id,
        path: req.path,
        method: req.method,
      });

      if (shouldLogError(baseError)) {
        logError('Wallet creation failed', baseError);
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Gets all wallets for the authenticated user
   */
  public async getUserWallets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      
      // Parse query parameters (convert string "true"/"false" to boolean)
      const filters: { chain?: string; isActive?: boolean } = {
        chain: req.query.chain as string | undefined,
        isActive: req.query.isActive !== undefined 
          ? req.query.isActive === 'true' || req.query.isActive === true
          : undefined,
      };

      // Call use case
      const wallets = await this.getUserWalletsUseCase.execute(userId, filters);

      // Log success
      logInfo('Wallets retrieved successfully', {
        path: req.path,
        method: req.method,
        count: wallets.length,
        userId,
      });

      // Format HTTP response
      res.status(200).json({
        success: true,
        data: wallets.map((w) => w.toPlainObject()),
        message: 'Wallets retrieved successfully',
      });
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'getUserWallets',
        userId: req.user?.id,
        path: req.path,
        method: req.method,
      });

      if (shouldLogError(baseError)) {
        logError('Failed to retrieve wallets', baseError);
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Gets a specific wallet by ID
   */
  public async getWalletById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const { id } = req.params;

      // Call use case
      const wallet = await this.getWalletByIdUseCase.execute(id, userId);

      // Log success
      logInfo('Wallet retrieved successfully', {
        path: req.path,
        method: req.method,
        walletId: wallet.id,
        userId,
      });

      // Format HTTP response
      res.status(200).json({
        success: true,
        data: wallet.toPlainObject(),
        message: 'Wallet retrieved successfully',
      });
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'getWalletById',
        walletId: req.params.id,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
      });

      if (shouldLogError(baseError)) {
        logError('Failed to retrieve wallet', baseError);
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Updates a wallet
   */
  public async updateWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const { id } = req.params;
      const { tag, isActive } = req.body;

      // Call use case
      const wallet = await this.updateWalletUseCase.execute({
        walletId: id,
        userId,
        tag,
        isActive,
      });

      // Log success
      logInfo('Wallet updated successfully', {
        path: req.path,
        method: req.method,
        walletId: wallet.id,
        userId,
      });

      // Format HTTP response
      res.status(200).json({
        success: true,
        data: wallet.toPlainObject(),
        message: 'Wallet updated successfully',
      });
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'updateWallet',
        walletId: req.params.id,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
      });

      if (shouldLogError(baseError)) {
        logError('Wallet update failed', baseError);
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Deletes a wallet
   */
  public async deleteWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const { id } = req.params;

      // Call use case
      await this.deleteWalletUseCase.execute(id, userId);

      // Log success
      logInfo('Wallet deleted successfully', {
        path: req.path,
        method: req.method,
        walletId: id,
        userId,
      });

      // Format HTTP response
      res.status(200).json({
        success: true,
        data: { message: 'Wallet deleted successfully' },
        message: 'Wallet deleted successfully',
      });
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'deleteWallet',
        walletId: req.params.id,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
      });

      if (shouldLogError(baseError)) {
        logError('Wallet deletion failed', baseError);
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Generates a new blockchain wallet with encrypted private key storage
   */
  public async generateWallet(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const { chain, password, tag } = req.body;

      logInfo('Generating new blockchain wallet', {
        path: req.path,
        method: req.method,
        userId,
        chain,
      });

      // Call use case
      const wallet = await this.generateWalletUseCase.execute({
        userId,
        chain,
        password,
        tag,
      });

      // Log success
      logInfo('Wallet generated successfully', {
        path: req.path,
        method: req.method,
        walletId: wallet.id,
        address: wallet.address,
        chain: wallet.chain,
        createdBySystem: wallet.createdBySystem,
      });

      // Format HTTP response
      res.status(201).json({
        success: true,
        data: wallet.toPlainObject(),
        message: 'Wallet generated and encrypted successfully',
      });
    } catch (error: unknown) {
      const baseError = ensureBaseError(error, {
        operation: 'generateWallet',
        path: req.path,
        method: req.method,
      });

      if (shouldLogError(baseError)) {
        logError('Failed to generate wallet', baseError);
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Reveals the private key of a system-generated wallet (requires password)
   */
  public async revealPrivateKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const { id } = req.params;
      const { password } = req.body;

      logInfo('Attempting to reveal private key', {
        path: req.path,
        method: req.method,
        walletId: id,
        userId,
      });

      // Call use case
      const result = await this.revealPrivateKeyUseCase.execute({
        walletId: id,
        userId,
        password,
      });

      // Log success (but NOT the private key!)
      logInfo('Private key revealed successfully', {
        path: req.path,
        method: req.method,
        walletId: id,
        userId,
        address: result.address,
        chain: result.chain,
      });

      // Format HTTP response
      res.status(200).json({
        success: true,
        data: {
          privateKey: result.privateKey,
          address: result.address,
          chain: result.chain,
          warning: result.warning,
        },
        message: 'Private key revealed successfully',
      });
    } catch (error: unknown) {
      const baseError = ensureBaseError(error, {
        operation: 'revealPrivateKey',
        walletId: req.params.id,
        path: req.path,
        method: req.method,
      });

      if (shouldLogError(baseError)) {
        logError('Failed to reveal private key', baseError);
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Gets user ID from request
   */
  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.id;
    if (!userId) {
      throw new AuthorizationError('User ID not found in request', {
        path: req.path,
      });
    }
    return userId;
  }

  /**
   * Handles errors and formats HTTP error response
   * Uses strongly typed error handling
   */
  private handleError(error: BaseError, res: Response, path: string): void {
    res.status(error.statusCode).json({
      success: false,
      error: error.code,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
      path: path,
      details: {
        code: error.code,
        context: error.context,
      },
    });
  }
}
