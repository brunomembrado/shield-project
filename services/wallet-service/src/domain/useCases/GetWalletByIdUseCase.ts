/**
 * Get Wallet By ID Use Case
 * 
 * Business logic for retrieving a wallet by ID
 * 
 * @module wallet-service/domain/useCases
 */

import { Wallet } from '../entities/Wallet';
import { IWalletRepository } from '../repositories/IWalletRepository';
import {
  NotFoundError,
  AuthorizationError,
  ServiceError,
  handleUnknownError,
} from '@shield/shared/errors';
import { isNotNull } from '@shield/shared/utils/guards';

/**
 * Get Wallet By ID Use Case
 */
export class GetWalletByIdUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  /**
   * Executes the get wallet by ID use case
   */
  public async execute(
    walletId: string,
    userId: string,
    correlationId: string = ''
  ): Promise<Wallet> {
    try {
      // Find wallet and ensure ownership
      const wallet = await this.walletRepository.findByIdAndUserId(walletId, userId);

      if (!isNotNull(wallet)) {
        throw new NotFoundError('Wallet');
      }

      return wallet;
    } catch (error: unknown) {
      // Re-throw known errors
      if (
        error instanceof NotFoundError ||
        error instanceof AuthorizationError ||
        error instanceof ServiceError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to retrieve wallet', {
        walletId,
        userId,
        operation: 'getWalletById',
        correlationId,
      });
    }
  }
}

