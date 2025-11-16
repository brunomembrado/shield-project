/**
 * Generate Wallet Use Case
 * 
 * Generates a new blockchain wallet, encrypts the private key, and stores it securely
 * This creates a wallet ON-CHAIN (not imported) with encrypted private key storage
 * 
 * @module wallet-service/domain/useCases
 */

import { IWalletRepository } from '../repositories/IWalletRepository';
import { Wallet } from '../entities/Wallet';
import { 
  ValidationError, 
  ConflictError,
  handleUnknownError 
} from '@shield/shared/errors';
import { logInfo } from '@shield/shared/types';
import { generateWallet, type ChainType } from '../../utils/walletGenerator';
import { encryptPrivateKey, wipeFromMemory } from '../../utils/cryptoUtils';

/**
 * Input for wallet generation
 */
export interface GenerateWalletInput {
  userId: string;
  chain: ChainType;
  password: string; // User's password for encrypting the private key
  tag?: string;
}

/**
 * Use case for generating a new blockchain wallet
 */
export class GenerateWalletUseCase {
  constructor(private walletRepository: IWalletRepository) {}

  /**
   * Executes the wallet generation use case
   * 
   * @param input - Wallet generation parameters
   * @returns Generated wallet entity
   * 
   * @throws ValidationError if input is invalid or password is weak
   * @throws ConflictError if wallet address already exists for this user
   */
  async execute(input: GenerateWalletInput): Promise<Wallet> {
    let privateKey: string | null = null;

    try {
      const { userId, chain, password, tag } = input;

      // Validate required fields
      if (!userId || !chain || !password) {
        throw new ValidationError('Missing required fields for wallet generation', {
          hasUserId: !!userId,
          hasChain: !!chain,
          hasPassword: !!password,
        });
      }

      // Validate chain
      if (chain !== 'POLYGON' && chain !== 'TRON') {
        throw new ValidationError('Invalid blockchain network', {
          providedChain: chain,
          supportedChains: ['POLYGON', 'TRON'],
        });
      }

      // Validate password strength
      if (password.length < 8) {
        throw new ValidationError(
          'Password must be at least 8 characters long for private key encryption',
          { providedLength: password.length }
        );
      }

      logInfo('Generating new blockchain wallet', {
        userId,
        chain,
        operation: 'generateWallet',
      });

      // Step 1: Generate wallet on blockchain
      const generated = await generateWallet(chain);
      privateKey = generated.privateKey;

      logInfo('Blockchain wallet generated successfully', {
        userId,
        chain,
        address: generated.address,
      });

      // Step 2: Check if address already exists for this user
      const existing = await this.walletRepository.findByAddressAndUserId(
        generated.address,
        userId
      );

      if (existing) {
        // Extremely unlikely but possible
        throw new ConflictError(
          'This wallet address already exists for your account (collision)',
          {
            address: generated.address,
            existingWalletId: existing.id,
          }
        );
      }

      // Step 3: Encrypt the private key with user's password
      logInfo('Encrypting private key', {
        userId,
        chain,
      });

      const encryptionResult = await encryptPrivateKey(privateKey, password);

      // Step 4: Create wallet entity with encrypted private key
      const wallet = Wallet.createWithEncryption({
        userId,
        chain,
        address: generated.address,
        tag: tag || `${chain} Wallet`,
        privateKeyEncrypted: encryptionResult.encryptedData,
        encryptionIv: encryptionResult.iv,
        encryptionSalt: encryptionResult.salt,
      });

      // Step 5: Save to database
      const savedWallet = await this.walletRepository.save(wallet);

      logInfo('Wallet created and stored successfully', {
        userId,
        chain,
        walletId: savedWallet.id,
        address: savedWallet.address,
        createdBySystem: true,
      });

      return savedWallet;
    } catch (error: unknown) {
      if (
        error instanceof ValidationError ||
        error instanceof ConflictError
      ) {
        throw error;
      }

      throw handleUnknownError(error, {
        userId: input.userId,
        chain: input.chain,
        operation: 'generateWallet',
      });
    } finally {
      // CRITICAL SECURITY: Wipe private key from memory
      if (privateKey) {
        wipeFromMemory(privateKey);
        privateKey = null;
      }
    }
  }
}

