/**
 * Blockchain Service - Entry Point
 * 
 * Handles blockchain network interactions for Shield platform:
 * - Polygon (MATIC) network integration
 * - Tron network integration
 * - USDT balance checking
 * - Transaction monitoring and validation
 * 
 * @module blockchain-service
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import blockchainRoutes from './routes';
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

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
setupSecurityHeaders(app);
app.use(cors(corsOptions()));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Routes
app.use('/blockchain', blockchainRoutes);
app.get('/health', healthCheck);

app.get('/', (req, res) => {
  res.json({
    service: 'Shield Blockchain Service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      getBalance: 'GET /blockchain/:chain/balance/:address',
      getTransaction: 'GET /blockchain/:chain/transaction/:hash',
      validateTransaction: 'POST /blockchain/:chain/validate',
      monitorTransfers: 'POST /blockchain/:chain/monitor',
      getNetworkStatus: 'GET /blockchain/:chain/status',
    },
  });
});

// Error handling
app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Route not found',
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        ⛓️  Shield Blockchain Service Started                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Service:     Blockchain Service`);
    console.log(`📡 Port:        ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`❤️  Health:      http://localhost:${PORT}/health`);
    console.log('');
    console.log('📋 Supported Networks:');
    console.log(`   Polygon (MATIC) - USDT Contract: ${process.env.POLYGON_USDT_CONTRACT || '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'}`);
    console.log(`   Tron - USDT Contract: ${process.env.TRON_USDT_CONTRACT || 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'}`);
    console.log('');

    logInfo('Blockchain service started successfully', { port: PORT });
  });

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

  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
}

export default app;

