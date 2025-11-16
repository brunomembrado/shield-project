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
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import walletRoutes from './routes';
import {
  corsOptions,
  errorHandler,
  healthCheck,
  requestLogger,
  setupSecurityHeaders,
} from '../../../shared/middleware';
import { logInfo } from '../../../shared/types';

// Load environment variables from service directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceRoot = resolve(__dirname, '..');
const envFilePath = join(serviceRoot, '.env');

const result = dotenv.config({ path: envFilePath });
if (result.error) {
  console.warn(`⚠️  Warning: Could not load .env from ${envFilePath}`);
  console.warn(`   Error: ${result.error.message}`);
  // Fallback to default .env loading
  dotenv.config();
} else {
  const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';
  console.log(`✅ Loaded environment: ${environment}`);
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3002;

// ============================================================================
// Middleware Setup
// ============================================================================

// Security middleware
setupSecurityHeaders(app);

// CORS middleware
app.use(cors(corsOptions()));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// ============================================================================
// Routes
// ============================================================================

// Wallet management routes
app.use('/wallets', walletRoutes);

// Health check endpoint
app.get('/health', healthCheck);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Shield Wallet Service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      createWallet: 'POST /wallets',
      listWallets: 'GET /wallets',
      getWallet: 'GET /wallets/:id',
      updateWallet: 'PUT /wallets/:id',
      deleteWallet: 'DELETE /wallets/:id',
      getStats: 'GET /wallets/stats',
    },
  });
});

// ============================================================================
// Error Handling
// ============================================================================

// Global error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// Server Startup
// ============================================================================

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║           💼 Shield Wallet Service Started                   ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Service:     Wallet Service`);
    console.log(`📡 Port:        ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`❤️  Health:      http://localhost:${PORT}/health`);
    console.log('');
    console.log('📋 Available Endpoints:');
    console.log(`   POST   /wallets         - Create new wallet`);
    console.log(`   GET    /wallets         - Get all wallets`);
    console.log(`   GET    /wallets/:id     - Get specific wallet`);
    console.log(`   PUT    /wallets/:id     - Update wallet`);
    console.log(`   DELETE /wallets/:id     - Delete wallet`);
    console.log(`   GET    /wallets/stats   - Get wallet statistics`);
    console.log('');

    logInfo('Wallet service started successfully', { port: PORT });
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

export default app;

