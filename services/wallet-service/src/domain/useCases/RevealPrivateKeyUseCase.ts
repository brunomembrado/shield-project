/**
 * Reveal Private Key Use Case
 * 
 * Decrypts and returns the private key of a system-generated wallet
 * Requires password verification and wallet ownership
 * 
 * SECURITY: This is a highly sensitive operation - use with extreme caution
 * 
 * @module wallet-service/domain/useCases
 */

import { IWalletRepository } from '../repositories/IWalletRepository';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  handleUnknownError,
} from '@shield/shared/errors';
import { logInfo, logError } from '@shield/shared/types';
import { decryptPrivateKey, wipeFromMemory } from '../../utils/cryptoUtils';

/**
 * Input for revealing private key
 */
export interface RevealPrivateKeyInput {
  walletId: string;
  userId: string;
  password: string; // User's password used for encryption
}

/**
 * Result of private key revelation
 */
export interface RevealPrivateKeyResult {
  privateKey: string;
  address: string;
  chain: string;
  warning: string;
}

/**
 * Use case for revealing an encrypted private key
 */
export class RevealPrivateKeyUseCase {
  constructor(private walletRepository: IWalletRepository) {}

  /**
   * Executes the private key revelation use case
   * 
   * @param input - Revelation parameters
   * @returns Private key and wallet info with security warning
   * 
   * @throws NotFoundError if wallet doesn't exist
   * @throws AuthorizationError if user doesn't own the wallet
   * @throws ValidationError if wallet wasn't created by system or password is wrong
   */
  async execute(input: RevealPrivateKeyInput): Promise<RevealPrivateKeyResult> {
    let decryptedKey: string | null = null;

    try {
      const { walletId, userId, password } = input;

      // Validate input
      if (!walletId || !userId || !password) {
        throw new ValidationError('Missing required fields', {
          hasWalletId: !!walletId,
          hasUserId: !!userId,
          hasPassword: !!password,
        });
      }

      logInfo('Attempting to reveal private key', {
        walletId,
        userId,
        operation: 'revealPrivateKey',
      });

      // Step 1: Find the wallet
      const wallet = await this.walletRepository.findById(walletId);

      if (!wallet) {
        throw new NotFoundError('Wallet not found', {
          walletId,
        });
      }

      // Step 2: Verify ownership
      if (wallet.userId !== userId) {
        logError('Unauthorized private key access attempt', {
          walletId,
          requestingUserId: userId,
          ownerUserId: wallet.userId,
        });

        throw new AuthorizationError(
          'You do not have permission to access this wallet\'s private key',
          {
            walletId,
            userId,
          }
        );
      }

      // Step 3: Verify wallet was created by system (has encrypted private key)
      if (!wallet.createdBySystem) {
        throw new ValidationError(
          'This wallet was imported by you, not created by our system. Private key is not stored.',
          {
            walletId,
            createdBySystem: wallet.createdBySystem,
          }
        );
      }

      if (
        !wallet.privateKeyEncrypted ||
        !wallet.encryptionIv ||
        !wallet.encryptionSalt
      ) {
        throw new ValidationError(
          'Private key data is missing or corrupted',
          {
            walletId,
            hasEncryptedKey: !!wallet.privateKeyEncrypted,
            hasIv: !!wallet.encryptionIv,
            hasSalt: !!wallet.encryptionSalt,
          }
        );
      }

      // Step 4: Decrypt the private key
      logInfo('Decrypting private key', {
        walletId,
        userId,
      });

      decryptedKey = await decryptPrivateKey(
        wallet.privateKeyEncrypted,
        wallet.encryptionIv,
        wallet.encryptionSalt,
        password
      );

      logInfo('Private key revealed successfully', {
        walletId,
        userId,
        address: wallet.address,
        chain: wallet.chain,
      });

      // Return the private key with a security warning
      return {
        privateKey: decryptedKey,
        address: wallet.address,
        chain: wallet.chain,
        warning:
          '⚠️ SECURITY WARNING: Never share your private key with anyone. ' +
          'Shield will never ask you for your private key. ' +
          'Anyone with access to this key can steal all your funds. ' +
          'Store it securely offline.',
      };
    } catch (error: unknown) {
      if (
        error instanceof ValidationError ||
        error instanceof NotFoundError ||
        error instanceof AuthorizationError
      ) {
        throw error;
      }

      throw handleUnknownError(error, {
        walletId: input.walletId,
        userId: input.userId,
        operation: 'revealPrivateKey',
      });
    } finally {
      // CRITICAL SECURITY: Clear decrypted key from memory after a short delay
      // This gives the caller time to use it, then wipes it
      if (decryptedKey) {
        // Note: Caller should also wipe after use
        setTimeout(() => {
          if (decryptedKey) {
            wipeFromMemory(decryptedKey);
          }
        }, 5000); // 5 second grace period
      }
    }
  }
}

