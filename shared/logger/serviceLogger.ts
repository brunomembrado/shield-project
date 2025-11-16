/**
 * Service Logger Factory
 * 
 * Creates logger instances for each service with proper configuration
 * 
 * @module @shield/shared/logger/serviceLogger
 */

import { Logger, LogLevel, createLogger } from './index';

// Service logger instances cache
const loggerInstances: Map<string, Logger> = new Map();

/**
 * Gets or creates a logger instance for a service
 */
export function getServiceLogger(serviceName: string, minLogLevel?: LogLevel): Logger {
  if (!loggerInstances.has(serviceName)) {
    const logLevel = minLogLevel ?? 
      (process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.INFO);
    
    const logger = createLogger(serviceName, logLevel);
    loggerInstances.set(serviceName, logger);
  }

  return loggerInstances.get(serviceName)!;
}

/**
 * Pre-configured loggers for each service
 */
export const authServiceLogger = () => getServiceLogger('auth-service');
export const walletServiceLogger = () => getServiceLogger('wallet-service');
export const transactionServiceLogger = () => getServiceLogger('transaction-service');
export const blockchainServiceLogger = () => getServiceLogger('blockchain-service');
export const complianceServiceLogger = () => getServiceLogger('compliance-service');
export const apiGatewayLogger = () => getServiceLogger('api-gateway');

