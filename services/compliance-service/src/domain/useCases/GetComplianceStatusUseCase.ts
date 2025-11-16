/**
 * Get Compliance Status Use Case
 * 
 * Business logic for retrieving compliance check status
 * 
 * @module compliance-service/domain/useCases
 */

import { IComplianceRepository } from '../repositories/IComplianceRepository';
import {
  NotFoundError,
  ServiceError,
  handleUnknownError,
} from '../../../../shared/errors';
import { isNotNull } from '../../../../shared/utils/guards';

/**
 * Get Compliance Status Use Case
 */
export class GetComplianceStatusUseCase {
  constructor(private readonly complianceRepository: IComplianceRepository) {}

  /**
   * Executes the get compliance status use case
   */
  public async execute(
    checkId: string,
    correlationId: string = ''
  ): Promise<unknown> {
    try {
      // Find compliance check (delegate to repository)
      const check = await this.complianceRepository.findById(checkId);

      if (!isNotNull(check)) {
        throw new NotFoundError('Compliance check');
      }

      return check;
    } catch (error: unknown) {
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof ServiceError) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to retrieve compliance status', {
        checkId,
        operation: 'getComplianceStatus',
        correlationId,
      });
    }
  }
}

