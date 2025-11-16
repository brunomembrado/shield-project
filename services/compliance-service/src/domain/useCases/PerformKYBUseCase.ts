/**
 * Perform KYB Use Case
 * 
 * Business logic for KYB verification
 * 
 * @module compliance-service/domain/useCases
 */

import { IComplianceRepository } from '../repositories/IComplianceRepository';
import { EntityType, ComplianceStatus, RiskLevel } from '../../../../shared/types';
import {
  ServiceError,
  handleUnknownError,
  ValidationError,
} from '../../../../shared/errors';
import { isNotNull, isNonEmptyString } from '../../../../shared/utils/guards';
import { v4 as uuidv4 } from 'uuid';

/**
 * KYB data input
 */
export interface KYBInput {
  businessName: string;
  registrationNumber: string;
  country?: string;
  businessType?: string;
  taxId?: string;
}

/**
 * Perform KYB Use Case
 */
export class PerformKYBUseCase {
  constructor(private readonly complianceRepository: IComplianceRepository) {}

  /**
   * Executes the perform KYB use case
   */
  public async execute(
    userId: string,
    kybData: KYBInput,
    correlationId: string = ''
  ): Promise<unknown> {
    try {
      // Validate input (business logic)
      if (!isNonEmptyString(kybData.businessName) || !isNonEmptyString(kybData.registrationNumber)) {
        throw new ValidationError('Missing required KYB fields', {
          fields: {
            businessName: kybData.businessName,
            registrationNumber: kybData.registrationNumber,
          },
        });
      }

      // Create compliance check entity
      const complianceCheck = {
        id: uuidv4(),
        entityType: EntityType.BUSINESS,
        entityId: userId,
        status: ComplianceStatus.PENDING,
        riskLevel: RiskLevel.LOW,
        checkType: 'KYB',
        details: {
          businessName: kybData.businessName,
          registrationNumber: kybData.registrationNumber,
          country: kybData.country,
          businessType: kybData.businessType,
          taxId: kybData.taxId,
        },
        reviewNotes: null,
        reviewedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save compliance check (delegate to repository)
      const savedCheck = await this.complianceRepository.save(complianceCheck);

      return savedCheck;
    } catch (error: unknown) {
      // Re-throw known errors
      if (error instanceof ServiceError || error instanceof ValidationError) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to perform KYB check', {
        userId,
        operation: 'performKYB',
        correlationId,
      });
    }
  }
}

