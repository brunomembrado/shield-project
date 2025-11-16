/**
 * Enterprise Encryption Utilities
 * 
 * Provides military-grade encryption for sensitive data:
 * - AES-256-GCM encryption for data at rest
 * - Field-level encryption for databases
 * - Secure key derivation
 * - Data tokenization
 * - Encryption key rotation support
 * 
 * @module @shield/shared/security/encryption
 */

import crypto from 'crypto';

/**
 * Encryption algorithm - AES-256-GCM (Galois/Counter Mode)
 * Provides both confidentiality and authenticity
 */
const ALGORITHM = process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  version: string;
}

/**
 * Derives encryption key from master key and salt
 * Uses PBKDF2 with 100,000 iterations
 * 
 * @param masterKey - Master encryption key
 * @param salt - Cryptographic salt
 * @returns Derived key
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    masterKey,
    salt,
    100000, // iterations
    KEY_LENGTH,
    'sha512'
  );
}

/**
 * Gets encryption key from environment
 * In production, this should be retrieved from a key management service (KMS)
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY not configured. Set it in environment variables.');
  }

  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }

  return key;
}

/**
 * Encrypts data using AES-256-GCM
 * 
 * @param plaintext - Data to encrypt
 * @param additionalData - Additional authenticated data (optional)
 * @returns Encrypted data object
 * 
 * @example
 * ```typescript
 * const encrypted = encrypt('sensitive-data');
 * // Store encrypted.encrypted, encrypted.iv, encrypted.authTag in database
 * ```
 */
export function encrypt(plaintext: string, additionalData?: string): EncryptedData {
  try {
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Generate salt
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive key
    const masterKey = getEncryptionKey();
    const key = deriveKey(masterKey, salt);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Add additional authenticated data if provided
    if (additionalData) {
      (cipher as any).setAAD(Buffer.from(additionalData, 'utf8'));
    }
    
    // Encrypt data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = (cipher as any).getAuthTag();
    
    // Combine salt + encrypted data for storage
    const combined = Buffer.concat([salt, Buffer.from(encrypted, 'hex')]);
    
    return {
      encrypted: combined.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      version: '1', // For key rotation support
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data encrypted with encrypt()
 * 
 * @param encryptedData - Encrypted data object
 * @param additionalData - Additional authenticated data (must match encryption)
 * @returns Decrypted plaintext
 * 
 * @example
 * ```typescript
 * const plaintext = decrypt(encryptedData);
 * ```
 */
export function decrypt(encryptedData: EncryptedData, additionalData?: string): string {
  try {
    // Decode encrypted data
    const combined = Buffer.from(encryptedData.encrypted, 'base64');
    
    // Extract salt and encrypted content
    const salt = combined.slice(0, SALT_LENGTH);
    const encrypted = combined.slice(SALT_LENGTH);
    
    // Derive key
    const masterKey = getEncryptionKey();
    const key = deriveKey(masterKey, salt);
    
    // Decode IV and auth tag
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    (decipher as any).setAuthTag(authTag);
    
    // Add additional authenticated data if provided
    if (additionalData) {
      (decipher as any).setAAD(Buffer.from(additionalData, 'utf8'));
    }
    
    // Decrypt data
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data - data may be corrupted or tampered with');
  }
}

/**
 * Encrypts an object (serializes to JSON first)
 * 
 * @param obj - Object to encrypt
 * @returns Encrypted data
 */
export function encryptObject<T>(obj: T): EncryptedData {
  const json = JSON.stringify(obj);
  return encrypt(json);
}

/**
 * Decrypts an object (deserializes from JSON)
 * 
 * @param encryptedData - Encrypted data
 * @returns Decrypted object
 */
export function decryptObject<T>(encryptedData: EncryptedData): T {
  const json = decrypt(encryptedData);
  return JSON.parse(json) as T;
}

/**
 * Creates a hash of data (one-way, for verification)
 * Uses SHA-256
 * 
 * @param data - Data to hash
 * @returns Hash as hex string
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Creates a hash with salt (more secure for passwords)
 * 
 * @param data - Data to hash
 * @param salt - Salt (will be generated if not provided)
 * @returns Object with hash and salt
 */
export function hashWithSalt(data: string, salt?: string): { hash: string; salt: string } {
  const saltBuffer = salt ? Buffer.from(salt, 'hex') : crypto.randomBytes(32);
  const hashBuffer = crypto.pbkdf2Sync(data, saltBuffer, 100000, 64, 'sha512');
  
  return {
    hash: hashBuffer.toString('hex'),
    salt: saltBuffer.toString('hex'),
  };
}

/**
 * Verifies data against hash
 * 
 * @param data - Data to verify
 * @param hash - Hash to compare against
 * @param salt - Salt used in hashing
 * @returns True if data matches hash
 */
export function verifyHash(data: string, hash: string, salt: string): boolean {
  const computed = hashWithSalt(data, salt);
  return crypto.timingSafeEqual(
    Buffer.from(computed.hash, 'hex'),
    Buffer.from(hash, 'hex')
  );
}

/**
 * Generates a secure random token
 * Useful for API keys, session tokens, etc.
 * 
 * @param length - Length in bytes (default 32)
 * @returns Random token as base64 string
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Generates a UUID v4
 * 
 * @returns UUID string
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Tokenizes sensitive data (creates a random token mapped to data)
 * Useful for PCI compliance (credit cards, etc.)
 */
class TokenVault {
  private vault = new Map<string, string>();

  /**
   * Tokenizes data
   * 
   * @param data - Sensitive data
   * @returns Token that can be safely stored
   */
  tokenize(data: string): string {
    const token = generateToken(32);
    this.vault.set(token, data);
    return token;
  }

  /**
   * Detokenizes data
   * 
   * @param token - Token
   * @returns Original sensitive data
   */
  detokenize(token: string): string | undefined {
    return this.vault.get(token);
  }

  /**
   * Removes token from vault
   * 
   * @param token - Token to remove
   */
  remove(token: string): void {
    this.vault.delete(token);
  }

  /**
   * Clears entire vault
   */
  clear(): void {
    this.vault.clear();
  }
}

export const tokenVault = new TokenVault();

/**
 * Masks sensitive data for logging
 * Shows only first and last few characters
 * 
 * @param data - Data to mask
 * @param visibleChars - Number of visible characters on each end
 * @returns Masked string
 * 
 * @example
 * ```typescript
 * maskSensitive('1234567890123456', 4) // '1234********3456'
 * maskSensitive('user@example.com', 2) // 'us**@ex******.com'
 * ```
 */
export function maskSensitive(data: string, visibleChars: number = 4): string {
  if (!data) return '';
  if (data.length <= visibleChars * 2) return '*'.repeat(data.length);
  
  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const masked = '*'.repeat(Math.max(8, data.length - visibleChars * 2));
  
  return `${start}${masked}${end}`;
}

/**
 * Masks email address
 * 
 * @param email - Email to mask
 * @returns Masked email
 * 
 * @example
 * ```typescript
 * maskEmail('john.doe@example.com') // 'jo****@example.com'
 * ```
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return maskSensitive(email);
  
  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2 
    ? local.substring(0, 2) + '****'
    : '****';
  
  return `${maskedLocal}@${domain}`;
}

/**
 * Masks credit card number
 * 
 * @param cardNumber - Card number to mask
 * @returns Masked card number
 * 
 * @example
 * ```typescript
 * maskCardNumber('4532123456789012') // '4532 **** **** 9012'
 * ```
 */
export function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\s/g, '');
  
  if (cleaned.length < 12) return maskSensitive(cleaned);
  
  const first4 = cleaned.substring(0, 4);
  const last4 = cleaned.substring(cleaned.length - 4);
  
  return `${first4} **** **** ${last4}`;
}

/**
 * Generates encryption key (for initial setup)
 * 
 * @returns Base64-encoded 256-bit key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}

/**
 * Validates encryption key format
 * 
 * @param key - Key to validate
 * @returns True if valid
 */
export function isValidEncryptionKey(key: string): boolean {
  try {
    const decoded = Buffer.from(key, 'base64');
    return decoded.length >= KEY_LENGTH;
  } catch {
    return false;
  }
}

/**
 * Field-level encryption helpers for database
 */
export class FieldEncryption {
  /**
   * Encrypts a database field
   * 
   * @param value - Value to encrypt
   * @param fieldName - Field name (used as additional authenticated data)
   * @returns Encrypted value as JSON string
   */
  static encryptField(value: unknown, fieldName: string): string | null | undefined {
    if (value === null || value === undefined) return value;
    
    const encrypted = encrypt(JSON.stringify(value), fieldName);
    return JSON.stringify(encrypted);
  }

  /**
   * Decrypts a database field
   * 
   * @param encryptedValue - Encrypted JSON string
   * @param fieldName - Field name (must match encryption)
   * @returns Decrypted value
   */
  static decryptField(encryptedValue: string, fieldName: string): unknown {
    if (!encryptedValue) return encryptedValue;
    
    try {
      const encrypted = JSON.parse(encryptedValue) as EncryptedData;
      const decrypted = decrypt(encrypted, fieldName);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error(`Failed to decrypt field ${fieldName}:`, error);
      throw new Error(`Failed to decrypt field: ${fieldName}`);
    }
  }
}

/**
 * Secure comparison that prevents timing attacks
 * 
 * @param a - First string
 * @param b - Second string
 * @returns True if equal
 */
export function secureCompare(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(a, 'utf8'),
      Buffer.from(b, 'utf8')
    );
  } catch {
    // Length mismatch or other error - not equal
    return false;
  }
}

/**
 * Generates a cryptographically secure random number in range
 * 
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns Random number
 */
export function secureRandomInt(min: number, max: number): number {
  return crypto.randomInt(min, max);
}

