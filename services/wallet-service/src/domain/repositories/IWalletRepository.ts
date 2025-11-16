/**
 * Wallet Repository Interface
 * 
 * Defines the contract for wallet persistence operations
 * 
 * @module wallet-service/domain/repositories
 */

import { Wallet } from '../entities/Wallet';
import { ChainType } from '@shield/shared/types';

/**
 * Wallet filters
 */
export interface WalletFilters {
  chain?: ChainType;
  isActive?: boolean;
}

/**
 * Wallet repository interface
 */
export interface IWalletRepository {
  /**
   * Finds a wallet by ID
   */
  findById(id: string): Promise<Wallet | null>;

  /**
   * Finds a wallet by ID and user ID (ensures ownership)
   */
  findByIdAndUserId(id: string, userId: string): Promise<Wallet | null>;

  /**
   * Finds all wallets for a user
   */
  findByUserId(userId: string, filters?: WalletFilters): Promise<Wallet[]>;

  /**
   * Finds a wallet by address and user ID
   */
  findByAddressAndUserId(address: string, userId: string): Promise<Wallet | null>;

  /**
   * Saves a new wallet
   */
  save(wallet: Wallet): Promise<Wallet>;

  /**
   * Updates an existing wallet
   */
  update(wallet: Wallet): Promise<Wallet>;

  /**
   * Deletes a wallet by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Checks if a wallet exists with the given address for the user
   */
  existsByAddressAndUserId(address: string, userId: string): Promise<boolean>;
}

