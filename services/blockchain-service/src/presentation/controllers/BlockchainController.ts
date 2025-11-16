/**
 * Blockchain Controller - Presentation Layer
 * 
 * Thin HTTP handler - only handles HTTP concerns, delegates to use cases
 * 
 * @module blockchain-service/presentation/controllers
 */

import { Request, Response } from 'express';
import { GetUSDTBalanceUseCase } from '../../domain/useCases/GetUSDTBalanceUseCase';
import { GetTransactionUseCase } from '../../domain/useCases/GetTransactionUseCase';
import { ValidateTransactionUseCase } from '../../domain/useCases/ValidateTransactionUseCase';
import { MonitorTransfersUseCase } from '../../domain/useCases/MonitorTransfersUseCase';
import { GetNetworkStatusUseCase } from '../../domain/useCases/GetNetworkStatusUseCase';
import { createSuccessResponse, createErrorResponse } from '@shield/shared/utils';
import { ChainType } from '@shield/shared/types';
import {
  BaseError,
  ensureBaseError,
  shouldLogError,
} from '@shield/shared/errors';
import { blockchainServiceLogger } from '@shield/shared/logger/serviceLogger';
import { logControllerEntry, extractLogContext } from '@shield/shared/logger/helpers';

/**
 * Blockchain Controller
 * 
 * Responsibilities:
 * - Extract data from HTTP request
 * - Call appropriate use case based on chain
 * - Format HTTP response
 * - Handle HTTP errors
 */
export class BlockchainController {
  constructor(
    private readonly polygonGetBalanceUseCase: GetUSDTBalanceUseCase,
    private readonly tronGetBalanceUseCase: GetUSDTBalanceUseCase,
    private readonly polygonGetTransactionUseCase: GetTransactionUseCase,
    private readonly tronGetTransactionUseCase: GetTransactionUseCase,
    private readonly polygonValidateTransactionUseCase: ValidateTransactionUseCase,
    private readonly tronValidateTransactionUseCase: ValidateTransactionUseCase,
    private readonly polygonMonitorTransfersUseCase: MonitorTransfersUseCase,
    private readonly tronMonitorTransfersUseCase: MonitorTransfersUseCase,
    private readonly polygonGetNetworkStatusUseCase: GetNetworkStatusUseCase,
    private readonly tronGetNetworkStatusUseCase: GetNetworkStatusUseCase
  ) {}

  /**
   * Gets USDT balance
   */
  public async getBalance(req: Request, res: Response): Promise<void> {
    const logger = blockchainServiceLogger();

    try {
      logControllerEntry(logger, 'BlockchainController', 'getBalance', req);

      // Extract data from request (validation already done by Joi middleware)
      const { chain, address } = req.params;

      // Get appropriate use case based on chain
      const useCase = this.getBalanceUseCaseForChain(chain as ChainType);

      // Call use case
      const result = await useCase.execute(chain as ChainType, address, this.getCorrelationId(req));

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(result, 'Balance retrieved successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'getBalance',
        chain: req.params.chain,
        address: req.params.address,
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Failed to get balance', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Gets transaction details
   */
  public async getTransaction(req: Request, res: Response): Promise<void> {
    const logger = blockchainServiceLogger();

    try {
      logControllerEntry(logger, 'BlockchainController', 'getTransaction', req);

      // Extract data from request (validation already done by Joi middleware)
      const { chain, hash } = req.params;

      // Get appropriate use case based on chain
      const useCase = this.getTransactionUseCaseForChain(chain as ChainType);

      // Call use case
      const result = await useCase.execute(chain as ChainType, hash, this.getCorrelationId(req));

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(result, 'Transaction retrieved successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'getTransaction',
        chain: req.params.chain,
        hash: req.params.hash,
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Failed to get transaction', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Validates transaction
   */
  public async validateTransaction(req: Request, res: Response): Promise<void> {
    const logger = blockchainServiceLogger();

    try {
      logControllerEntry(logger, 'BlockchainController', 'validateTransaction', req);

      // Extract data from request (validation already done by Joi middleware)
      const { chain } = req.params;
      const { txHash, expectedToAddress } = req.body;

      // Get appropriate use case based on chain
      const useCase = this.getValidateTransactionUseCaseForChain(chain as ChainType);

      // Call use case
      const result = await useCase.execute(
        chain as ChainType,
        txHash,
        expectedToAddress,
        this.getCorrelationId(req)
      );

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(result, 'Transaction validated successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'validateTransaction',
        chain: req.params.chain,
        txHash: req.body.txHash,
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Transaction validation failed', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Monitors transfers
   */
  public async monitorTransfers(req: Request, res: Response): Promise<void> {
    const logger = blockchainServiceLogger();

    try {
      logControllerEntry(logger, 'BlockchainController', 'monitorTransfers', req);

      // Extract data from request (validation already done by Joi middleware)
      const { chain } = req.params;
      const { toAddress, fromBlock, toBlock } = req.body;

      // Get appropriate use case based on chain
      const useCase = this.getMonitorTransfersUseCaseForChain(chain as ChainType);

      // Call use case
      const result = await useCase.execute(
        chain as ChainType,
        toAddress,
        fromBlock || 0,
        toBlock || 0,
        this.getCorrelationId(req)
      );

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(result, 'Transfers monitored successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'monitorTransfers',
        chain: req.params.chain,
        toAddress: req.body.toAddress,
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Failed to monitor transfers', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Gets network status
   */
  public async getNetworkStatus(req: Request, res: Response): Promise<void> {
    const logger = blockchainServiceLogger();

    try {
      logControllerEntry(logger, 'BlockchainController', 'getNetworkStatus', req);

      // Extract data from request (validation already done by Joi middleware)
      const { chain } = req.params;

      // Get appropriate use case based on chain
      const useCase = this.getNetworkStatusUseCaseForChain(chain as ChainType);

      // Call use case
      const result = await useCase.execute(chain as ChainType, this.getCorrelationId(req));

      // Format HTTP response
      res.status(200).json(
        createSuccessResponse(result, 'Network status retrieved successfully')
      );
    } catch (error: unknown) {
      // Handle errors with strong typing
      const baseError = ensureBaseError(error, {
        action: 'getNetworkStatus',
        chain: req.params.chain,
        ...extractLogContext(req),
      });

      if (shouldLogError(baseError)) {
        logger.error('Failed to get network status', baseError, {
          ...extractLogContext(req),
          errorCode: baseError.code,
          statusCode: baseError.statusCode,
        });
      }

      this.handleError(baseError, res, req.path);
    }
  }

  /**
   * Gets balance use case for chain
   */
  private getBalanceUseCaseForChain(chain: ChainType): GetUSDTBalanceUseCase {
    return chain === ChainType.POLYGON
      ? this.polygonGetBalanceUseCase
      : this.tronGetBalanceUseCase;
  }

  /**
   * Gets transaction use case for chain
   */
  private getTransactionUseCaseForChain(chain: ChainType): GetTransactionUseCase {
    return chain === ChainType.POLYGON
      ? this.polygonGetTransactionUseCase
      : this.tronGetTransactionUseCase;
  }

  /**
   * Gets validate transaction use case for chain
   */
  private getValidateTransactionUseCaseForChain(chain: ChainType): ValidateTransactionUseCase {
    return chain === ChainType.POLYGON
      ? this.polygonValidateTransactionUseCase
      : this.tronValidateTransactionUseCase;
  }

  /**
   * Gets monitor transfers use case for chain
   */
  private getMonitorTransfersUseCaseForChain(chain: ChainType): MonitorTransfersUseCase {
    return chain === ChainType.POLYGON
      ? this.polygonMonitorTransfersUseCase
      : this.tronMonitorTransfersUseCase;
  }

  /**
   * Gets network status use case for chain
   */
  private getNetworkStatusUseCaseForChain(chain: ChainType): GetNetworkStatusUseCase {
    return chain === ChainType.POLYGON
      ? this.polygonGetNetworkStatusUseCase
      : this.tronGetNetworkStatusUseCase;
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
