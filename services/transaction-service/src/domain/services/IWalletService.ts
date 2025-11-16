/**
 * Wallet Service Interface
 * 
 * Defines the contract for wallet operations
 * Used to fetch wallet information from wallet-service
 * 
 * @module transaction-service/domain/services
 */

import { ChainType } from '../../../../shared/types';

/**
 * Wallet service interface
 */
export interface IWalletService {
  /**
   * Gets wallet address for a given wallet ID
   */
  getWalletAddress(walletId: string, chain: ChainType): Promise<string>;
}

