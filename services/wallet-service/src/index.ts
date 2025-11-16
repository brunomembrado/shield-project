/**
 * Wallet Service - Entry Point
 * 
 * Handles wallet management for Shield platform:
 * - Create, read, update, delete wallet addresses
 * - Support for Polygon and Tron networks
 * - Wallet filtering and statistics
 * 
 * @module wallet-service
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
const PORT = process.env.PORT || 3002;

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
    service: 'Shield Wallet Service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    status: 'running',
    environment: envConfig.environment,
    endpoints: {
      health: '/health',
      createWallet: 'POST /v1/wallets',
      generateWallet: 'POST /v1/wallets/generate',
      listWallets: 'GET /v1/wallets',
      getWallet: 'GET /v1/wallets/:id',
      updateWallet: 'PUT /v1/wallets/:id',
      deleteWallet: 'DELETE /v1/wallets/:id',
      revealPrivateKey: 'POST /v1/wallets/:id/reveal-key',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'wallet-service',
    environment: envConfig.environment,
  });
});

// Swagger API Documentation (v1)
app.use('/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Shield Wallet Service API Documentation (v1)',
}));

// ============================================================================
// STEP 6: Application Routes (loaded dynamically after env is ready)
// ============================================================================
(async () => {
  try {
    // Dynamic import ensures env vars are loaded before route modules
    const { default: walletRoutes } = await import('./routes.js');
    
    // Mount v1 wallet routes with mandatory authentication layer
    // API versioning allows easy migration to v2 by changing prefix
    app.use('/v1/wallets', authenticate, walletRoutes);

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
        console.log('║           💼 Shield Wallet Service Started                   ║');
        console.log('╚═══════════════════════════════════════════════════════════════╝');
        console.log('');
        console.log(`🚀 Service:     Wallet Service`);
        console.log(`📡 Port:        ${PORT}`);
        console.log(`🌍 Environment: ${envConfig.environment.toUpperCase()}`);
        console.log(`🔑 Auth:        ${envConfig.authServiceUrl}`);
        console.log(`❤️  Health:      http://localhost:${PORT}/health`);
        console.log('');
        console.log('📋 Available Endpoints (v1):');
        console.log(`   POST   /v1/wallets         - Create new wallet`);
        console.log(`   POST   /v1/wallets/generate - Generate new wallet`);
        console.log(`   GET    /v1/wallets         - Get all wallets`);
        console.log(`   GET    /v1/wallets/:id     - Get specific wallet`);
        console.log(`   PUT    /v1/wallets/:id     - Update wallet`);
        console.log(`   DELETE /v1/wallets/:id     - Delete wallet`);
        console.log(`   POST   /v1/wallets/:id/reveal-key - Reveal private key`);
        console.log('');

        logInfo('Wallet service started successfully', {
          port: PORT,
          environment: envConfig.environment,
        });
      });

      // Graceful shutdown handlers
      process.on('SIGINT', () => {
        console.log('\n🚦 Shutting down Wallet Service gracefully...');
        server.close(() => {
          console.log('✅ Wallet Service shut down successfully.');
          process.exit(0);
        });
      });

      process.on('SIGTERM', () => {
        console.log('\n🚦 Shutting down Wallet Service gracefully...');
        server.close(() => {
          console.log('✅ Wallet Service shut down successfully.');
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
    console.error('❌ Failed to start Wallet Service:', error);
    process.exit(1);
  }
})();

export default app;
