/**
 * Delete Wallet Use Case
 * 
 * Business logic for deleting a wallet
 * 
 * @module wallet-service/domain/useCases
 */

import { IWalletRepository } from '../repositories/IWalletRepository';
import {
  NotFoundError,
  AuthorizationError,
  ServiceError,
  handleUnknownError,
} from '../../../../shared/errors';
import { isNotNull } from '../../../../shared/utils/guards';

/**
 * Delete Wallet Use Case
 */
export class DeleteWalletUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  /**
   * Executes the delete wallet use case
   */
  public async execute(
    walletId: string,
    userId: string,
    correlationId: string = ''
  ): Promise<void> {
    try {
      // Find wallet and ensure ownership
      const wallet = await this.walletRepository.findByIdAndUserId(walletId, userId);

      if (!isNotNull(wallet)) {
        throw new NotFoundError('Wallet');
      }

      // Delete wallet
      await this.walletRepository.delete(walletId);
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
      throw handleUnknownError(error, 'Failed to delete wallet', {
        walletId,
        userId,
        operation: 'deleteWallet',
        correlationId,
      });
    }
  }
}

