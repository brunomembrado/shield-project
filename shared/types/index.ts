/**
 * Shared TypeScript type definitions for Shield microservices platform
 * 
 * Shield acts as an infrastructure layer between blockchain and traditional banking systems.
 * This file contains all shared types, interfaces, and classes used across services.
 * 
 * @module @shield/shared/types
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

/**
 * Represents a user in the Shield system
 */
export interface User {
  id: string;
  email: string;
  password?: string; // Should never be returned in API responses
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User registration request payload
 */
export interface RegisterRequest {
  email: string;
  password: string;
}

/**
 * User login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * JWT tokens returned after successful authentication
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Decoded JWT payload structure
 */
export interface JWTPayload {
  userId: string;
  email: string;
  iat: number; // issued at timestamp
  exp: number; // expiration timestamp
}

/**
 * Refresh token stored in database
 */
export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// ============================================================================
// Wallet Types
// ============================================================================

/**
 * Supported blockchain networks
 */
export enum ChainType {
  POLYGON = 'POLYGON',
  TRON = 'TRON'
}

/**
 * Wallet entity representing user's cryptocurrency wallet
 */
export interface Wallet {
  id: string;
  userId: string;
  tag?: string | null; // Optional label for the wallet
  chain: ChainType;
  address: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request to create a new wallet
 */
export interface CreateWalletRequest {
  tag?: string;
  chain: ChainType;
  address: string;
}

/**
 * Request to update an existing wallet
 */
export interface UpdateWalletRequest {
  tag?: string;
  chain?: ChainType;
  address?: string;
  isActive?: boolean;
}

// ============================================================================
// Transaction Types
// ============================================================================

/**
 * Transaction status lifecycle
 */
export enum TransactionStatus {
  PENDING = 'PENDING',               // Transaction initiated, awaiting payment
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED', // USDT received on blockchain
  VALIDATING = 'VALIDATING',         // Validating transaction on blockchain
  COMPLIANCE_CHECK = 'COMPLIANCE_CHECK', // Running compliance checks
  APPROVED = 'APPROVED',             // Compliance approved
  WIRE_SUBMITTED = 'WIRE_SUBMITTED', // USD wire transfer submitted to bank
  WIRE_PROCESSED = 'WIRE_PROCESSED', // USD received in client's bank account
  FAILED = 'FAILED',                 // Transaction failed
  REJECTED = 'REJECTED'              // Compliance rejected
}

/**
 * Transaction entity for tracking USDT payments
 */
export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  chain: ChainType;
  
  // Blockchain details
  txHash?: string | null;
  fromAddress?: string | null;
  toAddress: string;
  amountUSDT: string; // Stored as string to maintain precision
  
  // Fiat conversion
  amountUSD: string;
  exchangeRate: string;
  serviceFee: string;
  netAmount: string;
  
  // Status tracking
  status: TransactionStatus;
  
  // Bank details
  bankAccountName?: string | null;
  bankAccountNumber?: string | null;
  bankWireReference?: string | null;
  
  // Compliance
  complianceCheckId?: string | null;
  complianceStatus?: string | null;
  
  // Metadata
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request to create a new transaction
 */
export interface CreateTransactionRequest {
  walletId: string;
  chain: ChainType;
  amountUSDT: string;
  bankAccountName: string;
  bankAccountNumber: string;
}

/**
 * Transaction status update request
 */
export interface UpdateTransactionStatusRequest {
  status: TransactionStatus;
  txHash?: string;
  notes?: string;
}

// ============================================================================
// Blockchain Types
// ============================================================================

/**
 * Blockchain transaction details from network
 */
export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber: number;
  timestamp: number;
  confirmations: number;
  status: 'success' | 'failed' | 'pending';
}

/**
 * Token balance information
 */
export interface TokenBalance {
  address: string;
  balance: string;
  decimals: number;
  symbol: string;
}

/**
 * Blockchain network configuration
 */
export interface NetworkConfig {
  chainId: number;
  rpcUrl: string;
  contractAddress: string;
  confirmationsRequired: number;
}

// ============================================================================
// Compliance Types
// ============================================================================

/**
 * Compliance check status
 */
export enum ComplianceStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED'
}

/**
 * Risk level assessment
 */
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Compliance check details structure
 */
export interface ComplianceCheckDetails {
  checkProvider?: string;
  providerResponse?: Record<string, unknown>;
  riskFactors?: string[];
  screeningResults?: Record<string, unknown>;
  documents?: string[];
  [key: string]: unknown; // Allow additional dynamic fields
}

/**
 * Compliance check result
 */
export interface ComplianceCheck {
  id: string;
  entityType: 'USER' | 'TRANSACTION' | 'WALLET';
  entityId: string;
  status: ComplianceStatus;
  riskLevel: RiskLevel;
  checkType: string; // KYC, KYB, AML, Sanctions, etc.
  details?: ComplianceCheckDetails;
  reviewNotes?: string | null;
  reviewedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * KYB (Know Your Business) verification data
 */
export interface KYBData {
  businessName: string;
  registrationNumber: string;
  country: string;
  documents: string[];
}

/**
 * KYC (Know Your Customer) verification data
 */
export interface KYCData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  documentType: string;
  documentNumber: string;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API success response
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: Record<string, unknown>;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation error response
 */
export interface ValidationErrorResponse {
  success: false;
  message: string;
  errors: ValidationError[];
  timestamp: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

// ============================================================================
// Service Communication Types
// ============================================================================

/**
 * Inter-service request result
 */
export interface ServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  dependencies?: {
    name: string;
    status: 'ok' | 'down';
  }[];
}

// ============================================================================
// Error Classes - DEPRECATED: Use @shield/shared/errors instead
// ============================================================================

/**
 * @deprecated Use @shield/shared/errors instead
 * Re-exported for backward compatibility
 */
export {
  BaseError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceError,
  DatabaseError,
  ExternalServiceError,
  NetworkError,
  TimeoutError,
  ConfigurationError,
  BusinessLogicError,
  handleUnknownError,
  ensureBaseError,
  isBaseError,
  isOperationalError,
} from '../errors';

/**
 * @deprecated Use ValidationError from @shield/shared/errors instead
 * Legacy validation error interface (kept for type compatibility)
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Logs error with context information
 * 
 * @param error - The error to log
 * @param context - Additional context information
 */
export function logError(error: Error, context?: Record<string, unknown>): void {
  const logEntry = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  };

  // In production, this would integrate with a logging service (e.g., Sentry, CloudWatch)
  console.error('[ERROR]', JSON.stringify(logEntry, null, 2));
}

/**
 * Logs info message with context
 * 
 * @param message - The message to log
 * @param context - Additional context information
 */
export function logInfo(message: string, context?: Record<string, unknown>): void {
  const logEntry = {
    level: 'INFO',
    message,
    context,
    timestamp: new Date().toISOString(),
  };

  console.log('[INFO]', JSON.stringify(logEntry, null, 2));
}

