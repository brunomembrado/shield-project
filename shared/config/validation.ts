/**
 * Configuration Validation using Joi
 * 
 * Validates environment variables and provides type-safe configuration.
 * Fails fast if required variables are missing or invalid.
 * 
 * Based on Node.js Best Practices 1.4: Use environment aware, secure and hierarchical config
 * 
 * @module @shield/shared/config
 */

import Joi from 'joi';

/**
 * Environment variable schema
 * Validates all environment variables with proper types and defaults
 */
const envSchema = Joi.object({
  // Node Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database Configuration
  DATABASE_URL: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'DATABASE_URL must be a valid URL',
      'any.required': 'DATABASE_URL is required',
    }),

  POSTGRES_USER: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'POSTGRES_USER is required',
      'any.required': 'POSTGRES_USER is required',
    }),

  POSTGRES_PASSWORD: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'POSTGRES_PASSWORD must be at least 8 characters',
      'any.required': 'POSTGRES_PASSWORD is required',
    }),

  POSTGRES_HOST: Joi.string()
    .default('localhost'),

  POSTGRES_PORT: Joi.string()
    .pattern(/^\d+$/)
    .default('5432')
    .messages({
      'string.pattern.base': 'POSTGRES_PORT must be numeric',
    }),

  // JWT Configuration
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'string.min': 'JWT_SECRET must be at least 32 characters',
      'any.required': 'JWT_SECRET is required',
    }),

  JWT_REFRESH_SECRET: Joi.string()
    .min(32)
    .required()
    .messages({
      'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters',
      'any.required': 'JWT_REFRESH_SECRET is required',
    }),

  JWT_EXPIRES_IN: Joi.string()
    .default('15m'),

  JWT_REFRESH_EXPIRES_IN: Joi.string()
    .default('7d'),

  // CORS Configuration
  CORS_ORIGIN: Joi.string()
    .uri()
    .default('http://localhost:3000')
    .messages({
      'string.uri': 'CORS_ORIGIN must be a valid URL',
    }),

  CORS_CREDENTIALS: Joi.string()
    .valid('true', 'false')
    .default('true'),

  // Service Ports
  PORT: Joi.string()
    .pattern(/^\d+$/)
    .default('3000')
    .messages({
      'string.pattern.base': 'PORT must be numeric',
    }),

  API_GATEWAY_PORT: Joi.string()
    .pattern(/^\d+$/)
    .default('8080')
    .messages({
      'string.pattern.base': 'API_GATEWAY_PORT must be numeric',
    }),

  AUTH_SERVICE_PORT: Joi.string()
    .pattern(/^\d+$/)
    .default('3001')
    .messages({
      'string.pattern.base': 'AUTH_SERVICE_PORT must be numeric',
    }),

  WALLET_SERVICE_PORT: Joi.string()
    .pattern(/^\d+$/)
    .default('3002')
    .messages({
      'string.pattern.base': 'WALLET_SERVICE_PORT must be numeric',
    }),

  TRANSACTION_SERVICE_PORT: Joi.string()
    .pattern(/^\d+$/)
    .default('3003')
    .messages({
      'string.pattern.base': 'TRANSACTION_SERVICE_PORT must be numeric',
    }),

  BLOCKCHAIN_SERVICE_PORT: Joi.string()
    .pattern(/^\d+$/)
    .default('3004')
    .messages({
      'string.pattern.base': 'BLOCKCHAIN_SERVICE_PORT must be numeric',
    }),

  COMPLIANCE_SERVICE_PORT: Joi.string()
    .pattern(/^\d+$/)
    .default('3005')
    .messages({
      'string.pattern.base': 'COMPLIANCE_SERVICE_PORT must be numeric',
    }),

  // Service URLs
  AUTH_SERVICE_URL: Joi.string()
    .uri()
    .default('http://localhost:3001')
    .messages({
      'string.uri': 'AUTH_SERVICE_URL must be a valid URL',
    }),

  WALLET_SERVICE_URL: Joi.string()
    .uri()
    .default('http://localhost:3002')
    .messages({
      'string.uri': 'WALLET_SERVICE_URL must be a valid URL',
    }),

  TRANSACTION_SERVICE_URL: Joi.string()
    .uri()
    .default('http://localhost:3003')
    .messages({
      'string.uri': 'TRANSACTION_SERVICE_URL must be a valid URL',
    }),

  BLOCKCHAIN_SERVICE_URL: Joi.string()
    .uri()
    .default('http://localhost:3004')
    .messages({
      'string.uri': 'BLOCKCHAIN_SERVICE_URL must be a valid URL',
    }),

  COMPLIANCE_SERVICE_URL: Joi.string()
    .uri()
    .default('http://localhost:3005')
    .messages({
      'string.uri': 'COMPLIANCE_SERVICE_URL must be a valid URL',
    }),

  // Blockchain Configuration
  POLYGON_RPC_URL: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'POLYGON_RPC_URL must be a valid URL',
    }),

  POLYGON_CHAIN_ID: Joi.string()
    .pattern(/^\d+$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'POLYGON_CHAIN_ID must be numeric',
    }),

  POLYGON_USDT_CONTRACT: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'POLYGON_USDT_CONTRACT must be a valid Ethereum address',
    }),

  TRON_RPC_URL: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'TRON_RPC_URL must be a valid URL',
    }),

  TRON_CHAIN_ID: Joi.string()
    .pattern(/^\d+$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'TRON_CHAIN_ID must be numeric',
    }),

  TRON_USDT_CONTRACT: Joi.string()
    .pattern(/^T[a-zA-Z0-9]{33}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'TRON_USDT_CONTRACT must be a valid Tron address',
    }),

  // Shield Wallets (optional for development)
  SHIELD_POLYGON_WALLET_ADDRESS: Joi.string()
    .pattern(/^0x[a-fA-F0-9]{40}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'SHIELD_POLYGON_WALLET_ADDRESS must be a valid Ethereum address',
    }),

  SHIELD_POLYGON_WALLET_PRIVATE_KEY: Joi.string()
    .optional()
    .allow(''),

  SHIELD_TRON_WALLET_ADDRESS: Joi.string()
    .pattern(/^T[a-zA-Z0-9]{33}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'SHIELD_POLYGON_WALLET_ADDRESS must be a valid Tron address',
    }),

  SHIELD_TRON_WALLET_PRIVATE_KEY: Joi.string()
    .optional()
    .allow(''),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.string()
    .pattern(/^\d+$/)
    .default('900000')
    .messages({
      'string.pattern.base': 'RATE_LIMIT_WINDOW_MS must be numeric',
    }),

  RATE_LIMIT_MAX_REQUESTS: Joi.string()
    .pattern(/^\d+$/)
    .default('100')
    .messages({
      'string.pattern.base': 'RATE_LIMIT_MAX_REQUESTS must be numeric',
    }),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),

  // Service Metadata
  SERVICE_NAME: Joi.string()
    .optional()
    .allow(''),

  SERVICE_VERSION: Joi.string()
    .default('1.0.0'),
});

/**
 * Validated environment configuration
 * Type-safe configuration object
 */
export type EnvConfig = {
  NODE_ENV: 'development' | 'production' | 'test';
  DATABASE_URL: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  CORS_CREDENTIALS: string;
  PORT: string;
  API_GATEWAY_PORT: string;
  AUTH_SERVICE_PORT: string;
  WALLET_SERVICE_PORT: string;
  TRANSACTION_SERVICE_PORT: string;
  BLOCKCHAIN_SERVICE_PORT: string;
  COMPLIANCE_SERVICE_PORT: string;
  AUTH_SERVICE_URL: string;
  WALLET_SERVICE_URL: string;
  TRANSACTION_SERVICE_URL: string;
  BLOCKCHAIN_SERVICE_URL: string;
  COMPLIANCE_SERVICE_URL: string;
  POLYGON_RPC_URL?: string;
  POLYGON_CHAIN_ID?: string;
  POLYGON_USDT_CONTRACT?: string;
  TRON_RPC_URL?: string;
  TRON_CHAIN_ID?: string;
  TRON_USDT_CONTRACT?: string;
  SHIELD_POLYGON_WALLET_ADDRESS?: string;
  SHIELD_POLYGON_WALLET_PRIVATE_KEY?: string;
  SHIELD_TRON_WALLET_ADDRESS?: string;
  SHIELD_TRON_WALLET_PRIVATE_KEY?: string;
  RATE_LIMIT_WINDOW_MS: string;
  RATE_LIMIT_MAX_REQUESTS: string;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  SERVICE_NAME?: string;
  SERVICE_VERSION: string;
};

/**
 * Validates and returns environment configuration
 * Throws error if validation fails
 * 
 * @returns Validated configuration object
 * @throws Error if validation fails
 * 
 * @example
 * ```typescript
 * import { getConfig } from '@shield/shared/config';
 * 
 * const config = getConfig();
 * console.log(config.PORT); // Type-safe, validated
 * ```
 */
export function getConfig(): EnvConfig {
  try {
    const { value, error } = envSchema.validate(process.env, {
      abortEarly: false,
      stripUnknown: false,
      convert: true,
    });

    if (error) {
      console.error('❌ Configuration validation failed:');
      error.details.forEach((err) => {
        const path = err.path.join('.');
        console.error(`   ${path || 'root'}: ${err.message}`);
      });
      console.error('\n💡 Please check your .env file and ensure all required variables are set.');
      process.exit(1);
    }

    return value as EnvConfig;
  } catch (error: unknown) {
    // Check if it's a Joi validation error (Joi adds isJoi property)
    if (error && typeof error === 'object' && 'isJoi' in error && (error as { isJoi: boolean }).isJoi) {
      console.error('❌ Configuration validation failed:');
      error.details.forEach((err) => {
        const path = err.path.join('.');
        console.error(`   ${path || 'root'}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Validates configuration without throwing
 * Useful for checking config in tests
 * 
 * @returns Validation result with success flag and data/errors
 */
export function validateConfig(): {
  success: boolean;
  data?: EnvConfig;
  errors?: { isJoi: boolean; details: Array<{ path: (string | number)[]; message: string }> };
} {
  const { value, error } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false,
    convert: true,
  });

  if (error) {
    return { success: false, errors: error };
  }

  return { success: true, data: value as EnvConfig };
}
