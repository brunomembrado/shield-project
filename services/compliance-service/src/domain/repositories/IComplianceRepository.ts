/**
 * Compliance Repository Interface
 * 
 * Defines the contract for compliance check persistence operations
 * 
 * @module compliance-service/domain/repositories
 */

import { ComplianceStatus, RiskLevel, EntityType } from '../../../../shared/types';

/**
 * Compliance check domain entity
 */
export interface ComplianceCheck {
  id: string;
  entityType: EntityType;
  entityId: string;
  status: ComplianceStatus;
  riskLevel: RiskLevel;
  checkType: string;
  details: Record<string, unknown>;
  reviewNotes: string | null;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Compliance repository interface
 */
export interface IComplianceRepository {
  /**
   * Finds a compliance check by ID
   */
  findById(id: string): Promise<ComplianceCheck | null>;

  /**
   * Saves a new compliance check
   */
  save(check: ComplianceCheck): Promise<ComplianceCheck>;

  /**
   * Updates an existing compliance check
   */
  update(check: ComplianceCheck): Promise<ComplianceCheck>;
}

