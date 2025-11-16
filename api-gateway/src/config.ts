/**
 * Service Configuration for API Gateway
 * 
 * Defines the URLs and routes for all microservices.
 * 
 * @module api-gateway/config
 */

export interface ServiceConfig {
  name: string;
  url: string;
  path: string;
}

/**
 * Get service configurations from environment variables
 */
export const getServiceConfig = (): ServiceConfig[] => {
  return [
    {
      name: 'auth-service',
      url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      path: '/api/auth',
    },
    {
      name: 'wallet-service',
      url: process.env.WALLET_SERVICE_URL || 'http://localhost:3002',
      path: '/api/wallets',
    },
    {
      name: 'transaction-service',
      url: process.env.TRANSACTION_SERVICE_URL || 'http://localhost:3003',
      path: '/api/transactions',
    },
    {
      name: 'blockchain-service',
      url: process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3004',
      path: '/api/blockchain',
    },
    {
      name: 'compliance-service',
      url: process.env.COMPLIANCE_SERVICE_URL || 'http://localhost:3005',
      path: '/api/compliance',
    },
  ];
};

/**
 * Public routes that don't require authentication
 */
export const publicRoutes = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/refresh',
  '/health',
  '/',
];

