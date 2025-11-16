/**
 * Mock for env.ts to avoid import.meta issues in tests
 */

export function loadEnvironment(): void {
  // Mock implementation - no-op for tests
}

export function getEnvironment(): 'development' | 'production' {
  return 'development';
}

export function selectEnvVar(
  directVar: string | undefined,
  devVar: string | undefined,
  prodVar: string | undefined,
  defaultValue?: string
): string {
  return directVar || devVar || prodVar || defaultValue || '';
}

export function initializeEnvironment(): {
  environment: 'development' | 'production';
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  encryptionKey: string;
  sessionSecret: string;
} {
  // Set default test values
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-that-is-at-least-64-characters-long-for-testing-purposes-only';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key-that-is-at-least-64-characters-long-for-testing-purposes-only';
  process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-that-is-at-least-32-characters';
  process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-key-that-is-at-least-64-characters-long-for-testing-purposes-only';
  
  return {
    environment: 'development',
    databaseUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY,
    sessionSecret: process.env.SESSION_SECRET,
  };
}

