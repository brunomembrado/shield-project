/**
 * Monitor Transfers Use Case
 * 
 * Business logic for monitoring USDT transfers
 * 
 * @module blockchain-service/domain/useCases
 */

import { IBlockchainClient } from '../services/IBlockchainClient';
import { ChainType } from '@shield/shared/types';
import {
  ServiceError,
  handleUnknownError,
  ValidationError,
  ExternalServiceError,
} from '@shield/shared/errors';
import { isNonEmptyString, isInteger, isNonNegativeNumber } from '@shield/shared/utils/guards';

/**
 * Monitor Transfers Use Case
 */
export class MonitorTransfersUseCase {
  constructor(private readonly blockchainClient: IBlockchainClient) {}

  /**
   * Executes the monitor transfers use case
   */
  public async execute(
    chain: ChainType,
    toAddress: string,
    fromBlock: number,
    toBlock: number,
    correlationId: string = ''
  ): Promise<unknown[]> {
    try {
      if (!isNonEmptyString(toAddress)) {
        throw new ValidationError('To address is required', {
          field: 'toAddress',
        });
      }

      if (!isInteger(fromBlock) || !isNonNegativeNumber(fromBlock)) {
        throw new ValidationError('Invalid from block number', {
          field: 'fromBlock',
          value: fromBlock,
        });
      }

      if (!isInteger(toBlock) || !isNonNegativeNumber(toBlock)) {
        throw new ValidationError('Invalid to block number', {
          field: 'toBlock',
          value: toBlock,
        });
      }

      if (toBlock < fromBlock) {
        throw new ValidationError('To block must be greater than or equal to from block', {
          fromBlock,
          toBlock,
        });
      }

      const transfers = await this.blockchainClient.monitorUSDTTransfers(
        toAddress,
        fromBlock,
        toBlock
      );

      return transfers;
    } catch (error: unknown) {
      // Re-throw known errors
      if (
        error instanceof ServiceError ||
        error instanceof ValidationError ||
        error instanceof ExternalServiceError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to monitor transfers', {
        chain,
        toAddress,
        fromBlock,
        toBlock,
        operation: 'monitorTransfers',
        correlationId,
      });
    }
  }
}

