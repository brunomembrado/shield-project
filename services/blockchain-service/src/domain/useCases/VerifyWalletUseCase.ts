/**
 * Verify Wallet Use Case - Domain Layer
 * 
 * Verifies wallet address exists on blockchain (DIRECT RPC CALL - NO CACHE)
 * 
 * @module blockchain-service/domain/useCases
 */

import { ChainType } from '@shield/shared/types';
import { IBlockchainClient } from '../services/IBlockchainClient';
import { ValidationError } from '@shield/shared/errors';

export interface VerifyWalletResult {
  chain: ChainType;
  address: string;
  exists: boolean;
  hasActivity: boolean;
  balance?: string;
  transactionCount: number;
}

/**
 * Verifies wallet address on blockchain
 * Every call goes directly to blockchain RPC
 */
export class VerifyWalletUseCase {
  constructor(private readonly blockchainClient: IBlockchainClient) {}

  public async execute(
    chain: ChainType,
    address: string,
    correlationId: string = ''
  ): Promise<VerifyWalletResult> {
    // Validate address format
    if (!this.isValidAddress(chain, address)) {
      throw new ValidationError(`Invalid ${chain} address format: ${address}`, {
        chain,
        address,
        correlationId,
      });
    }

    // ✅ DIRECT BLOCKCHAIN CALL - NO CACHE
    try {
      // Get transaction count (nonce for Polygon, transaction count for Tron)
      const transactionCount = await this.blockchainClient.getTransactionCount(chain, address);
      
      // Get balance (native token balance as existence check)
      const balance = await this.blockchainClient.getNativeBalance(chain, address);

      // Wallet exists if it has balance or transaction count > 0
      const exists = BigInt(balance) > 0 || transactionCount > 0;
      const hasActivity = transactionCount > 0;

      return {
        chain,
        address,
        exists,
        hasActivity,
        balance,
        transactionCount,
      };
    } catch (error) {
      // If we can't verify, assume wallet doesn't exist
      return {
        chain,
        address,
        exists: false,
        hasActivity: false,
        transactionCount: 0,
      };
    }
  }

  private isValidAddress(chain: ChainType, address: string): boolean {
    if (chain === ChainType.POLYGON) {
      // Ethereum/Polygon address format: 0x followed by 40 hex characters
      return /^0x[0-9a-fA-F]{40}$/.test(address);
    } else if (chain === ChainType.TRON) {
      // Tron address format: T followed by 33 base58 characters
      return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
    }
    return false;
  }
}

