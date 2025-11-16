/**
 * Transaction Service - Entry Point
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import transactionRoutes from './routes';
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
const PORT = process.env.PORT || 3003;

setupSecurityHeaders(app);
app.use(cors(corsOptions()));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

app.use('/transactions', transactionRoutes);
app.get('/health', healthCheck);

app.get('/', (req, res) => {
  res.json({
    service: 'Shield Transaction Service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      createTransaction: 'POST /transactions',
      listTransactions: 'GET /transactions',
      getTransaction: 'GET /transactions/:id',
      updateStatus: 'PATCH /transactions/:id/status',
      getStats: 'GET /transactions/stats',
    },
  });
});

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
    console.log('║        💸 Shield Transaction Service Started                  ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Service:     Transaction Service`);
    console.log(`📡 Port:        ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`❤️  Health:      http://localhost:${PORT}/health`);
    console.log('');

    logInfo('Transaction service started successfully', { port: PORT });
  });

  process.on('SIGINT', () => {
    console.log('\n🚦 Shutting down Transaction Service gracefully...');
    server.close(() => {
      console.log('✅ Transaction Service shut down successfully.');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\n🚦 Shutting down Transaction Service gracefully...');
    server.close(() => {
      console.log('✅ Transaction Service shut down successfully.');
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

