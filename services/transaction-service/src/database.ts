/**
 * Database Client for Transaction Service
 */

import { PrismaClient } from '@prisma/client';
import { logInfo, logError } from '../../../shared/types';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logInfo('Database connected successfully', { service: 'transaction-service' });
  } catch (error) {
    logError(error as Error, { service: 'transaction-service', context: 'database-connection' });
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logInfo('Database disconnected successfully', { service: 'transaction-service' });
  } catch (error) {
    logError(error as Error, { service: 'transaction-service', context: 'database-disconnection' });
    throw error;
  }
}

process.on('beforeExit', async () => {
  await disconnectDatabase();
});

export default prisma;

