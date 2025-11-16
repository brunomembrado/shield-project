/**
 * Screen Transaction Use Case
 * 
 * Business logic for transaction screening
 * 
 * @module compliance-service/domain/useCases
 */

import { IComplianceScreeningService } from '../services/IComplianceScreeningService';
import {
  ServiceError,
  handleUnknownError,
  ValidationError,
  ExternalServiceError,
} from '../../../../shared/errors';
import { isNonEmptyString, isNotNull } from '../../../../shared/utils/guards';

/**
 * Screen Transaction Use Case
 */
export class ScreenTransactionUseCase {
  constructor(private readonly screeningService: IComplianceScreeningService) {}

  /**
   * Executes the screen transaction use case
   */
  public async execute(
    transactionId: string,
    fromAddress: string,
    amount: string,
    correlationId: string = ''
  ): Promise<unknown> {
    try {
      // Validate input (business logic)
      if (!isNonEmptyString(transactionId)) {
        throw new ValidationError('Transaction ID is required', {
          field: 'transactionId',
        });
      }

      if (!isNonEmptyString(fromAddress)) {
        throw new ValidationError('From address is required', {
          field: 'fromAddress',
        });
      }

      if (!isNotNull(amount)) {
        throw new ValidationError('Amount is required', {
          field: 'amount',
        });
      }

      // Screen address (business logic)
      const screeningResult = await this.screeningService.screenAddress(fromAddress);

      return {
        transactionId,
        fromAddress,
        amount,
        riskLevel: screeningResult.riskLevel,
        isSanctioned: screeningResult.isSanctioned,
        details: screeningResult.details,
      };
    } catch (error: unknown) {
      // Re-throw known errors
      if (
        error instanceof ServiceError ||
        error instanceof ValidationError ||
        error instanceof ExternalServiceError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to screen transaction', {
        transactionId,
        fromAddress,
        amount,
        operation: 'screenTransaction',
        correlationId,
      });
    }
  }
}

