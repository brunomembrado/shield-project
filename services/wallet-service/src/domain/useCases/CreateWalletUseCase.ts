/**
 * Create Wallet Use Case
 * 
 * Business logic for creating a new wallet
 * 
 * @module wallet-service/domain/useCases
 */

import { Wallet } from '../entities/Wallet';
import { IWalletRepository } from '../repositories/IWalletRepository';
import { ChainType } from '@shield/shared/types';
import {
  ConflictError,
  ServiceError,
  handleUnknownError,
  ValidationError,
} from '@shield/shared/errors';
import { isNotNull } from '@shield/shared/utils/guards';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create wallet use case input
 */
export interface CreateWalletInput {
  userId: string;
  chain: ChainType;
  address: string;
  tag?: string;
}

/**
 * Create Wallet Use Case
 */
export class CreateWalletUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  /**
   * Executes the create wallet use case
   */
  public async execute(
    input: CreateWalletInput,
    correlationId: string = ''
  ): Promise<Wallet> {
    try {
      // Check if wallet already exists for this user
      const existingWallet = await this.walletRepository.findByAddressAndUserId(
        input.address,
        input.userId
      );

      if (isNotNull(existingWallet)) {
        throw new ConflictError(
          'This wallet address is already registered for your account'
        );
      }

      // Create wallet entity
      const wallet = Wallet.create(
        uuidv4(),
        input.userId,
        input.chain,
        input.address,
        input.tag || null,
        true
      );

      // Save wallet
      const savedWallet = await this.walletRepository.save(wallet);

      return savedWallet;
    } catch (error: unknown) {
      // Re-throw known errors
      if (
        error instanceof ConflictError ||
        error instanceof ServiceError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to create wallet', {
        userId: input.userId,
        chain: input.chain,
        address: input.address,
        operation: 'createWallet',
        correlationId,
      });
    }
  }
}

