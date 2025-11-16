/**
 * Update Transaction Status Use Case
 * 
 * Business logic for updating transaction status
 * 
 * @module transaction-service/domain/useCases
 */

import { Transaction } from '../entities/Transaction';
import { ITransactionRepository } from '../repositories/ITransactionRepository';
import { TransactionStatus } from '../../../../shared/types';
import {
  NotFoundError,
  AuthorizationError,
  ServiceError,
  handleUnknownError,
  ValidationError,
} from '../../../../shared/errors';
import { isNotNull, isNonEmptyString } from '../../../../shared/utils/guards';

/**
 * Update transaction status use case input
 */
export interface UpdateTransactionStatusInput {
  transactionId: string;
  userId: string;
  status: TransactionStatus;
  txHash?: string;
  fromAddress?: string;
  notes?: string;
}

/**
 * Update Transaction Status Use Case
 */
export class UpdateTransactionStatusUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  /**
   * Executes the update transaction status use case
   */
  public async execute(
    input: UpdateTransactionStatusInput,
    correlationId: string = ''
  ): Promise<Transaction> {
    try {
      // Find transaction and ensure ownership
      const existingTransaction = await this.transactionRepository.findByIdAndUserId(
        input.transactionId,
        input.userId
      );

      if (!isNotNull(existingTransaction)) {
        throw new NotFoundError('Transaction');
      }

      // Update transaction
      let updatedTransaction = existingTransaction.updateStatus(input.status);

      // Update blockchain details if provided
      if (isNonEmptyString(input.txHash) && isNonEmptyString(input.fromAddress)) {
        updatedTransaction = updatedTransaction.updateBlockchainDetails(
          input.txHash,
          input.fromAddress
        );
      }

      // Update notes if provided
      if (isNotNull(input.notes)) {
        updatedTransaction = updatedTransaction.updateNotes(input.notes);
      }

      // Save updated transaction
      const savedTransaction = await this.transactionRepository.update(updatedTransaction);

      return savedTransaction;
    } catch (error: unknown) {
      // Re-throw known errors
      if (
        error instanceof NotFoundError ||
        error instanceof AuthorizationError ||
        error instanceof ServiceError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to update transaction status', {
        transactionId: input.transactionId,
        userId: input.userId,
        status: input.status,
        operation: 'updateTransactionStatus',
        correlationId,
      });
    }
  }
}

