/**
 * Get Transaction By ID Use Case
 * 
 * Business logic for retrieving a transaction by ID
 * 
 * @module transaction-service/domain/useCases
 */

import { Transaction } from '../entities/Transaction';
import { ITransactionRepository } from '../repositories/ITransactionRepository';
import {
  NotFoundError,
  AuthorizationError,
  ServiceError,
  handleUnknownError,
} from '../../../../shared/errors';
import { isNotNull } from '../../../../shared/utils/guards';

/**
 * Get Transaction By ID Use Case
 */
export class GetTransactionByIdUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  /**
   * Executes the get transaction by ID use case
   */
  public async execute(
    transactionId: string,
    userId: string,
    correlationId: string = ''
  ): Promise<Transaction> {
    try {
      const transaction = await this.transactionRepository.findByIdAndUserId(
        transactionId,
        userId
      );

      if (!isNotNull(transaction)) {
        throw new NotFoundError('Transaction');
      }

      return transaction;
    } catch (error: unknown) {
      // Re-throw known errors
      if (
        error instanceof NotFoundError ||
        error instanceof AuthorizationError ||
        error instanceof ServiceError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to retrieve transaction', {
        transactionId,
        userId,
        operation: 'getTransactionById',
        correlationId,
      });
    }
  }
}

