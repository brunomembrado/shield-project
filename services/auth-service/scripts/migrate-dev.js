import dotenv from 'dotenv';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceRoot = resolve(__dirname, '../'); // Points to service root
const envFilePath = join(serviceRoot, '.env');

// Load .env file
const result = dotenv.config({ path: envFilePath });
if (result.error) {
  console.warn(`⚠️  Warning: Could not load .env from ${envFilePath}`);
  console.warn(`   Error: ${result.error.message}`);
  console.warn(`   Falling back to system environment variables...`);
}

// FORCE development mode for this script
const environment = 'development';

// Always use development database for dev migrations
const databaseUrl = process.env.DATABASE_URL_DEV || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL_DEV not found in .env for development environment.');
  console.error('💡 This script is for LOCAL development migrations only.');
  console.error('💡 For production migrations, use: npm run prisma:migrate:deploy:prod');
  process.exit(1);
}
console.log('✅ Using development database (Docker - Local)');

// Set DATABASE_URL for Prisma CLI
process.env.DATABASE_URL = databaseUrl;

console.log(`🌍 Environment: ${environment}`);
console.log(`📊 Database: ${databaseUrl.includes('localhost') ? 'Docker (local)' : 'Supabase (cloud)'}`);
console.log('');

// Get migration name from command line args
const migrationName = process.argv[2] || 'migration';

// Run prisma migrate dev
const prisma = spawn('npx', ['prisma', 'migrate', 'dev', '--name', migrationName], {
  stdio: 'inherit',
  shell: true,
  env: process.env
});

prisma.on('exit', (code) => {
  process.exit(code || 0);
});

