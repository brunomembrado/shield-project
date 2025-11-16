/**
 * Environment Configuration Manager
 * 
 * Handles loading and selecting environment-specific variables from a single .env file.
 * Automatically selects DEV or PROD values based on ENVIRONMENT variable.
 * 
 * @module config/env
 */

import dotenv from 'dotenv';
import { join, resolve } from 'path';

// Use process.cwd() as a fallback for test environments
// In production, this will be the service root
// In tests, we'll rely on the mock or environment variables
const serviceRoot = process.env.SERVICE_ROOT || process.cwd();
const envFilePath = process.env.ENV_FILE_PATH || join(serviceRoot, '.env');

/**
 * Load environment variables from .env file
 */
export function loadEnvironment(): void {
  const result = dotenv.config({ path: envFilePath });
  
  if (result.error) {
    console.warn(`⚠️  Warning: Could not load .env from ${envFilePath}`);
    console.warn(`   Error: ${result.error.message}`);
    console.warn(`   Falling back to system environment variables...`);
    // Don't exit - allow system env vars to be used
  }
}

/**
 * Get the current environment (development or production)
 */
export function getEnvironment(): 'development' | 'production' {
  const env = (process.env.ENVIRONMENT || process.env.NODE_ENV || 'development').toLowerCase();
  
  if (env === 'production' || env === 'prod') {
    return 'production';
  }
  
  return 'development';
}

/**
 * Select environment-specific variable
 * Priority: 1. Direct variable (e.g., DATABASE_URL) 2. Environment-specific (e.g., DATABASE_URL_PROD) 3. Default
 */
export function selectEnvVar(
  directVar: string | undefined,
  devVar: string | undefined,
  prodVar: string | undefined,
  defaultValue?: string
): string {
  // If direct variable is set, use it (highest priority)
  if (directVar) {
    return directVar;
  }
  
  // Otherwise, use environment-specific variable
  const env = getEnvironment();
  const envVar = env === 'production' ? prodVar : devVar;
  
  if (envVar) {
    return envVar;
  }
  
  // Fallback to default
  if (defaultValue) {
    return defaultValue;
  }
  
  throw new Error(`Missing required environment variable. Check your .env file.`);
}

/**
 * Initialize and configure environment variables
 * Automatically selects DEV or PROD values based on ENVIRONMENT
 */
export function initializeEnvironment(): {
  environment: 'development' | 'production';
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  encryptionKey: string;
  sessionSecret: string;
} {
  // IMPORTANT: Get environment from command line FIRST (before loading .env)
  // This ensures command-line values take precedence over .env file
  const cliEnvironment = process.env.ENVIRONMENT;
  const cliNodeEnv = process.env.NODE_ENV;
  
  // Load .env file (dotenv.config() won't override existing env vars by default)
  loadEnvironment();
  
  // Restore command-line values if they were set (takes precedence over .env)
  if (cliEnvironment) {
    process.env.ENVIRONMENT = cliEnvironment;
  }
  if (cliNodeEnv) {
    process.env.NODE_ENV = cliNodeEnv;
  }
  
  // Get current environment
  const environment = getEnvironment();
  
  // Set NODE_ENV if not already set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = environment;
  }
  
  // Select environment-specific variables
  const databaseUrl = selectEnvVar(
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_DEV,
    process.env.DATABASE_URL_PROD
  );
  
  const jwtSecret = selectEnvVar(
    process.env.JWT_SECRET,
    process.env.JWT_SECRET_DEV,
    process.env.JWT_SECRET_PROD
  );
  
  const jwtRefreshSecret = selectEnvVar(
    process.env.JWT_REFRESH_SECRET,
    process.env.JWT_REFRESH_SECRET_DEV,
    process.env.JWT_REFRESH_SECRET_PROD
  );
  
  const encryptionKey = selectEnvVar(
    process.env.ENCRYPTION_KEY,
    process.env.ENCRYPTION_KEY_DEV,
    process.env.ENCRYPTION_KEY_PROD
  );
  
  const sessionSecret = selectEnvVar(
    process.env.SESSION_SECRET,
    process.env.SESSION_SECRET_DEV,
    process.env.SESSION_SECRET_PROD
  );
  
  // Set selected values to process.env for use throughout the application
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_SECRET = jwtSecret;
  process.env.JWT_REFRESH_SECRET = jwtRefreshSecret;
  process.env.ENCRYPTION_KEY = encryptionKey;
  process.env.SESSION_SECRET = sessionSecret;
  
  // Validate critical variables
  const requiredVars = [
    { name: 'DATABASE_URL', value: databaseUrl },
    { name: 'JWT_SECRET', value: jwtSecret },
    { name: 'JWT_REFRESH_SECRET', value: jwtRefreshSecret },
    { name: 'ENCRYPTION_KEY', value: encryptionKey },
    { name: 'SESSION_SECRET', value: sessionSecret },
  ];
  
  const missingVars = requiredVars.filter(v => !v.value || v.value.trim() === '');
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.map(v => v.name).join(', ')}\n` +
      `Please configure ${missingVars.map(v => `${v.name}_${environment === 'production' ? 'PROD' : 'DEV'}`).join(', ')} in your .env file`
    );
  }
  
  // Validate secret lengths
  if (jwtSecret.length < 64) {
    throw new Error(`JWT_SECRET must be at least 64 characters long (current: ${jwtSecret.length})`);
  }
  if (jwtRefreshSecret.length < 64) {
    throw new Error(`JWT_REFRESH_SECRET must be at least 64 characters long (current: ${jwtRefreshSecret.length})`);
  }
  if (sessionSecret.length < 64) {
    throw new Error(`SESSION_SECRET must be at least 64 characters long (current: ${sessionSecret.length})`);
  }
  
  // Log environment configuration
  console.log(`✅ Environment: ${environment.toUpperCase()}`);
  console.log(`   Database: ${databaseUrl.includes('localhost') ? 'Docker (local)' : 'Supabase (cloud)'}`);
  console.log(`   Secrets: ${environment === 'production' ? 'Production' : 'Development'} mode`);
  
  return {
    environment,
    databaseUrl,
    jwtSecret,
    jwtRefreshSecret,
    encryptionKey,
    sessionSecret,
  };
}

