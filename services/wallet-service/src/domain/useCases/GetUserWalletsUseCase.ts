/**
 * Get User Wallets Use Case
 * 
 * Business logic for retrieving user wallets
 * 
 * @module wallet-service/domain/useCases
 */

import { Wallet } from '../entities/Wallet';
import { IWalletRepository } from '../repositories/IWalletRepository';
import { WalletFilters } from '../repositories/IWalletRepository';
import {
  ServiceError,
  handleUnknownError,
} from '../../../../shared/errors';

/**
 * Get User Wallets Use Case
 */
export class GetUserWalletsUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  /**
   * Executes the get user wallets use case
   */
  public async execute(
    userId: string,
    filters?: WalletFilters,
    correlationId: string = ''
  ): Promise<Wallet[]> {
    try {
      return await this.walletRepository.findByUserId(userId, filters);
    } catch (error: unknown) {
      // Re-throw known errors
      if (error instanceof ServiceError) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to retrieve wallets', {
        userId,
        filters,
        operation: 'getUserWallets',
        correlationId,
      });
    }
  }
}

