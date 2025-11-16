/**
 * Validate Transaction Use Case
 * 
 * Business logic for validating USDT transactions
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
 * Validate Transaction Use Case
 */
export class ValidateTransactionUseCase {
  constructor(private readonly blockchainClient: IBlockchainClient) {}

  /**
   * Executes the validate transaction use case
   */
  public async execute(
    chain: ChainType,
    txHash: string,
    expectedToAddress: string,
    correlationId: string = ''
  ): Promise<unknown> {
    try {
      if (!isNonEmptyString(txHash)) {
        throw new ValidationError('Transaction hash is required', {
          field: 'txHash',
        });
      }

      if (!isNonEmptyString(expectedToAddress)) {
        throw new ValidationError('Expected to address is required', {
          field: 'expectedToAddress',
        });
      }

      const validation = await this.blockchainClient.validateUSDTTransaction(
        txHash,
        expectedToAddress
      );

      return validation;
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
      throw handleUnknownError(error, 'Failed to validate transaction', {
        chain,
        txHash,
        expectedToAddress,
        operation: 'validateTransaction',
        correlationId,
      });
    }
  }
}

