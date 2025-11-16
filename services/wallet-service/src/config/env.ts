import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceRoot = resolve(__dirname, '../../'); // Points to service root
const envFilePath = join(serviceRoot, '.env');

/**
 * Load environment variables from .env file
 */
export function loadEnvironment(): void {
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
export function getEnvironment(): 'development' | 'production' {
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
export function selectEnvVar(
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
 * Initialize environment variables and validate required ones
 * MUST be called at the very start of the application
 */
export function initializeEnvironment(): {
  environment: 'development' | 'production';
  databaseUrl: string;
  jwtSecret: string;
  authServiceUrl: string;
} {
  // IMPORTANT: Get environment from command line FIRST (before loading .env)
  // This ensures command-line values take precedence over .env file
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
  
  const jwtSecret = selectEnvVar(
    process.env.JWT_SECRET,
    process.env.JWT_SECRET_DEV,
    process.env.JWT_SECRET_PROD
  );
  
  const authServiceUrl = selectEnvVar(
    process.env.AUTH_SERVICE_URL,
    process.env.AUTH_SERVICE_URL_DEV,
    process.env.AUTH_SERVICE_URL_PROD,
    'http://localhost:3001'
  );

  // Set the selected values back to process.env for Prisma and other modules
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_SECRET = jwtSecret;
  process.env.AUTH_SERVICE_URL = authServiceUrl;

  // Validate required variables
  const requiredVars = [
    { name: 'DATABASE_URL', value: databaseUrl },
    { name: 'JWT_SECRET', value: jwtSecret },
    { name: 'AUTH_SERVICE_URL', value: authServiceUrl },
  ];

  const missingVars = requiredVars.filter(v => !v.value || v.value.trim() === '');
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.map(v => v.name).join(', ')}\n` +
      `Please configure ${missingVars.map(v => `${v.name}_${environment === 'production' ? 'PROD' : 'DEV'}`).join(', ')} in your .env file`
    );
  }

  // Validate JWT_SECRET length
  if (jwtSecret.length < 64) {
    throw new Error(`JWT_SECRET must be at least 64 characters long (current: ${jwtSecret.length})`);
  }

  console.log(`✅ Environment: ${environment.toUpperCase()}`);
  console.log(`   Database: ${databaseUrl.includes('localhost') ? 'Docker (local)' : 'Supabase (cloud)'}`);
  console.log(`   Auth Service: ${authServiceUrl}`);

  return {
    environment,
    databaseUrl,
    jwtSecret,
    authServiceUrl,
  };
}

