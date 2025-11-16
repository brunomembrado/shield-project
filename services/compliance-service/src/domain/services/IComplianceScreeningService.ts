/**
 * Compliance Screening Service Interface
 * 
 * Defines the contract for compliance screening operations
 * 
 * @module compliance-service/domain/services
 */

import { RiskLevel } from '../../../../shared/types';

/**
 * Screening result
 */
export interface ScreeningResult {
  riskLevel: RiskLevel;
  isSanctioned: boolean;
  details: Record<string, unknown>;
}

/**
 * Compliance screening service interface
 */
export interface IComplianceScreeningService {
  /**
   * Screens a wallet address against sanctions lists
   */
  screenAddress(address: string): Promise<ScreeningResult>;
}

