#!/usr/bin/env node
/**
 * Prisma Migration Deploy Script
 * 
 * Sets DATABASE_URL based on ENVIRONMENT variable before running prisma migrate deploy
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceRoot = resolve(__dirname, '../');
const envFilePath = join(serviceRoot, '.env');

// Load .env file
const result = dotenv.config({ path: envFilePath });

if (result.error) {
  console.error('❌ Failed to load .env file:', result.error.message);
  process.exit(1);
}

// Get environment (from command line or .env file)
const environment = (process.env.ENVIRONMENT || process.env.NODE_ENV || 'development').toLowerCase();

// Determine which DATABASE_URL to use
let databaseUrl;
if (environment === 'production' || environment === 'prod') {
  databaseUrl = process.env.DATABASE_URL_PROD || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL_PROD not found in .env');
    process.exit(1);
  }
  console.log('✅ Using production database (Supabase)');
} else {
  databaseUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL_DEV not found in .env');
    process.exit(1);
  }
  console.log('✅ Using development database (Docker)');
}

// Set DATABASE_URL for Prisma
process.env.DATABASE_URL = databaseUrl;

console.log(`🌍 Environment: ${environment}`);
console.log(`📊 Database: ${databaseUrl.substring(0, 50)}...`);
console.log('');

// Run prisma migrate deploy
try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd: serviceRoot,
    env: process.env
  });
  console.log('\n✅ Migration deployed successfully!');
} catch (error) {
  console.error('\n❌ Migration deployment failed');
  process.exit(1);
}

