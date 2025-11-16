/**
 * Update Wallet Use Case
 * 
 * Business logic for updating a wallet
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
 * Update wallet use case input
 */
export interface UpdateWalletInput {
  walletId: string;
  userId: string;
  tag?: string;
  isActive?: boolean;
}

/**
 * Update Wallet Use Case
 */
export class UpdateWalletUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  /**
   * Executes the update wallet use case
   */
  public async execute(
    input: UpdateWalletInput,
    correlationId: string = ''
  ): Promise<Wallet> {
    try {
      // Find wallet and ensure ownership
      const existingWallet = await this.walletRepository.findByIdAndUserId(
        input.walletId,
        input.userId
      );

      if (!isNotNull(existingWallet)) {
        throw new NotFoundError('Wallet');
      }

      // Update wallet
      let updatedWallet = existingWallet;

      if (isNotNull(input.tag)) {
        updatedWallet = updatedWallet.updateTag(input.tag);
      }

      if (isNotNull(input.isActive)) {
        updatedWallet = input.isActive
          ? updatedWallet.activate()
          : updatedWallet.deactivate();
      }

      // Save updated wallet
      const savedWallet = await this.walletRepository.update(updatedWallet);

      return savedWallet;
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
      throw handleUnknownError(error, 'Failed to update wallet', {
        walletId: input.walletId,
        userId: input.userId,
        operation: 'updateWallet',
        correlationId,
      });
    }
  }
}

