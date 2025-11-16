/**
 * Get USDT Balance Use Case
 * 
 * Business logic for retrieving USDT balance
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
 * Get USDT balance result
 */
export interface GetUSDTBalanceResult {
  chain: ChainType;
  address: string;
  balance: string;
  symbol: string;
}

/**
 * Get USDT Balance Use Case
 */
export class GetUSDTBalanceUseCase {
  constructor(private readonly blockchainClient: IBlockchainClient) {}

  /**
   * Executes the get USDT balance use case
   */
  public async execute(
    chain: ChainType,
    address: string,
    correlationId: string = ''
  ): Promise<GetUSDTBalanceResult> {
    try {
      if (!isNonEmptyString(address)) {
        throw new ValidationError('Address is required', {
          field: 'address',
        });
      }

      const balance = await this.blockchainClient.getUSDTBalance(address);

      return {
        chain,
        address,
        balance,
        symbol: 'USDT',
      };
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
      throw handleUnknownError(error, 'Failed to get balance', {
        chain,
        address,
        operation: 'getUSDTBalance',
        correlationId,
      });
    }
  }
}

