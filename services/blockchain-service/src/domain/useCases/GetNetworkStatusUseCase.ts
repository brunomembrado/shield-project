/**
 * Get Network Status Use Case
 * 
 * Business logic for retrieving network status
 * 
 * @module blockchain-service/domain/useCases
 */

import { IBlockchainClient } from '../services/IBlockchainClient';
import { ChainType } from '../../../../shared/types';
import {
  ServiceError,
  handleUnknownError,
  ExternalServiceError,
} from '../../../../shared/errors';

/**
 * Get Network Status Use Case
 */
export class GetNetworkStatusUseCase {
  constructor(private readonly blockchainClient: IBlockchainClient) {}

  /**
   * Executes the get network status use case
   */
  public async execute(
    chain: ChainType,
    correlationId: string = ''
  ): Promise<unknown> {
    try {
      const status = await this.blockchainClient.getNetworkStatus();
      return status;
    } catch (error: unknown) {
      // Re-throw known errors
      if (error instanceof ServiceError || error instanceof ExternalServiceError) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to get network status', {
        chain,
        operation: 'getNetworkStatus',
        correlationId,
      });
    }
  }
}

