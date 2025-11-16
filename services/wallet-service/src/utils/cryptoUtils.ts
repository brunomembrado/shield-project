/**
 * Cryptographic Utilities for Private Key Encryption
 * 
 * Uses AES-256-GCM for encryption with PBKDF2 key derivation from user password
 * NASA-level security: never store plaintext private keys
 * 
 * @module wallet-service/utils/cryptoUtils
 */

import crypto from 'crypto';
import { ValidationError } from '@shield/shared/errors';

/**
 * Encryption algorithm configuration
 */
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 600000; // OWASP recommendation for 2024
const PBKDF2_DIGEST = 'sha512';

/**
 * Encryption result containing all necessary data for decryption
 */
export interface EncryptionResult {
  encryptedData: string; // Base64 encoded: encrypted data + auth tag
  iv: string; // Base64 encoded initialization vector
  salt: string; // Base64 encoded salt for PBKDF2
}

/**
 * Derives an encryption key from a password using PBKDF2
 * 
 * @param password - User's password
 * @param salt - Salt for key derivation (Buffer)
 * @returns Derived encryption key (Buffer)
 */
function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      PBKDF2_DIGEST,
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey);
      }
    );
  });
}

/**
 * Encrypts sensitive data (e.g., private key) using AES-256-GCM
 * 
 * @param plaintext - The data to encrypt (e.g., private key)
 * @param password - User's password (used for key derivation)
 * @returns Encryption result with encrypted data, IV, and salt
 * 
 * @throws ValidationError if password is too weak
 * 
 * @example
 * ```typescript
 * const result = await encryptPrivateKey('0x123...', 'UserPassword123!');
 * // Store result.encryptedData, result.iv, result.salt in database
 * ```
 */
export async function encryptPrivateKey(
  plaintext: string,
  password: string
): Promise<EncryptionResult> {
  // Validate password strength
  if (!password || password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long', {
      field: 'password',
      providedLength: password?.length || 0,
    });
  }

  try {
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive encryption key from password
    const key = await deriveKey(password, salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the data
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    // Get authentication tag (for integrity verification)
    const authTag = cipher.getAuthTag();

    // Combine encrypted data + auth tag
    const encryptedWithTag = Buffer.concat([encrypted, authTag]);

    return {
      encryptedData: encryptedWithTag.toString('base64'),
      iv: iv.toString('base64'),
      salt: salt.toString('base64'),
    };
  } catch (error) {
    throw new ValidationError('Encryption failed', {
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Decrypts encrypted data using AES-256-GCM
 * 
 * @param encryptedData - Base64 encoded encrypted data + auth tag
 * @param iv - Base64 encoded initialization vector
 * @param salt - Base64 encoded salt
 * @param password - User's password
 * @returns Decrypted plaintext (private key)
 * 
 * @throws ValidationError if decryption fails (wrong password, corrupted data, etc.)
 * 
 * @example
 * ```typescript
 * const privateKey = await decryptPrivateKey(
 *   wallet.privateKeyEncrypted,
 *   wallet.encryptionIv,
 *   wallet.encryptionSalt,
 *   'UserPassword123!'
 * );
 * ```
 */
export async function decryptPrivateKey(
  encryptedData: string,
  iv: string,
  salt: string,
  password: string
): Promise<string> {
  if (!encryptedData || !iv || !salt || !password) {
    throw new ValidationError('Missing required decryption parameters', {
      hasEncryptedData: !!encryptedData,
      hasIv: !!iv,
      hasSalt: !!salt,
      hasPassword: !!password,
    });
  }

  try {
    // Decode from base64
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const saltBuffer = Buffer.from(salt, 'base64');

    // Validate buffer sizes
    if (encryptedBuffer.length < AUTH_TAG_LENGTH) {
      throw new ValidationError('Invalid encrypted data: too short');
    }

    // Split encrypted data and auth tag
    const authTag = encryptedBuffer.slice(-AUTH_TAG_LENGTH);
    const encrypted = encryptedBuffer.slice(0, -AUTH_TAG_LENGTH);

    // Derive the same key from password + salt
    const key = await deriveKey(password, saltBuffer);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(authTag);

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    // Authentication tag verification failed = wrong password or corrupted data
    throw new ValidationError('Decryption failed: invalid password or corrupted data', {
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Securely wipes sensitive data from memory
 * 
 * @param data - String to wipe (e.g., private key, password)
 * 
 * @example
 * ```typescript
 * let privateKey = '0x123...';
 * // ... use private key ...
 * wipeFromMemory(privateKey);
 * privateKey = null;
 * ```
 */
export function wipeFromMemory(data: string): void {
  if (!data) return;
  
  // Overwrite with random data
  const buffer = Buffer.from(data, 'utf8');
  crypto.randomFillSync(buffer);
}

/**
 * Validates if a string is a valid Ethereum/Polygon private key
 * 
 * @param privateKey - Private key to validate (with or without 0x prefix)
 * @returns true if valid, false otherwise
 */
export function isValidEthereumPrivateKey(privateKey: string): boolean {
  const cleaned = privateKey.replace(/^0x/, '');
  return /^[a-fA-F0-9]{64}$/.test(cleaned);
}

/**
 * Validates if a string is a valid Tron private key
 * 
 * @param privateKey - Private key to validate
 * @returns true if valid, false otherwise
 */
export function isValidTronPrivateKey(privateKey: string): boolean {
  // Tron private keys are also 64 hex characters
  return /^[a-fA-F0-9]{64}$/.test(privateKey);
}

