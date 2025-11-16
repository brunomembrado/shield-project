/**
 * API Gateway - Entry Point
 * 
 * Central entry point for Shield platform.
 * Routes requests to appropriate microservices.
 * 
 * @module api-gateway
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { gatewayAuth } from './middleware/auth';
import { getServiceConfig } from './config';
import { setupSecurityHeaders } from '../../shared/middleware';

// Load environment variables from api-gateway directory
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
const PORT = process.env.PORT || 8080;

// ============================================================================
// Middleware Setup
// ============================================================================

// Security
setupSecurityHeaders(app, { crossOriginEmbedderPolicy: false });

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many requests, please try again later',
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    }));
  });
  next();
});

// Authentication middleware
app.use(gatewayAuth);

// ============================================================================
// Routes & Proxies
// ============================================================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Shield API Gateway',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth/*',
      wallets: '/api/wallets/*',
      transactions: '/api/transactions/*',
      blockchain: '/api/blockchain/*',
      compliance: '/api/compliance/*',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Setup proxies for each service
const services = getServiceConfig();

services.forEach(service => {
  console.log(`Setting up proxy: ${service.path} -> ${service.url}`);
  
  app.use(
    service.path,
    createProxyMiddleware({
      target: service.url,
      changeOrigin: true,
      pathRewrite: (path) => {
        // Remove the /api/service prefix
        const newPath = path.replace(service.path, '');
        return newPath || '/';
      },
      onProxyReq: (proxyReq, req: express.Request) => {
        // Forward user info from gateway auth
        if (req.headers['x-user-id']) {
          proxyReq.setHeader('x-user-id', req.headers['x-user-id']);
        }
        if (req.headers['x-user-email']) {
          proxyReq.setHeader('x-user-email', req.headers['x-user-email']);
        }
      },
      onError: (err: Error, req: express.Request, res: express.Response) => {
        console.error(`Proxy error for ${service.name}:`, err);
        res.status(503).json({
          success: false,
          error: 'SERVICE_UNAVAILABLE',
          message: `${service.name} is currently unavailable`,
          timestamp: new Date().toISOString(),
        });
      },
    })
  );
});

// ============================================================================
// Error Handling
// ============================================================================

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

// Global error handler
app.use((err: Error & { statusCode?: number }, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  if (!res.headersSent) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================================
// Server Startup
// ============================================================================

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║           🌐 Shield API Gateway Started                      ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Service:     API Gateway`);
    console.log(`📡 Port:        ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Gateway URL: http://localhost:${PORT}`);
    console.log(`❤️  Health:      http://localhost:${PORT}/health`);
    console.log('');
    console.log('📋 Routing Configuration:');
    services.forEach(service => {
      console.log(`   ${service.path.padEnd(25)} → ${service.url}`);
    });
    console.log('');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🚦 Shutting down API Gateway gracefully...');
    server.close(() => {
      console.log('✅ API Gateway shut down successfully.');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\n🚦 Shutting down API Gateway gracefully...');
    server.close(() => {
      console.log('✅ API Gateway shut down successfully.');
      process.exit(0);
    });
  });
}

export default app;

