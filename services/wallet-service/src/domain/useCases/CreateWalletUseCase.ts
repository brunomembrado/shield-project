/**
 * Create Wallet Use Case
 * 
 * Business logic for creating a new wallet (importing existing wallet)
 * Verifies wallet exists on blockchain before import
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
import axios from 'axios';

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
 * Create Wallet Use Case (Import Wallet)
 */
export class CreateWalletUseCase {
  constructor(private readonly walletRepository: IWalletRepository) {}

  /**
   * Executes the create wallet use case
   * Verifies wallet on blockchain before import
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

      // ✨ NEW: Verify wallet exists on blockchain before import
      await this.verifyWalletOnChain(input.chain, input.address);

      // Create wallet entity (not system-generated, imported by user)
      const wallet = Wallet.create(
        uuidv4(),
        input.userId,
        input.chain,
        input.address,
        input.tag || null,
        true,
        false // createdBySystem = false for imported wallets
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

  /**
   * Verifies wallet exists on blockchain via blockchain-service
   * 
   * @param chain - Blockchain network
   * @param address - Wallet address to verify
   * @throws ValidationError if wallet doesn't exist on chain
   * @throws ServiceError if blockchain service is unavailable
   */
  private async verifyWalletOnChain(chain: ChainType, address: string): Promise<void> {
    try {
      const blockchainServiceUrl = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3004';
      const verifyUrl = `${blockchainServiceUrl}/blockchain/${chain}/verify/${address}`;

      // Call blockchain-service to verify wallet
      const response = await axios.get(verifyUrl, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Check if wallet exists on chain
      if (!response.data?.success || !response.data?.data?.exists) {
        throw new ValidationError(
          `Wallet address does not exist on ${chain} blockchain. Please check the address and try again.`,
          {
            chain,
            address,
            exists: response.data?.data?.exists || false,
            hasActivity: response.data?.data?.hasActivity || false,
          }
        );
      }

      // Log successful verification (info only, don't fail if wallet has no activity)
      const verification = response.data.data;
      console.log(`✅ Wallet verified on ${chain}:`, {
        address,
        exists: verification.exists,
        hasActivity: verification.hasActivity,
        transactionCount: verification.transactionCount,
      });

    } catch (error: unknown) {
      // Re-throw ValidationError (wallet doesn't exist)
      if (error instanceof ValidationError) {
        throw error;
      }

      // Handle axios errors
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          throw new ServiceError(
            'Blockchain verification service is currently unavailable. Please try again later.',
            {
              chain,
              address,
              service: 'blockchain-service',
              error: error.message,
            }
          );
        }

        // Handle HTTP errors
        if (error.response) {
          throw new ServiceError(
            `Failed to verify wallet on blockchain: ${error.response.data?.message || error.message}`,
            {
              chain,
              address,
              statusCode: error.response.status,
              service: 'blockchain-service',
            }
          );
        }
      }

      // Unknown error
      throw new ServiceError(
        'Failed to verify wallet on blockchain due to an unexpected error',
        {
          chain,
          address,
          error: (error as Error).message,
        }
      );
    }
  }
}

