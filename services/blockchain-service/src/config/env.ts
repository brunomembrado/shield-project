/**
 * Environment Configuration for Blockchain Service
 * 
 * Loads and validates environment variables
 * 
 * @module blockchain-service/config
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceRoot = resolve(__dirname, '../../');
const envFilePath = join(serviceRoot, '.env');

export interface EnvironmentConfig {
  environment: 'development' | 'production';
  port: number;
  databaseUrl: string;
  authServiceUrl: string;
  jwtSecret: string;
  polygonRpcUrl: string;
  polygonUsdtAddress: string;
  tronRpcUrl: string;
  tronUsdtAddress: string;
}

/**
 * Load environment variables from .env file
 */
function loadEnvironment(): void {
  const result = dotenv.config({ path: envFilePath });
  
  if (result.error) {
    console.warn(`⚠️  Warning: Could not load .env from ${envFilePath}`);
    console.warn(`   Error: ${result.error.message}`);
    console.warn(`   Falling back to system environment variables...`);
  } else {
    console.log(`✅ Loaded environment from ${envFilePath}`);
  }
}

/**
 * Get the current environment (development or production)
 */
function getEnvironment(): 'development' | 'production' {
  const env = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';
  
  if (env === 'production' || env === 'prod') {
    return 'production';
  }
  
  return 'development';
}

/**
 * Select the appropriate environment variable value based on current environment
 * Priority: directVar > devVar/prodVar > defaultValue
 */
function selectEnvVar(
  directVar: string | undefined,
  devVar: string | undefined,
  prodVar: string | undefined,
  defaultValue?: string
): string {
  const environment = getEnvironment();
  
  // If direct variable is set (not _DEV or _PROD suffixed), use it
  if (directVar && directVar.trim() !== '') {
    return directVar;
  }
  
  // Otherwise, use environment-specific variable
  if (environment === 'production') {
    return prodVar || defaultValue || '';
  } else {
    return devVar || defaultValue || '';
  }
}

/**
 * Initialize environment configuration
 * Must be called before any other imports that use process.env
 */
export function initializeEnvironment(): EnvironmentConfig {
  // IMPORTANT: Get environment from command line FIRST (before loading .env)
  const cliEnvironment = process.env.ENVIRONMENT;
  const cliNodeEnv = process.env.NODE_ENV;

  loadEnvironment();
  
  // Restore command-line values if they were set (takes precedence over .env)
  if (cliEnvironment) {
    process.env.ENVIRONMENT = cliEnvironment;
  }
  if (cliNodeEnv) {
    process.env.NODE_ENV = cliNodeEnv;
  }

  const environment = getEnvironment();
  
  // Ensure NODE_ENV is set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = environment;
  }

  // Select environment-specific variables
  const databaseUrl = selectEnvVar(
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_DEV,
    process.env.DATABASE_URL_PROD
  );
  
  const authServiceUrl = selectEnvVar(
    process.env.AUTH_SERVICE_URL,
    process.env.AUTH_SERVICE_URL_DEV,
    process.env.AUTH_SERVICE_URL_PROD,
    'http://localhost:3001'
  );

  const jwtSecret = selectEnvVar(
    process.env.JWT_SECRET,
    process.env.JWT_SECRET_DEV,
    process.env.JWT_SECRET_PROD
  );

  const polygonRpcUrl = selectEnvVar(
    process.env.POLYGON_RPC_URL,
    process.env.POLYGON_RPC_URL_DEV,
    process.env.POLYGON_RPC_URL_PROD,
    'https://polygon-rpc.com'
  );

  const polygonUsdtAddress = selectEnvVar(
    process.env.POLYGON_USDT_ADDRESS,
    process.env.POLYGON_USDT_ADDRESS_DEV,
    process.env.POLYGON_USDT_ADDRESS_PROD,
    '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
  );

  const tronRpcUrl = selectEnvVar(
    process.env.TRON_RPC_URL,
    process.env.TRON_RPC_URL_DEV,
    process.env.TRON_RPC_URL_PROD,
    'https://api.trongrid.io'
  );

  const tronUsdtAddress = selectEnvVar(
    process.env.TRON_USDT_ADDRESS,
    process.env.TRON_USDT_ADDRESS_DEV,
    process.env.TRON_USDT_ADDRESS_PROD,
    'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
  );

  // Set the selected values back to process.env for Prisma and other modules
  process.env.DATABASE_URL = databaseUrl;
  process.env.AUTH_SERVICE_URL = authServiceUrl;
  process.env.JWT_SECRET = jwtSecret;
  process.env.POLYGON_RPC_URL = polygonRpcUrl;
  process.env.POLYGON_USDT_ADDRESS = polygonUsdtAddress;
  process.env.TRON_RPC_URL = tronRpcUrl;
  process.env.TRON_USDT_ADDRESS = tronUsdtAddress;

  // Validate required variables
  const requiredVars = [
    { name: 'DATABASE_URL', value: databaseUrl },
    { name: 'AUTH_SERVICE_URL', value: authServiceUrl },
    { name: 'JWT_SECRET', value: jwtSecret },
    { name: 'POLYGON_RPC_URL', value: polygonRpcUrl },
    { name: 'POLYGON_USDT_ADDRESS', value: polygonUsdtAddress },
    { name: 'TRON_RPC_URL', value: tronRpcUrl },
    { name: 'TRON_USDT_ADDRESS', value: tronUsdtAddress },
  ];

  const missingVars = requiredVars.filter(v => !v.value || v.value.trim() === '');
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.map(v => v.name).join(', ')}\n` +
      `Please configure ${missingVars.map(v => `${v.name}_${environment === 'production' ? 'PROD' : 'DEV'}`).join(', ')} in your .env file`
    );
  }

  // Validate JWT_SECRET length (must match auth-service requirement)
  if (jwtSecret.length < 64) {
    throw new Error(`JWT_SECRET must be at least 64 characters long (current: ${jwtSecret.length})`);
  }

  console.log(`✅ Environment: ${environment.toUpperCase()}`);
  console.log(`   Database: ${databaseUrl.includes('localhost') ? 'Docker (local)' : 'Supabase (cloud)'}`);
  console.log(`   Auth Service: ${authServiceUrl}`);
  console.log(`   Polygon RPC: ${polygonRpcUrl}`);
  console.log(`   Tron RPC: ${tronRpcUrl}`);

  return {
    environment,
    port: parseInt(process.env.PORT || '3004', 10),
    databaseUrl,
    authServiceUrl,
    jwtSecret,
    polygonRpcUrl,
    polygonUsdtAddress,
    tronRpcUrl,
    tronUsdtAddress,
  };
}

