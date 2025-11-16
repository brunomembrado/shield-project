/**
 * Transaction Controller - Presentation Layer
 * 
 * Thin HTTP handler - only handles HTTP concerns, delegates to use cases
 * 
 * @module transaction-service/presentation/controllers
 */

import { Request, Response } from 'express';
import { CreateTransactionUseCase } from '../../domain/useCases/CreateTransactionUseCase';
import { GetUserTransactionsUseCase } from '../../domain/useCases/GetUserTransactionsUseCase';
import { GetTransactionByIdUseCase } from '../../domain/useCases/GetTransactionByIdUseCase';
import { UpdateTransactionStatusUseCase } from '../../domain/useCases/UpdateTransactionStatusUseCase';
import { createSuccessResponse, createErrorResponse } from '../../../../shared/utils';
import {
  BaseError,
  ensureBaseError,
  shouldLogError,
  AuthorizationError,
} from '../../../../shared/errors';
import { transactionServiceLogger } from '../../../../shared/logger/serviceLogger';
import { logControllerEntry, extractLogContext } from '../../../../shared/logger/helpers';
import { RequestStage } from '../../../../shared/logger';

/**
 * Transaction Controller
 * 
 * Responsibilities:
 * - Extract data from HTTP request
 * - Call appropriate use case
 * - Format HTTP response
 * - Handle HTTP errors
 */
export class TransactionController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getUserTransactionsUseCase: GetUserTransactionsUseCase,
    private readonly getTransactionByIdUseCase: GetTransactionByIdUseCase,
    private readonly updateTransactionStatusUseCase: UpdateTransactionStatusUseCase
  ) {}

  /**
   * Creates a new transaction
   */
  public async createTransaction(req: Request, res: Response): Promise<void> {
    const logger = transactionServiceLogger();

    try {
      logControllerEntry(logger, 'TransactionController', 'createTransaction', req);
      logger.recordStage(this.getCorrelationId(req), RequestStage.CONTROLLER, {
        action: 'createTransaction',
      });

      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const { walletId, chain, amountUSDT, bankAccountName, bankAccountNumber, bankRoutingNumber } = req.body;

      // Call use case (all business logic is in use case)
      const transaction = await this.createTransactionUseCase.execute(
        {
          userId,
          walletId,
          chain,
          amountUSDT,
          bankAccountName,
          bankAccountNumber,
          bankRoutingNumber,
        },
        this.getCorrelationId(req)
      );

      // Log success
      logger.info('Transaction created successfully', {
        ...extractLogContext(req),
        transactionId: transaction.id,
        chain: transaction.chain,
        amountUSDT: transaction.amountUSDT,
      });

      // Format HTTP response
      res.status(201).json(
        createSuccessResponse(transaction.toPlainObject(), 'Transaction created successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'createTransaction',
        userId: this.getUserId(req),
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Transaction creation failed', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Gets all transactions for the authenticated user
   */
  public async getUserTransactions(req: Request, res: Response): Promise<void> {
    const logger = transactionServiceLogger();

    try {
      logControllerEntry(logger, 'TransactionController', 'getUserTransactions', req);

      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const filters = req.query as {
        chain?: string;
        status?: string;
        limit?: number;
        offset?: number;
      };

      // Call use case
      const result = await this.getUserTransactionsUseCase.execute(
        userId,
        filters,
        this.getCorrelationId(req)
      );

      // Log success
      logger.info('Transactions retrieved successfully', {
        ...extractLogContext(req),
        count: result.transactions.length,
        total: result.total,
      });

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(
          {
            transactions: result.transactions.map((t) => t.toPlainObject()),
            pagination: {
              total: result.total,
              limit: result.limit,
              offset: result.offset,
            },
          },
          'Transactions retrieved successfully'
        )
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'getUserTransactions',
        userId: this.getUserId(req),
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Failed to retrieve transactions', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Gets a specific transaction by ID
   */
  public async getTransactionById(req: Request, res: Response): Promise<void> {
    const logger = transactionServiceLogger();

    try {
      logControllerEntry(logger, 'TransactionController', 'getTransactionById', req);

      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const { id } = req.params;

      // Call use case
      const transaction = await this.getTransactionByIdUseCase.execute(
        id,
        userId,
        this.getCorrelationId(req)
      );

      // Log success
      logger.info('Transaction retrieved successfully', {
        ...extractLogContext(req),
        transactionId: transaction.id,
      });

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(transaction.toPlainObject(), 'Transaction retrieved successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'getTransactionById',
        transactionId: req.params.id,
        userId: this.getUserId(req),
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Failed to retrieve transaction', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Updates transaction status
   */
  public async updateTransactionStatus(req: Request, res: Response): Promise<void> {
    const logger = transactionServiceLogger();

    try {
      logControllerEntry(logger, 'TransactionController', 'updateTransactionStatus', req);

      // Extract data from request (validation already done by Joi middleware)
      const userId = this.getUserId(req);
      const { id } = req.params;
      const { status, txHash, fromAddress, notes } = req.body;

      // Call use case
      const transaction = await this.updateTransactionStatusUseCase.execute(
        {
          transactionId: id,
          userId,
          status,
          txHash,
          fromAddress,
          notes,
        },
        this.getCorrelationId(req)
      );

      // Log success
      logger.info('Transaction status updated successfully', {
        ...extractLogContext(req),
        transactionId: transaction.id,
        status: transaction.status,
      });

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(transaction.toPlainObject(), 'Transaction status updated successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'updateTransactionStatus',
        transactionId: req.params.id,
        userId: this.getUserId(req),
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Transaction status update failed', baseError, {
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
