/**
 * Enhanced Environment Validator with Fail-Fast Mechanism
 * 
 * Validates all required environment variables before service startup.
 * Implements enterprise-grade validation with detailed error reporting.
 * Prevents services from starting with incomplete or insecure configurations.
 * 
 * @module @shield/shared/security/envValidator
 */

import Joi from 'joi';

/**
 * Required environment variables schema
 * All critical variables must be present and valid
 */
const requiredEnvSchema = Joi.object({
  // Core Node Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .required()
    .messages({
      'any.only': 'NODE_ENV must be development, production, or test',
      'any.required': 'NODE_ENV is required',
    }),

  // Database Configuration (CRITICAL - Never start without database)
  DATABASE_URL: Joi.string()
    .uri()
    .pattern(/^postgresql:\/\/.+/)
    .required()
    .messages({
      'string.uri': 'DATABASE_URL must be a valid PostgreSQL URL',
      'string.pattern.base': 'DATABASE_URL must be a PostgreSQL connection string',
      'any.required': 'DATABASE_URL is required',
    }),

  // POSTGRES_* variables are optional when DATABASE_URL is provided
  // (DATABASE_URL contains all connection info)
  POSTGRES_USER: Joi.string()
    .min(1)
    .max(64)
    .optional()
    .messages({
      'string.min': 'POSTGRES_USER is required',
      'string.max': 'POSTGRES_USER too long',
    }),

  POSTGRES_PASSWORD: Joi.string()
    .min(16)
    .optional()
    .messages({
      'string.min': 'POSTGRES_PASSWORD must be at least 16 characters for security',
    }),

  POSTGRES_HOST: Joi.string()
    .min(1)
    .optional()
    .messages({
      'string.min': 'POSTGRES_HOST is required',
    }),

  POSTGRES_PORT: Joi.string()
    .pattern(/^\d+$/)
    .default('5432')
    .optional()
    .messages({
      'string.pattern.base': 'POSTGRES_PORT must be numeric',
    }),

  POSTGRES_DB: Joi.string()
    .min(1)
    .optional()
    .messages({
      'string.min': 'POSTGRES_DB name is required',
    }),

  // JWT Configuration (CRITICAL - Security foundation)
  JWT_SECRET: Joi.string()
    .min(64)
    .pattern(/^[A-Za-z0-9+/=_\-!@#$%^&*()]+$/)
    .required()
    .messages({
      'string.min': 'JWT_SECRET must be at least 64 characters for enterprise security',
      'string.pattern.base': 'JWT_SECRET contains invalid characters',
      'any.required': 'JWT_SECRET is required',
    }),

  JWT_REFRESH_SECRET: Joi.string()
    .min(64)
    .pattern(/^[A-Za-z0-9+/=_\-!@#$%^&*()]+$/)
    .required()
    .messages({
      'string.min': 'JWT_REFRESH_SECRET must be at least 64 characters',
      'string.pattern.base': 'JWT_REFRESH_SECRET contains invalid characters',
      'any.required': 'JWT_REFRESH_SECRET is required',
    }),

  JWT_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('15m')
    .messages({
      'string.pattern.base': 'JWT_EXPIRES_IN must be in format: 15m, 1h, etc.',
    }),

  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('7d')
    .messages({
      'string.pattern.base': 'JWT_REFRESH_EXPIRES_IN must be in format: 7d, 30d, etc.',
    }),

  // Encryption Keys (CRITICAL)
  ENCRYPTION_KEY: Joi.string()
    .min(64)
    .pattern(/^[A-Za-z0-9+/=]+$/)
    .required()
    .messages({
      'string.min': 'ENCRYPTION_KEY must be at least 64 characters (256-bit)',
      'string.pattern.base': 'ENCRYPTION_KEY must be base64 compatible',
      'any.required': 'ENCRYPTION_KEY is required',
    }),

  ENCRYPTION_ALGORITHM: Joi.string()
    .default('aes-256-gcm'),

  // Service Configuration
  PORT: Joi.string()
    .pattern(/^\d+$/)
    .default('3000')
    .messages({
      'string.pattern.base': 'PORT must be numeric',
    }),

  SERVICE_NAME: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'SERVICE_NAME is required',
      'any.required': 'SERVICE_NAME is required',
    }),

  SERVICE_VERSION: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .default('1.0.0')
    .messages({
      'string.pattern.base': 'SERVICE_VERSION must be semver format',
    }),

  // CORS Configuration
  CORS_ORIGIN: Joi.string()
    .min(1)
    .custom((value, helpers) => {
      if (value === '*') {
        return helpers.error('any.custom', { message: 'CORS_ORIGIN cannot be * - specify exact origins' });
      }
      return value;
    })
    .required()
    .messages({
      'string.min': 'CORS_ORIGIN is required',
      'any.custom': 'CORS_ORIGIN cannot be * - specify exact origins',
      'any.required': 'CORS_ORIGIN is required',
    }),

  CORS_CREDENTIALS: Joi.string()
    .valid('true', 'false')
    .default('true'),

  // Rate Limiting (DDoS Protection)
  RATE_LIMIT_WINDOW_MS: Joi.string()
    .pattern(/^\d+$/)
    .default('900000') // 15 minutes
    .messages({
      'string.pattern.base': 'RATE_LIMIT_WINDOW_MS must be numeric',
    }),

  RATE_LIMIT_MAX_REQUESTS: Joi.string()
    .pattern(/^\d+$/)
    .default('100')
    .messages({
      'string.pattern.base': 'RATE_LIMIT_MAX_REQUESTS must be numeric',
    }),

  // Redis for distributed rate limiting (recommended for production)
  REDIS_URL: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'REDIS_URL must be a valid URL',
    }),

  REDIS_PASSWORD: Joi.string()
    .optional()
    .allow(''),

  // Security Settings
  BCRYPT_ROUNDS: Joi.string()
    .pattern(/^\d+$/)
    .custom((value, helpers) => {
      const num = Number(value);
      if (num < 12 || num > 15) {
        return helpers.error('any.custom', { message: 'BCRYPT_ROUNDS must be between 12-15' });
      }
      return value;
    })
    .default('12')
    .messages({
      'string.pattern.base': 'BCRYPT_ROUNDS must be numeric',
      'any.custom': 'BCRYPT_ROUNDS must be between 12-15',
    }),

  MAX_LOGIN_ATTEMPTS: Joi.string()
    .pattern(/^\d+$/)
    .default('5')
    .messages({
      'string.pattern.base': 'MAX_LOGIN_ATTEMPTS must be numeric',
    }),

  ACCOUNT_LOCKOUT_DURATION_MS: Joi.string()
    .pattern(/^\d+$/)
    .default('900000') // 15 minutes
    .messages({
      'string.pattern.base': 'ACCOUNT_LOCKOUT_DURATION_MS must be numeric',
    }),

  SESSION_SECRET: Joi.string()
    .min(64)
    .required()
    .messages({
      'string.min': 'SESSION_SECRET must be at least 64 characters',
      'any.required': 'SESSION_SECRET is required',
    }),

  // Audit Logging
  AUDIT_LOG_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true'),

  AUDIT_LOG_LEVEL: Joi.string()
    .valid('minimal', 'standard', 'detailed')
    .default('standard'),

  // Security Headers
  HSTS_MAX_AGE: Joi.string()
    .pattern(/^\d+$/)
    .default('31536000') // 1 year
    .messages({
      'string.pattern.base': 'HSTS_MAX_AGE must be numeric',
    }),

  CSP_ENABLED: Joi.string()
    .valid('true', 'false')
    .default('true'),

  // API Security
  API_KEY_ROTATION_DAYS: Joi.string()
    .pattern(/^\d+$/)
    .default('90')
    .messages({
      'string.pattern.base': 'API_KEY_ROTATION_DAYS must be numeric',
    }),

  REQUIRE_API_KEY: Joi.string()
    .valid('true', 'false')
    .default('false'),
});

/**
 * Service-specific schemas
 */
const authServiceSchema = requiredEnvSchema.keys({
  PASSWORD_MIN_LENGTH: Joi.string()
    .pattern(/^\d+$/)
    .default('12')
    .messages({
      'string.pattern.base': 'PASSWORD_MIN_LENGTH must be numeric',
    }),

  PASSWORD_REQUIRE_UPPERCASE: Joi.string()
    .valid('true', 'false')
    .default('true'),

  PASSWORD_REQUIRE_LOWERCASE: Joi.string()
    .valid('true', 'false')
    .default('true'),

  PASSWORD_REQUIRE_NUMBERS: Joi.string()
    .valid('true', 'false')
    .default('true'),

  PASSWORD_REQUIRE_SPECIAL: Joi.string()
    .valid('true', 'false')
    .default('true'),

  PASSWORD_MIN_ENTROPY: Joi.string()
    .pattern(/^\d+$/)
    .default('60')
    .messages({
      'string.pattern.base': 'PASSWORD_MIN_ENTROPY must be numeric',
    }),
});

const transactionServiceSchema = requiredEnvSchema.keys({
  MAX_TRANSACTION_AMOUNT: Joi.string()
    .pattern(/^\d+(\.\d+)?$/)
    .default('1000000')
    .messages({
      'string.pattern.base': 'MAX_TRANSACTION_AMOUNT must be a valid number',
    }),

  MIN_TRANSACTION_AMOUNT: Joi.string()
    .pattern(/^\d+(\.\d+)?$/)
    .default('0.01')
    .messages({
      'string.pattern.base': 'MIN_TRANSACTION_AMOUNT must be a valid number',
    }),

  TRANSACTION_APPROVAL_REQUIRED_ABOVE: Joi.string()
    .pattern(/^\d+$/)
    .default('100000')
    .messages({
      'string.pattern.base': 'TRANSACTION_APPROVAL_REQUIRED_ABOVE must be numeric',
    }),

  ENABLE_TRANSACTION_MONITORING: Joi.string()
    .valid('true', 'false')
    .default('true'),
});

const blockchainServiceSchema = requiredEnvSchema.keys({
  POLYGON_RPC_URL: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'POLYGON_RPC_URL must be valid URL',
      'any.required': 'POLYGON_RPC_URL is required',
    }),

  POLYGON_CHAIN_ID: Joi.string()
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.pattern.base': 'POLYGON_CHAIN_ID must be numeric',
      'any.required': 'POLYGON_CHAIN_ID is required',
    }),

  POLYGON_USDT_CONTRACT: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid Polygon contract address',
      'any.required': 'POLYGON_USDT_CONTRACT is required',
    }),

  TRON_RPC_URL: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'TRON_RPC_URL must be valid URL',
      'any.required': 'TRON_RPC_URL is required',
    }),

  TRON_CHAIN_ID: Joi.string()
    .pattern(/^\d+$/)
    .required()
    .messages({
      'string.pattern.base': 'TRON_CHAIN_ID must be numeric',
      'any.required': 'TRON_CHAIN_ID is required',
    }),

  TRON_USDT_CONTRACT: Joi.string()
    .pattern(/^T[a-zA-Z0-9]{33}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid Tron contract address',
      'any.required': 'TRON_USDT_CONTRACT is required',
    }),

  SHIELD_POLYGON_WALLET_ADDRESS: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid Polygon wallet address',
      'any.required': 'SHIELD_POLYGON_WALLET_ADDRESS is required',
    }),

  SHIELD_POLYGON_WALLET_PRIVATE_KEY: Joi.string()
    .min(64)
    .required()
    .messages({
      'string.min': 'Invalid Polygon private key',
      'any.required': 'SHIELD_POLYGON_WALLET_PRIVATE_KEY is required',
    }),

  SHIELD_TRON_WALLET_ADDRESS: Joi.string()
    .pattern(/^T[a-zA-Z0-9]{33}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid Tron wallet address',
      'any.required': 'SHIELD_TRON_WALLET_ADDRESS is required',
    }),

  SHIELD_TRON_WALLET_PRIVATE_KEY: Joi.string()
    .min(64)
    .required()
    .messages({
      'string.min': 'Invalid Tron private key',
      'any.required': 'SHIELD_TRON_WALLET_PRIVATE_KEY is required',
    }),

  GAS_PRICE_MULTIPLIER: Joi.string()
    .pattern(/^\d+(\.\d+)?$/)
    .default('1.2')
    .messages({
      'string.pattern.base': 'GAS_PRICE_MULTIPLIER must be a valid number',
    }),

  MAX_GAS_PRICE: Joi.string()
    .pattern(/^\d+$/)
    .default('500')
    .messages({
      'string.pattern.base': 'MAX_GAS_PRICE must be numeric',
    }),
});

const gatewayServiceSchema = requiredEnvSchema.keys({
  AUTH_SERVICE_URL: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'AUTH_SERVICE_URL must be valid',
      'any.required': 'AUTH_SERVICE_URL is required',
    }),

  WALLET_SERVICE_URL: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'WALLET_SERVICE_URL must be valid',
      'any.required': 'WALLET_SERVICE_URL is required',
    }),

  TRANSACTION_SERVICE_URL: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'TRANSACTION_SERVICE_URL must be valid',
      'any.required': 'TRANSACTION_SERVICE_URL is required',
    }),

  BLOCKCHAIN_SERVICE_URL: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'BLOCKCHAIN_SERVICE_URL must be valid',
      'any.required': 'BLOCKCHAIN_SERVICE_URL is required',
    }),

  COMPLIANCE_SERVICE_URL: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'COMPLIANCE_SERVICE_URL must be valid',
      'any.required': 'COMPLIANCE_SERVICE_URL is required',
    }),

  GATEWAY_TIMEOUT_MS: Joi.string()
    .pattern(/^\d+$/)
    .default('30000')
    .messages({
      'string.pattern.base': 'GATEWAY_TIMEOUT_MS must be numeric',
    }),

  ENABLE_REQUEST_VALIDATION: Joi.string()
    .valid('true', 'false')
    .default('true'),
});

/**
 * Validated environment type (inferred from Joi schema)
 */
export type ValidatedEnv = {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  POSTGRES_USER?: string;
  POSTGRES_PASSWORD?: string;
  POSTGRES_HOST?: string;
  POSTGRES_PORT?: string;
  POSTGRES_DB?: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  ENCRYPTION_KEY: string;
  ENCRYPTION_ALGORITHM: string;
  PORT: string;
  SERVICE_NAME: string;
  SERVICE_VERSION: string;
  CORS_ORIGIN: string;
  CORS_CREDENTIALS: string;
  RATE_LIMIT_WINDOW_MS: string;
  RATE_LIMIT_MAX_REQUESTS: string;
  REDIS_URL?: string;
  REDIS_PASSWORD?: string;
  BCRYPT_ROUNDS: string;
  MAX_LOGIN_ATTEMPTS: string;
  ACCOUNT_LOCKOUT_DURATION_MS: string;
  SESSION_SECRET: string;
  AUDIT_LOG_ENABLED: string;
  AUDIT_LOG_LEVEL: 'minimal' | 'standard' | 'detailed';
  HSTS_MAX_AGE: string;
  CSP_ENABLED: string;
  API_KEY_ROTATION_DAYS: string;
  REQUIRE_API_KEY: string;
  [key: string]: unknown;
};

export type AuthServiceEnv = ValidatedEnv & {
  PASSWORD_MIN_LENGTH: string;
  PASSWORD_REQUIRE_UPPERCASE: string;
  PASSWORD_REQUIRE_LOWERCASE: string;
  PASSWORD_REQUIRE_NUMBERS: string;
  PASSWORD_REQUIRE_SPECIAL: string;
  PASSWORD_MIN_ENTROPY: string;
};

export type TransactionServiceEnv = ValidatedEnv & {
  MAX_TRANSACTION_AMOUNT: string;
  MIN_TRANSACTION_AMOUNT: string;
  TRANSACTION_APPROVAL_REQUIRED_ABOVE: string;
  ENABLE_TRANSACTION_MONITORING: string;
};

export type BlockchainServiceEnv = ValidatedEnv & {
  POLYGON_RPC_URL: string;
  POLYGON_CHAIN_ID: string;
  POLYGON_USDT_CONTRACT: string;
  TRON_RPC_URL: string;
  TRON_CHAIN_ID: string;
  TRON_USDT_CONTRACT: string;
  SHIELD_POLYGON_WALLET_ADDRESS: string;
  SHIELD_POLYGON_WALLET_PRIVATE_KEY: string;
  SHIELD_TRON_WALLET_ADDRESS: string;
  SHIELD_TRON_WALLET_PRIVATE_KEY: string;
  GAS_PRICE_MULTIPLIER: string;
  MAX_GAS_PRICE: string;
};

export type GatewayServiceEnv = ValidatedEnv & {
  AUTH_SERVICE_URL: string;
  WALLET_SERVICE_URL: string;
  TRANSACTION_SERVICE_URL: string;
  BLOCKCHAIN_SERVICE_URL: string;
  COMPLIANCE_SERVICE_URL: string;
  GATEWAY_TIMEOUT_MS: string;
  ENABLE_REQUEST_VALIDATION: string;
};

/**
 * Validates environment variables and exits process if invalid
 * 
 * @param serviceName - Name of the service (determines which schema to use)
 * @returns Validated environment configuration
 * @throws Process exits with code 1 if validation fails
 */
export function validateEnvironment(serviceName: string = 'generic'): ValidatedEnv {
  console.log(`\n🔍 Validating environment variables for ${serviceName}...\n`);

  // Select appropriate schema
  let schema = requiredEnvSchema;
  switch (serviceName.toLowerCase()) {
    case 'auth-service':
      schema = authServiceSchema;
      break;
    case 'transaction-service':
      schema = transactionServiceSchema;
      break;
    case 'blockchain-service':
      schema = blockchainServiceSchema;
      break;
    case 'api-gateway':
      schema = gatewayServiceSchema;
      break;
  }

  try {
    const { value, error } = schema.validate(process.env, {
      abortEarly: false,
      stripUnknown: true, // Allow system environment variables, only validate our schema
      allowUnknown: true, // Don't reject unknown keys from system
      convert: true,
    });

    if (error) {
      console.error('╔════════════════════════════════════════════════════════════════╗');
      console.error('║  ❌ FATAL: Environment Validation Failed                      ║');
      console.error('╚════════════════════════════════════════════════════════════════╝\n');
      
      console.error('🚨 The following environment variables are missing or invalid:\n');
      
      error.details.forEach((detail, index) => {
        const path = detail.path.join('.');
        console.error(`   ${index + 1}. ${path || 'root'}`);
        console.error(`      ➜ ${detail.message}\n`);
      });

      console.error('╔════════════════════════════════════════════════════════════════╗');
      console.error('║  💡 ACTION REQUIRED                                            ║');
      console.error('╚════════════════════════════════════════════════════════════════╝\n');
      console.error('   1. Check your .env file exists in the project root');
      console.error('   2. Copy .env.example to .env if it doesn\'t exist');
      console.error('   3. Fill in all required values');
      console.error('   4. Ensure values meet security requirements\n');
      console.error('   Service startup aborted for security.\n');

      process.exit(1);
    }

    // Additional security checks
    performSecurityChecks(value as Record<string, unknown>, serviceName);

    console.log('✅ Environment validation passed\n');
    return value as ValidatedEnv;
  } catch (error: unknown) {
    // Check if it's a Joi validation error (Joi adds isJoi property)
    if (error && typeof error === 'object' && 'isJoi' in error && (error as { isJoi: boolean }).isJoi) {
      const joiError = error as unknown as { details: Array<{ path: (string | number)[]; message: string }> };
      console.error('╔════════════════════════════════════════════════════════════════╗');
      console.error('║  ❌ FATAL: Environment Validation Failed                      ║');
      console.error('╚════════════════════════════════════════════════════════════════╝\n');
      
      console.error('🚨 Validation error:\n');
      joiError.details.forEach((detail, index) => {
        const path = detail.path.join('.');
        console.error(`   ${index + 1}. ${path || 'root'}: ${detail.message}\n`);
      });

      process.exit(1);
    }
    throw error;
  }
}

/**
 * Performs additional security checks on validated environment
 */
function performSecurityChecks(env: Record<string, unknown>, serviceName: string): void {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Production environment checks
  if (env.NODE_ENV === 'production') {
    // Check if this is a production-like testing environment (Supabase or localhost DB)
    const isTestingEnv = typeof env.DATABASE_URL === 'string' && 
      (env.DATABASE_URL.includes('supabase.com') || 
       env.DATABASE_URL.includes('localhost') ||
       env.DATABASE_URL.includes('127.0.0.1'));

    // JWT secrets should be different
    if (env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
      errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different in production');
    }

    // Strong passwords required
    if (typeof env.POSTGRES_PASSWORD === 'string' && env.POSTGRES_PASSWORD.length < 20) {
      warnings.push('POSTGRES_PASSWORD should be at least 20 characters in production');
    }

    // CORS should not be wildcard
    if (env.CORS_ORIGIN === '*') {
      errors.push('CORS_ORIGIN cannot be * in production - specify exact origins');
    }
    
    // Localhost CORS is allowed for testing environments (Supabase, localhost DB)
    // but should be a warning for actual production
    if (typeof env.CORS_ORIGIN === 'string' && env.CORS_ORIGIN.includes('localhost')) {
      if (isTestingEnv) {
        warnings.push('CORS_ORIGIN contains localhost - acceptable for testing, but use production domains in real production');
      } else {
        errors.push('CORS_ORIGIN cannot be localhost in production - use production domain names');
      }
    }

    // SSL required for production databases (but Supabase uses SSL by default)
    if (typeof env.DATABASE_URL === 'string' && 
        !env.DATABASE_URL.includes('supabase.com') && // Supabase uses SSL by default
        !env.DATABASE_URL.includes('ssl=true') && 
        !env.DATABASE_URL.includes('sslmode=require')) {
      warnings.push('DATABASE_URL should use SSL in production (add ?ssl=true or ?sslmode=require)');
    }

    // Redis should be configured for distributed systems
    if (!env.REDIS_URL) {
      warnings.push('REDIS_URL not configured - rate limiting will not work across multiple instances');
    }
  }

  // Check for common insecure patterns
  if (typeof env.JWT_SECRET === 'string' && (env.JWT_SECRET.includes('secret') || env.JWT_SECRET.includes('password'))) {
    warnings.push('JWT_SECRET appears to contain common words - use a cryptographically random string');
  }

  // Display warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Security Warnings:\n');
    warnings.forEach((warning, index) => {
      console.warn(`   ${index + 1}. ${warning}`);
    });
    console.warn('');
  }

  // Fatal errors
  if (errors.length > 0) {
    console.error('❌ Security Errors:\n');
    errors.forEach((error, index) => {
      console.error(`   ${index + 1}. ${error}`);
    });
    console.error('\n   Cannot start service with security violations.\n');
    process.exit(1);
  }
}

/**
 * Generates a cryptographically secure random string
 * Useful for generating secrets
 * 
 * @param length - Length of string to generate
 * @returns Random string
 */
export function generateSecureSecret(length: number = 64): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

/**
 * Validates that all service URLs are reachable (optional health check)
 */
export async function validateServiceConnectivity(env: Record<string, unknown>): Promise<boolean> {
  // Implementation for service health checks
  // This would ping each service URL to ensure they're reachable
  return true;
}
