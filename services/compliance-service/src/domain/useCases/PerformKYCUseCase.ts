/**
 * Perform KYC Use Case
 * 
 * Business logic for KYC verification
 * 
 * @module compliance-service/domain/useCases
 */

import { IComplianceRepository } from '../repositories/IComplianceRepository';
import { IComplianceScreeningService } from '../services/IComplianceScreeningService';
import { EntityType, ComplianceStatus, RiskLevel } from '../../../../shared/types';
import {
  ServiceError,
  handleUnknownError,
  ValidationError,
} from '../../../../shared/errors';
import { isNotNull, isNonEmptyString } from '../../../../shared/utils/guards';
import { v4 as uuidv4 } from 'uuid';

/**
 * KYC data input
 */
export interface KYCInput {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  country?: string;
  documentType?: string;
  documentNumber: string;
}

/**
 * Perform KYC Use Case
 */
export class PerformKYCUseCase {
  constructor(
    private readonly complianceRepository: IComplianceRepository,
    private readonly screeningService: IComplianceScreeningService
  ) {}

  /**
   * Executes the perform KYC use case
   */
  public async execute(
    userId: string,
    kycData: KYCInput,
    correlationId: string = ''
  ): Promise<unknown> {
    try {
      // Validate input (business logic)
      if (!isNonEmptyString(kycData.firstName) || !isNonEmptyString(kycData.lastName) || !isNonEmptyString(kycData.documentNumber)) {
        throw new ValidationError('Missing required KYC fields', {
          fields: {
            firstName: kycData.firstName,
            lastName: kycData.lastName,
            documentNumber: kycData.documentNumber,
          },
        });
      }

      // Screen user (business logic - would check against sanctions lists)
      // For now, use default risk level
      const riskLevel = RiskLevel.LOW;

      // Create compliance check entity
      const complianceCheck = {
        id: uuidv4(),
        entityType: EntityType.USER,
        entityId: userId,
        status: ComplianceStatus.PENDING,
        riskLevel,
        checkType: 'KYC',
        details: {
          firstName: kycData.firstName,
          lastName: kycData.lastName,
          dateOfBirth: kycData.dateOfBirth,
          country: kycData.country,
          documentType: kycData.documentType,
          documentNumber: kycData.documentNumber,
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
      throw handleUnknownError(error, 'Failed to perform KYC check', {
        userId,
        operation: 'performKYC',
        correlationId,
      });
    }
  }
}

