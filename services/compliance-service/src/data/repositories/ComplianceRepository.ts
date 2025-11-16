/**
 * Compliance Repository Implementation
 * 
 * Prisma-based implementation of IComplianceRepository
 * 
 * @module compliance-service/data/repositories
 */

import { PrismaClient } from '@prisma/client';
import { IComplianceRepository, ComplianceCheck } from '../../domain/repositories/IComplianceRepository';
import { DatabaseConnection } from '../../../../shared/database/DatabaseConnection';
import { isNotNull } from '../../../../shared/utils/guards';

/**
 * Compliance Repository Implementation
 */
export class ComplianceRepository implements IComplianceRepository {
  private get prisma(): PrismaClient {
    return DatabaseConnection.getInstance().getClient();
  }

  /**
   * Finds a compliance check by ID
   */
  public async findById(id: string): Promise<ComplianceCheck | null> {
    const checkData = await this.prisma.complianceCheck.findUnique({
      where: { id },
    });

    if (!isNotNull(checkData)) {
      return null;
    }

    return {
      id: checkData.id,
      entityType: checkData.entityType as ComplianceCheck['entityType'],
      entityId: checkData.entityId,
      status: checkData.status as ComplianceCheck['status'],
      riskLevel: checkData.riskLevel as ComplianceCheck['riskLevel'],
      checkType: checkData.checkType,
      details: checkData.details as Record<string, unknown>,
      reviewNotes: checkData.reviewNotes,
      reviewedBy: checkData.reviewedBy,
      createdAt: checkData.createdAt,
      updatedAt: checkData.updatedAt,
    };
  }

  /**
   * Saves a new compliance check
   */
  public async save(check: ComplianceCheck): Promise<ComplianceCheck> {
    const checkData = await this.prisma.complianceCheck.create({
      data: {
        id: check.id,
        entityType: check.entityType,
        entityId: check.entityId,
        status: check.status,
        riskLevel: check.riskLevel,
        checkType: check.checkType,
        details: check.details,
        reviewNotes: check.reviewNotes,
        reviewedBy: check.reviewedBy,
        createdAt: check.createdAt,
        updatedAt: check.updatedAt,
      },
    });

    return {
      id: checkData.id,
      entityType: checkData.entityType as ComplianceCheck['entityType'],
      entityId: checkData.entityId,
      status: checkData.status as ComplianceCheck['status'],
      riskLevel: checkData.riskLevel as ComplianceCheck['riskLevel'],
      checkType: checkData.checkType,
      details: checkData.details as Record<string, unknown>,
      reviewNotes: checkData.reviewNotes,
      reviewedBy: checkData.reviewedBy,
      createdAt: checkData.createdAt,
      updatedAt: checkData.updatedAt,
    };
  }

  /**
   * Updates an existing compliance check
   */
  public async update(check: ComplianceCheck): Promise<ComplianceCheck> {
    const checkData = await this.prisma.complianceCheck.update({
      where: { id: check.id },
      data: {
        status: check.status,
        riskLevel: check.riskLevel,
        reviewNotes: check.reviewNotes,
        reviewedBy: check.reviewedBy,
        updatedAt: check.updatedAt,
      },
    });

    return {
      id: checkData.id,
      entityType: checkData.entityType as ComplianceCheck['entityType'],
      entityId: checkData.entityId,
      status: checkData.status as ComplianceCheck['status'],
      riskLevel: checkData.riskLevel as ComplianceCheck['riskLevel'],
      checkType: checkData.checkType,
      details: checkData.details as Record<string, unknown>,
      reviewNotes: checkData.reviewNotes,
      reviewedBy: checkData.reviewedBy,
      createdAt: checkData.createdAt,
      updatedAt: checkData.updatedAt,
    };
  }
}

