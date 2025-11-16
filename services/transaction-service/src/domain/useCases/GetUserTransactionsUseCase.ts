/**
 * Get User Transactions Use Case
 * 
 * Business logic for retrieving user transactions
 * 
 * @module transaction-service/domain/useCases
 */

import { Transaction } from '../entities/Transaction';
import { ITransactionRepository } from '../repositories/ITransactionRepository';
import { TransactionFilters } from '../repositories/ITransactionRepository';
import {
  ServiceError,
  handleUnknownError,
} from '../../../../shared/errors';

/**
 * Get user transactions result
 */
export interface GetUserTransactionsResult {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get User Transactions Use Case
 */
export class GetUserTransactionsUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  /**
   * Executes the get user transactions use case
   */
  public async execute(
    userId: string,
    filters?: TransactionFilters,
    correlationId: string = ''
  ): Promise<GetUserTransactionsResult> {
    try {
      const [transactions, total] = await Promise.all([
        this.transactionRepository.findByUserId(userId, filters),
        this.transactionRepository.countByUserId(userId, filters),
      ]);

      return {
        transactions,
        total,
        limit: filters?.limit || 20,
        offset: filters?.offset || 0,
      };
    } catch (error: unknown) {
      // Re-throw known errors
      if (error instanceof ServiceError) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to retrieve transactions', {
        userId,
        filters,
        operation: 'getUserTransactions',
        correlationId,
      });
    }
  }
}

