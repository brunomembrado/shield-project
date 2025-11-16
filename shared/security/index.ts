/**
 * Shield Security Module - Public API
 * 
 * Exports all security utilities and middleware
 * 
 * @module @shield/shared/security
 */

// Environment validation
export {
  validateEnvironment,
  generateSecureSecret,
  validateServiceConnectivity,
  type ValidatedEnv,
  type AuthServiceEnv,
  type TransactionServiceEnv,
  type BlockchainServiceEnv,
  type GatewayServiceEnv,
} from './envValidator';

// Password validation and hashing
export {
  validatePassword,
  generateStrongPassword,
  hashPassword,
  verifyPassword,
  checkPasswordBreach,
  createPasswordSchema,
  DEFAULT_REQUIREMENTS,
  ENTERPRISE_REQUIREMENTS,
  type PasswordValidationResult,
  type PasswordRequirements,
} from './passwordValidator';

// Security middleware
export {
  sqlInjectionProtection,
  xssProtection,
  sanitizeRequest,
  bruteForceProtection,
  suspiciousActivityDetection,
  requestFingerprinting,
  csrfProtection,
  ipFiltering,
  recordFailedLogin,
  recordSuccessfulLogin,
  isAccountLocked,
  getLockRemainingTime,
  blockIP,
  unblockIP,
  whitelistIP,
  generateCSRFToken,
  validateCSRFToken,
  generateRequestFingerprint,
  getSecurityEvents,
  clearSecurityEvents,
} from './securityMiddleware';

// Encryption utilities
export {
  encrypt,
  decrypt,
  encryptObject,
  decryptObject,
  hash,
  hashWithSalt,
  verifyHash,
  generateToken,
  generateUUID,
  tokenVault,
  maskSensitive,
  maskEmail,
  maskCardNumber,
  generateEncryptionKey,
  isValidEncryptionKey,
  FieldEncryption,
  secureCompare,
  secureRandomInt,
  type EncryptedData,
} from './encryption';

// Audit logging
export {
  auditLog,
  AuditLogger,
  type AuditAction,
  type AuditEntry,
  getAuditLogs,
  exportAuditLogs,
} from './auditLogger';

