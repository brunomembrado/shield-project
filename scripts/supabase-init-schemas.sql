-- Supabase Schema Initialization Script
-- Run this in Supabase SQL Editor to create schemas for all services
-- Shield Platform uses schemas instead of separate databases in Supabase

-- ============================================================================
-- Create Schemas for Each Microservice
-- ============================================================================

-- Authentication Service Schema
CREATE SCHEMA IF NOT EXISTS shield_auth;
COMMENT ON SCHEMA shield_auth IS 'Authentication service: User registration, login, JWT token management';

-- Wallet Service Schema
CREATE SCHEMA IF NOT EXISTS shield_wallets;
COMMENT ON SCHEMA shield_wallets IS 'Wallet service: User wallet addresses for Polygon and Tron networks';

-- Transaction Service Schema
CREATE SCHEMA IF NOT EXISTS shield_transactions;
COMMENT ON SCHEMA shield_transactions IS 'Transaction service: USDT payment processing and status tracking';

-- Blockchain Service Schema
CREATE SCHEMA IF NOT EXISTS shield_blockchain;
COMMENT ON SCHEMA shield_blockchain IS 'Blockchain service: Web3 integration and transaction monitoring';

-- Compliance Service Schema
CREATE SCHEMA IF NOT EXISTS shield_compliance;
COMMENT ON SCHEMA shield_compliance IS 'Compliance service: KYB/KYC verification and transaction screening';

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant all privileges on schemas to postgres user
GRANT ALL ON SCHEMA shield_auth TO postgres;
GRANT ALL ON SCHEMA shield_wallets TO postgres;
GRANT ALL ON SCHEMA shield_transactions TO postgres;
GRANT ALL ON SCHEMA shield_blockchain TO postgres;
GRANT ALL ON SCHEMA shield_compliance TO postgres;

-- Grant usage on schemas
GRANT USAGE ON SCHEMA shield_auth TO postgres;
GRANT USAGE ON SCHEMA shield_wallets TO postgres;
GRANT USAGE ON SCHEMA shield_transactions TO postgres;
GRANT USAGE ON SCHEMA shield_blockchain TO postgres;
GRANT USAGE ON SCHEMA shield_compliance TO postgres;

-- ============================================================================
-- Set Default Privileges (for future tables)
-- ============================================================================

-- Set default privileges for tables in each schema
ALTER DEFAULT PRIVILEGES IN SCHEMA shield_auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA shield_wallets GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA shield_transactions GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA shield_blockchain GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA shield_compliance GRANT ALL ON TABLES TO postgres;

-- Set default privileges for sequences (for auto-increment IDs)
ALTER DEFAULT PRIVILEGES IN SCHEMA shield_auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA shield_wallets GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA shield_transactions GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA shield_blockchain GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA shield_compliance GRANT ALL ON SEQUENCES TO postgres;

-- ============================================================================
-- Verify Schemas Created
-- ============================================================================

-- List all schemas (should show shield_* schemas)
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE 'shield_%'
ORDER BY schema_name;

