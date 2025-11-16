/**
 * Jest Setup File for Compliance Service Tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.COMPLIANCE_API_KEY = 'test-api-key';

