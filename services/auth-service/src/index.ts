/**
 * Auth Service - Entry Point
 * 
 * Handles user authentication for Shield platform:
 * - User registration (sign up)
 * - User login (sign in)
 * - JWT token generation and refresh
 * - User logout
 * 
 * @module auth-service
 */

// ============================================================================
// Environment Configuration (CRITICAL - Load FIRST, before any other imports)
// ============================================================================
// Load and configure environment variables from single .env file
// Automatically selects DEV or PROD values based on ENVIRONMENT variable
// MUST be imported and executed before any other imports that use process.env
import { initializeEnvironment } from './config/env';

let envConfig;
try {
  envConfig = initializeEnvironment();
} catch (error) {
  console.error('❌ Failed to initialize environment configuration:');
  console.error(`   ${error instanceof Error ? error.message : String(error)}`);
  console.error('');
  console.error('💡 Make sure you have:');
  console.error('   1. Created .env file: cp .env.example .env');
  console.error('   2. Set ENVIRONMENT=development or ENVIRONMENT=production');
  console.error('   3. Configured DATABASE_URL_DEV and DATABASE_URL_PROD');
  console.error('   4. Configured JWT_SECRET_DEV, JWT_SECRET_PROD, etc.');
  process.exit(1);
}

// Now import other modules (they can safely use process.env)
import express from 'express';
import cors from 'cors';
import {
  corsOptions,
  errorHandler,
  healthCheck,
  requestLogger,
  setupSecurityHeaders,
} from '@shield/shared/middleware';
import { logInfo } from '@shield/shared/types';
import {
  validateEnvironment,
  sqlInjectionProtection,
  xssProtection,
  sanitizeRequest,
  bruteForceProtection,
  suspiciousActivityDetection,
  requestFingerprinting,
  ipFiltering,
  AuditLogger,
} from '@shield/shared/security';

// ============================================================================
// Environment Validation (CRITICAL - Fail Fast on Missing Config)
// ============================================================================
console.log('');
console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║           🔐 Shield Auth Service - Starting                  ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');
console.log('');

// Validate environment before starting service
validateEnvironment('auth-service');

// Initialize audit logger
export const auditLogger = new AuditLogger('auth-service');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// Dynamic Route Import (after environment is initialized)
// ============================================================================
// Routes are imported dynamically to ensure environment is initialized first
// This prevents TokenService from being created before JWT_SECRET is set
let authRoutes: express.Router;

// ============================================================================
// Middleware Setup
// ============================================================================

// Security middleware - sets various HTTP headers for security
setupSecurityHeaders(app, {
  cspEnabled: process.env.CSP_ENABLED === 'true',
  hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000', 10),
  crossOriginEmbedderPolicy: false,
});

// CORS middleware - enables cross-origin requests
app.use(cors(corsOptions()));

// Body parsing middleware - parses JSON payloads
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb for security
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ============================================================================
// Security Middleware (Enterprise-Grade Protection)
// ============================================================================

// IP filtering - blocks blacklisted IPs
app.use(ipFiltering);

// Request fingerprinting - tracks unique clients
app.use(requestFingerprinting);

// Request sanitization - removes malicious content
app.use(sanitizeRequest);

// SQL injection protection
app.use(sqlInjectionProtection);

// XSS protection
app.use(xssProtection);

// Brute force protection
app.use(bruteForceProtection);

// Suspicious activity detection
app.use(suspiciousActivityDetection(60)); // Score threshold

// Request logging middleware - logs all incoming requests
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// ============================================================================
// Routes
// ============================================================================
// Routes will be loaded dynamically after environment initialization
// Health check and root endpoints (available immediately)
app.get('/health', healthCheck);

app.get('/', (req, res) => {
  res.json({
    service: 'Shield Auth Service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      register: 'POST /auth/register',
      login: 'POST /auth/login',
      refresh: 'POST /auth/refresh',
      logout: 'POST /auth/logout',
    },
  });
});

// ============================================================================
// Server Startup
// ============================================================================

// Start server only if not in test mode
// Wrap in async to ensure routes are loaded before server starts
(async () => {
  // Import routes dynamically after environment is initialized
  // This ensures JWT_SECRET is set before TokenService is created
  try {
    const routesModule = await import('./routes');
    authRoutes = routesModule.default;
    app.use('/auth', authRoutes);
    console.log('✅ Routes loaded successfully');
    
    // Register error handlers AFTER routes are loaded
    // Global error handler - must be last middleware
    app.use(errorHandler);
    
    // 404 handler for undefined routes (must be after all routes)
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Route not found',
        path: req.path,
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    console.error('❌ Failed to load routes:', error);
    console.error(error);
    process.exit(1);
  }

  // Start server AFTER routes and error handlers are loaded
  if (process.env.NODE_ENV !== 'test') {
    const server = app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║           🔐 Shield Auth Service Started                     ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Service:     Auth Service`);
    console.log(`📡 Port:        ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`❤️  Health:      http://localhost:${PORT}/health`);
    console.log('');
    console.log('📋 Available Endpoints:');
    console.log(`   POST   /auth/register  - User registration`);
    console.log(`   POST   /auth/login     - User login`);
    console.log(`   POST   /auth/refresh   - Refresh access token`);
    console.log(`   POST   /auth/logout    - User logout`);
    console.log('');

    logInfo('Auth service started successfully', { port: PORT });
  });

  // Graceful shutdown handlers
  process.on('SIGINT', () => {
    console.log('\n🚦 Shutting down Auth Service gracefully...');
    server.close(() => {
      console.log('✅ Auth Service shut down successfully.');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\n🚦 Shutting down Auth Service gracefully...');
    server.close(() => {
      console.log('✅ Auth Service shut down successfully.');
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
})();

export default app;

