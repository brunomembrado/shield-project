/**
 * Blockchain Service - Entry Point
 * 
 * Handles blockchain network interactions for Shield platform:
 * - Polygon (MATIC) network integration
 * - Tron network integration
 * - USDT balance checking
 * - Transaction monitoring and validation
 * - Wallet verification on blockchain
 * - Gas estimation and balance caching
 * 
 * @module blockchain-service
 */

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { setupSecurityHeaders, errorHandler, authenticate } from '@shield/shared/middleware';
import { logInfo } from '@shield/shared/types';
import { swaggerSpec } from './config/swagger.js';

// ============================================================================
// STEP 1: Initialize Environment (MUST be first!)
// ============================================================================
import { initializeEnvironment } from './config/env.js';

const envConfig = initializeEnvironment();

// ============================================================================
// STEP 2: Initialize Express App
// ============================================================================
const app = express();
const PORT = process.env.PORT || 3004;

// ============================================================================
// STEP 3: Security Middleware (apply early)
// ============================================================================
setupSecurityHeaders(app, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// ============================================================================
// STEP 4: Body Parsing Middleware
// ============================================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// STEP 5: Root & Health Check Endpoints (before auth)
// ============================================================================
app.get('/', (req, res) => {
  res.json({
    service: 'Shield Blockchain Service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    status: 'running',
    environment: envConfig.environment,
    endpoints: {
      health: '/health',
      apiDocs: '/v1/api-docs',
      getBalance: 'GET /v1/blockchain/:chain/balance/:address',
      getTransaction: 'GET /v1/blockchain/:chain/transaction/:hash',
      validateTransaction: 'POST /v1/blockchain/:chain/validate',
      monitorTransfers: 'POST /v1/blockchain/:chain/monitor',
      getNetworkStatus: 'GET /v1/blockchain/:chain/status',
      verifyWallet: 'GET /v1/blockchain/:chain/verify/:address',
      getTokenBalance: 'GET /v1/blockchain/:chain/token-balance/:address',
      estimateGas: 'GET /v1/blockchain/:chain/gas-estimate',
      supportedChains: 'GET /v1/blockchain/supported-chains',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'blockchain-service',
    environment: envConfig.environment,
  });
});

// Swagger API Documentation (v1)
app.use('/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Shield Blockchain Service API Documentation (v1)',
}));

// ============================================================================
// STEP 6: Application Routes (loaded dynamically after env is ready)
// ============================================================================
(async () => {
  try {
    // Dynamic import ensures env vars are loaded before route modules
    const { default: blockchainRoutes } = await import('./routes.js');
    
    // Mount v1 blockchain routes with mandatory authentication layer
    // API versioning allows easy migration to v2 by changing prefix
    app.use('/v1/blockchain', authenticate, blockchainRoutes);

    // ========================================================================
    // STEP 7: Error Handling (after all routes)
    // ========================================================================
    
    // Global error handler
app.use(errorHandler);

    // 404 handler (must be last)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

    // ========================================================================
    // STEP 8: Server Startup
    // ========================================================================
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        ⛓️  Shield Blockchain Service Started                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Service:     Blockchain Service`);
    console.log(`📡 Port:        ${PORT}`);
        console.log(`🌍 Environment: ${envConfig.environment.toUpperCase()}`);
        console.log(`🔑 Auth:        ${envConfig.authServiceUrl}`);
    console.log(`❤️  Health:      http://localhost:${PORT}/health`);
    console.log('');
    console.log('📋 Supported Networks:');
        console.log(`   🔷 Polygon (MATIC)`);
        console.log(`      RPC: ${envConfig.polygonRpcUrl}`);
        console.log(`      USDT: ${envConfig.polygonUsdtAddress}`);
        console.log(`   🔸 Tron`);
        console.log(`      RPC: ${envConfig.tronRpcUrl}`);
        console.log(`      USDT: ${envConfig.tronUsdtAddress}`);
        console.log('');
        console.log('📋 Available Endpoints (v1):');
        console.log(`   GET    /v1/blockchain/:chain/balance/:address         - Get USDT balance`);
        console.log(`   GET    /v1/blockchain/:chain/transaction/:hash        - Get transaction`);
        console.log(`   POST   /v1/blockchain/:chain/validate                 - Validate transaction`);
        console.log(`   POST   /v1/blockchain/:chain/monitor                  - Monitor transfers`);
        console.log(`   GET    /v1/blockchain/:chain/status                   - Network status`);
        console.log(`   GET    /v1/blockchain/:chain/verify/:address          - Verify wallet (direct RPC)`);
        console.log(`   GET    /v1/blockchain/:chain/token-balance/:address   - Get token balance (direct RPC)`);
        console.log(`   GET    /v1/blockchain/:chain/gas-estimate             - Estimate gas (direct RPC)`);
        console.log(`   GET    /v1/blockchain/supported-chains                - List supported chains`);
    console.log('');

        logInfo('Blockchain service started successfully', {
          port: PORT,
          environment: envConfig.environment,
        });
  });

      // Graceful shutdown handlers
  process.on('SIGINT', () => {
    console.log('\n🚦 Shutting down Blockchain Service gracefully...');
    server.close(() => {
      console.log('✅ Blockchain Service shut down successfully.');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\n🚦 Shutting down Blockchain Service gracefully...');
    server.close(() => {
      console.log('✅ Blockchain Service shut down successfully.');
      process.exit(0);
    });
  });

      // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

      // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}
  } catch (error) {
    console.error('❌ Failed to start Blockchain Service:', error);
    process.exit(1);
  }
})();

export default app;

