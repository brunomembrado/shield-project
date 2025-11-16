/**
 * Database Client for Auth Service
 * 
 * Initializes and exports Prisma Client for database operations.
 * Handles connection lifecycle and graceful shutdown.
 * 
 * @module auth-service/database
 */

import { PrismaClient } from '@prisma/client';
import { logInfo, logError } from '@shield/shared/types';

/**
 * Prisma Client instance with query logging in development
 */
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

/**
 * Tests database connection
 * 
 * @returns Promise that resolves when connection is successful
 * @throws Error if connection fails
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logInfo('Database connected successfully', { service: 'auth-service' });
  } catch (error) {
    logError(error as Error, { service: 'auth-service', context: 'database-connection' });
    throw error;
  }
}

/**
 * Disconnects from database
 * Should be called during graceful shutdown
 * 
 * @returns Promise that resolves when disconnected
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logInfo('Database disconnected successfully', { service: 'auth-service' });
  } catch (error) {
    logError(error as Error, { service: 'auth-service', context: 'database-disconnection' });
    throw error;
  }
}

// Handle process termination
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

export default prisma;

