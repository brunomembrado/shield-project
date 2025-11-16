/**
 * Screen Wallet Use Case
 * 
 * Business logic for wallet screening
 * 
 * @module compliance-service/domain/useCases
 */

import { IComplianceScreeningService } from '../services/IComplianceScreeningService';
import { ChainType } from '../../../../shared/types';
import {
  ServiceError,
  handleUnknownError,
  ValidationError,
  ExternalServiceError,
} from '../../../../shared/errors';
import { isNonEmptyString } from '../../../../shared/utils/guards';

/**
 * Screen Wallet Use Case
 */
export class ScreenWalletUseCase {
  constructor(private readonly screeningService: IComplianceScreeningService) {}

  /**
   * Executes the screen wallet use case
   */
  public async execute(
    address: string,
    chain: ChainType,
    correlationId: string = ''
  ): Promise<unknown> {
    try {
      // Validate input (business logic)
      if (!isNonEmptyString(address)) {
        throw new ValidationError('Address is required', {
          field: 'address',
          value: address,
        });
      }

      // Screen address (business logic)
      const result = await this.screeningService.screenAddress(address);

      return {
        address,
        chain,
        riskLevel: result.riskLevel,
        isSanctioned: result.isSanctioned,
        details: result.details,
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
      throw handleUnknownError(error, 'Failed to screen wallet', {
        address,
        chain,
        operation: 'screenWallet',
        correlationId,
      });
    }
  }
}

