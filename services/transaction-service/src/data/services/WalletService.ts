/**
 * Wallet Service Implementation
 * 
 * Fetches wallet information from wallet-service
 * 
 * @module transaction-service/data/services
 */

import { IWalletService } from '../../domain/services/IWalletService';
import { ChainType } from '../../../../shared/types';
import { isNotNull } from '../../../../shared/utils/guards';

/**
 * Wallet Service Implementation
 * 
 * In production, this would make HTTP calls to wallet-service
 * For now, uses environment variables as fallback
 */
export class WalletService implements IWalletService {
  /**
   * Gets wallet address for a given wallet ID
   */
  public async getWalletAddress(walletId: string, chain: ChainType): Promise<string> {
    // In production, this would call wallet-service API
    // For now, return Shield wallet address from environment
    if (chain === ChainType.POLYGON) {
      const address = process.env.SHIELD_POLYGON_WALLET_ADDRESS;
      if (!isNotNull(address)) {
        throw new Error('SHIELD_POLYGON_WALLET_ADDRESS is not configured');
      }
      return address;
    }

    const address = process.env.SHIELD_TRON_WALLET_ADDRESS;
    if (!isNotNull(address)) {
      throw new Error('SHIELD_TRON_WALLET_ADDRESS is not configured');
    }
    return address;
  }
}

