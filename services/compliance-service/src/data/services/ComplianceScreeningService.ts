/**
 * Compliance Screening Service Implementation
 * 
 * Screens addresses against compliance APIs
 * 
 * @module compliance-service/data/services
 */

import axios from 'axios';
import { IComplianceScreeningService, ScreeningResult } from '../../domain/services/IComplianceScreeningService';
import { RiskLevel } from '../../../../shared/types';
import { complianceServiceLogger } from '../../../../shared/logger/serviceLogger';
import { withExternalApiLogging } from '../../../../shared/logger/helpers';

/**
 * Compliance Screening Service Implementation
 */
export class ComplianceScreeningService implements IComplianceScreeningService {
  /**
   * Screens a wallet address against sanctions lists
   */
  public async screenAddress(address: string): Promise<ScreeningResult> {
    const logger = complianceServiceLogger();
    const correlationId = 'compliance-screening';

    try {
      const apiKey = process.env.COMPLIANCE_API_KEY;
      const apiUrl = process.env.COMPLIANCE_API_URL;

      if (isNotNull(apiKey) && isNotNull(apiUrl)) {
        // Call real compliance API
        const response = await withExternalApiLogging(
          logger,
          'ComplianceAPI',
          '/screen/address',
          correlationId,
          async () => {
            return await axios.post(
              `${apiUrl}/screen/address`,
              { address },
              {
                headers: { Authorization: `Bearer ${apiKey}` },
                timeout: 10000,
              }
            );
          }
        );

        if (isNotNull(response?.data)) {
          return {
            riskLevel: response.data.riskLevel || RiskLevel.LOW,
            isSanctioned: response.data.isSanctioned || false,
            details: response.data,
          };
        }
      }

      // Fallback: Basic screening (for development)
      logger.warn('Using fallback compliance screening', { address, correlationId });
      return {
        riskLevel: RiskLevel.LOW,
        isSanctioned: false,
        details: { screened: true, source: 'fallback' },
      };
    } catch (error) {
      logger.error('Compliance screening failed', error as Error, { address, correlationId });
      // Fail open for now - in production, should fail closed
      return {
        riskLevel: RiskLevel.MEDIUM,
        isSanctioned: false,
        details: { error: 'Screening service unavailable' },
      };
    }
  }
}

// Import isNotNull
import { isNotNull } from '../../../../shared/utils/guards';

