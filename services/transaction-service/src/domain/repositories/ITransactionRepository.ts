/**
 * Transaction Repository Interface
 * 
 * Defines the contract for transaction persistence operations
 * 
 * @module transaction-service/domain/repositories
 */

import { Transaction } from '../entities/Transaction';
import { ChainType, TransactionStatus } from '../../../../shared/types';

/**
 * Transaction filters
 */
export interface TransactionFilters {
  chain?: ChainType;
  status?: TransactionStatus;
  limit?: number;
  offset?: number;
}

/**
 * Transaction repository interface
 */
export interface ITransactionRepository {
  /**
   * Finds a transaction by ID
   */
  findById(id: string): Promise<Transaction | null>;

  /**
   * Finds a transaction by ID and user ID (ensures ownership)
   */
  findByIdAndUserId(id: string, userId: string): Promise<Transaction | null>;

  /**
   * Finds a transaction by transaction hash
   */
  findByTxHash(txHash: string): Promise<Transaction | null>;

  /**
   * Finds all transactions for a user
   */
  findByUserId(userId: string, filters?: TransactionFilters): Promise<Transaction[]>;

  /**
   * Counts transactions for a user
   */
  countByUserId(userId: string, filters?: TransactionFilters): Promise<number>;

  /**
   * Saves a new transaction
   */
  save(transaction: Transaction): Promise<Transaction>;

  /**
   * Updates an existing transaction
   */
  update(transaction: Transaction): Promise<Transaction>;

  /**
   * Deletes a transaction by ID
   */
  delete(id: string): Promise<void>;
}

