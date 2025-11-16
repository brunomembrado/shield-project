-- Initialize separate databases for each microservice
-- This script runs automatically when the PostgreSQL container starts

-- Create databases
CREATE DATABASE shield_auth;
CREATE DATABASE shield_wallets;
CREATE DATABASE shield_transactions;
CREATE DATABASE shield_blockchain;
CREATE DATABASE shield_compliance;

-- Grant all privileges to shield user
GRANT ALL PRIVILEGES ON DATABASE shield_auth TO shield;
GRANT ALL PRIVILEGES ON DATABASE shield_wallets TO shield;
GRANT ALL PRIVILEGES ON DATABASE shield_transactions TO shield;
GRANT ALL PRIVILEGES ON DATABASE shield_blockchain TO shield;
GRANT ALL PRIVILEGES ON DATABASE shield_compliance TO shield;

