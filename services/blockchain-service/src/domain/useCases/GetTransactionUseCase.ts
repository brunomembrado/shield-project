/**
 * Get Transaction Use Case
 * 
 * Business logic for retrieving transaction details
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
import { isNonEmptyString } from '@shield/shared/utils/guards';

/**
 * Get Transaction Use Case
 */
export class GetTransactionUseCase {
  constructor(private readonly blockchainClient: IBlockchainClient) {}

  /**
   * Executes the get transaction use case
   */
  public async execute(
    chain: ChainType,
    txHash: string,
    correlationId: string = ''
  ): Promise<unknown> {
    try {
      if (!isNonEmptyString(txHash)) {
        throw new ValidationError('Transaction hash is required', {
          field: 'txHash',
        });
      }

      const transaction = await this.blockchainClient.getTransaction(txHash);

      return transaction;
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
      throw handleUnknownError(error, 'Failed to get transaction', {
        chain,
        txHash,
        operation: 'getTransaction',
        correlationId,
      });
    }
  }
}

