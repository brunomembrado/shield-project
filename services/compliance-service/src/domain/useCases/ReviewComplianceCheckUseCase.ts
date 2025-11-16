/**
 * Review Compliance Check Use Case
 * 
 * Business logic for reviewing compliance checks
 * 
 * @module compliance-service/domain/useCases
 */

import { IComplianceRepository } from '../repositories/IComplianceRepository';
import { ComplianceStatus } from '../../../../shared/types';
import {
  NotFoundError,
  ServiceError,
  handleUnknownError,
  ValidationError,
} from '../../../../shared/errors';
import { isNotNull, isNonEmptyString } from '../../../../shared/utils/guards';

/**
 * Review compliance check input
 */
export interface ReviewComplianceCheckInput {
  checkId: string;
  reviewerId: string;
  decision: 'APPROVED' | 'REJECTED';
  notes?: string;
}

/**
 * Review Compliance Check Use Case
 */
export class ReviewComplianceCheckUseCase {
  constructor(private readonly complianceRepository: IComplianceRepository) {}

  /**
   * Executes the review compliance check use case
   */
  public async execute(
    input: ReviewComplianceCheckInput,
    correlationId: string = ''
  ): Promise<unknown> {
    try {
      // Find compliance check (delegate to repository)
      const check = await this.complianceRepository.findById(input.checkId);

      if (!isNotNull(check)) {
        throw new NotFoundError('Compliance check');
      }

      // Update compliance check (business logic)
      const updatedCheck = {
        ...check,
        status: input.decision === 'APPROVED' ? ComplianceStatus.APPROVED : ComplianceStatus.REJECTED,
        reviewNotes: input.notes || null,
        reviewedBy: input.reviewerId,
        updatedAt: new Date(),
      };

      // Save updated check (delegate to repository)
      const savedCheck = await this.complianceRepository.update(updatedCheck);

      return savedCheck;
    } catch (error: unknown) {
      // Re-throw known errors
      if (
        error instanceof NotFoundError ||
        error instanceof ServiceError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to review compliance check', {
        checkId: input.checkId,
        reviewerId: input.reviewerId,
        decision: input.decision,
        operation: 'reviewComplianceCheck',
        correlationId,
      });
    }
  }
}

