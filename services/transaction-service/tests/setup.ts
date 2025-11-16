/**
 * Jest Setup File for Transaction Service Tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.SERVICE_FEE_PERCENTAGE = '1';

