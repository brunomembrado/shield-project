/**
 * Enterprise Password Validator
 * 
 * Implements bank-grade password validation with:
 * - Shannon entropy calculation
 * - Common password detection
 * - Pattern detection (keyboard walks, sequences)
 * - Dictionary word detection
 * - Breach database checking capability
 * - Strength scoring (0-100)
 * 
 * @module @shield/shared/security/passwordValidator
 */

import crypto from 'crypto';

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0-100
  entropy: number;
  errors: string[];
  warnings: string[];
  strength: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  timeToCrack: string;
}

export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
  minEntropy: number;
  preventCommon: boolean;
  preventUserInfo: boolean;
}

/**
 * Default password requirements for fintech/banking
 */
export const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
  minEntropy: 60,
  preventCommon: true,
  preventUserInfo: true,
};

/**
 * Production/Enterprise requirements (even stricter)
 */
export const ENTERPRISE_REQUIREMENTS: PasswordRequirements = {
  minLength: 16,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecial: true,
  minEntropy: 80,
  preventCommon: true,
  preventUserInfo: true,
};

/**
 * Common weak passwords (top 1000 most common)
 * In production, this should be loaded from a file or database
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password123', '123456', '12345678', '123456789', '12345',
  '1234567', 'password1', 'qwerty', 'abc123', '111111', 'admin',
  'letmein', 'welcome', 'monkey', 'dragon', 'master', 'sunshine',
  'princess', 'qwerty123', '654321', 'michael', 'superman', 'batman',
  'trustno1', 'password!', 'Password1', 'Password123', 'Welcome1',
  'Admin123', 'admin123', 'root', 'toor', 'changeme', 'Change_me',
  '1q2w3e4r', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234qwer',
  // Add more common passwords here...
]);

/**
 * Keyboard pattern sequences
 */
const KEYBOARD_PATTERNS = [
  'qwerty', 'asdfgh', 'zxcvbn', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
  '1qaz', '2wsx', '3edc', '4rfv', '5tgb', '6yhn', '7ujm', '8ik,', '9ol.',
  'qazwsx', 'wsxedc', 'edcrfv', 'rfvtgb',
];

/**
 * Common sequential patterns
 */
const SEQUENTIAL_PATTERNS = [
  '0123456789', '9876543210', 'abcdefghijklmnopqrstuvwxyz',
  'zyxwvutsrqponmlkjihgfedcba',
];

/**
 * Calculates Shannon entropy of a password
 * Higher entropy = more random/unpredictable
 * 
 * @param password - Password to analyze
 * @returns Entropy value in bits
 */
function calculateEntropy(password: string): number {
  if (!password || password.length === 0) return 0;

  const frequencyMap = new Map<string, number>();
  
  // Count character frequencies
  for (const char of password) {
    frequencyMap.set(char, (frequencyMap.get(char) || 0) + 1);
  }

  // Calculate Shannon entropy
  let entropy = 0;
  const length = password.length;
  
  for (const count of frequencyMap.values()) {
    const probability = count / length;
    entropy -= probability * Math.log2(probability);
  }

  // Multiply by length to get total entropy
  return entropy * length;
}

/**
 * Calculates password strength score (0-100)
 */
function calculateStrengthScore(
  password: string,
  entropy: number,
  requirements: PasswordRequirements
): number {
  let score = 0;

  // Base score from length (max 25 points)
  score += Math.min(25, (password.length / requirements.maxLength) * 25);

  // Entropy score (max 35 points)
  score += Math.min(35, (entropy / 100) * 35);

  // Character diversity (max 20 points)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  
  const diversity = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  score += (diversity / 4) * 20;

  // Unpredictability (max 20 points)
  if (!containsKeyboardPattern(password)) score += 5;
  if (!containsSequentialPattern(password)) score += 5;
  if (!containsRepeatingPatterns(password)) score += 5;
  if (!COMMON_PASSWORDS.has(password.toLowerCase())) score += 5;

  return Math.min(100, Math.round(score));
}

/**
 * Checks if password contains keyboard patterns
 */
function containsKeyboardPattern(password: string): boolean {
  const lower = password.toLowerCase();
  return KEYBOARD_PATTERNS.some(pattern => 
    lower.includes(pattern) || lower.includes(pattern.split('').reverse().join(''))
  );
}

/**
 * Checks if password contains sequential patterns
 */
function containsSequentialPattern(password: string): boolean {
  const lower = password.toLowerCase();
  return SEQUENTIAL_PATTERNS.some(pattern => {
    for (let i = 0; i <= pattern.length - 4; i++) {
      const sequence = pattern.substring(i, i + 4);
      if (lower.includes(sequence) || lower.includes(sequence.split('').reverse().join(''))) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Checks for repeating character patterns
 */
function containsRepeatingPatterns(password: string): boolean {
  // Check for 3+ repeating characters
  if (/(.)\1{2,}/.test(password)) return true;
  
  // Check for repeated short patterns (e.g., "123123123")
  for (let len = 2; len <= password.length / 3; len++) {
    for (let i = 0; i <= password.length - len * 2; i++) {
      const pattern = password.substring(i, i + len);
      const next = password.substring(i + len, i + len * 2);
      if (pattern === next) return true;
    }
  }
  
  return false;
}

/**
 * Estimates time to crack password using brute force
 */
function estimateTimeToCrack(password: string, entropy: number): string {
  // Assume attacker can try 1 billion passwords per second (modern GPU)
  const attempts = Math.pow(2, entropy);
  const secondsToCrack = attempts / 1_000_000_000;

  if (secondsToCrack < 1) return 'instant';
  if (secondsToCrack < 60) return `${Math.round(secondsToCrack)} seconds`;
  if (secondsToCrack < 3600) return `${Math.round(secondsToCrack / 60)} minutes`;
  if (secondsToCrack < 86400) return `${Math.round(secondsToCrack / 3600)} hours`;
  if (secondsToCrack < 31536000) return `${Math.round(secondsToCrack / 86400)} days`;
  if (secondsToCrack < 3153600000) return `${Math.round(secondsToCrack / 31536000)} years`;
  
  return 'centuries (quantum-resistant)';
}

/**
 * Determines password strength category
 */
function determineStrength(score: number): PasswordValidationResult['strength'] {
  if (score < 20) return 'very-weak';
  if (score < 40) return 'weak';
  if (score < 60) return 'fair';
  if (score < 80) return 'strong';
  return 'very-strong';
}

/**
 * Checks if password contains user information
 */
function containsUserInfo(password: string, userInfo?: { email?: string; name?: string }): boolean {
  if (!userInfo) return false;
  
  const lower = password.toLowerCase();
  
  if (userInfo.email) {
    const emailParts = userInfo.email.toLowerCase().split('@')[0].split(/[._-]/);
    for (const part of emailParts) {
      if (part.length >= 3 && lower.includes(part)) return true;
    }
  }
  
  if (userInfo.name) {
    const nameParts = userInfo.name.toLowerCase().split(/\s+/);
    for (const part of nameParts) {
      if (part.length >= 3 && lower.includes(part)) return true;
    }
  }
  
  return false;
}

/**
 * Validates password against comprehensive security rules
 * 
 * @param password - Password to validate
 * @param requirements - Password requirements (optional, uses defaults)
 * @param userInfo - User information to prevent password containing user data
 * @returns Detailed validation result
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_REQUIREMENTS,
  userInfo?: { email?: string; name?: string }
): PasswordValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic validation
  if (!password) {
    return {
      isValid: false,
      score: 0,
      entropy: 0,
      errors: ['Password is required'],
      warnings: [],
      strength: 'very-weak',
      timeToCrack: 'instant',
    };
  }

  // Length requirements
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }
  if (password.length > requirements.maxLength) {
    errors.push(`Password must not exceed ${requirements.maxLength} characters`);
  }

  // Character requirements
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (requirements.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (requirements.requireSpecial && !/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&^#()_+-=[]{}|;:,.<>/)');
  }

  // Calculate entropy
  const entropy = calculateEntropy(password);
  if (entropy < requirements.minEntropy) {
    errors.push(`Password entropy too low (${Math.round(entropy)} bits, minimum ${requirements.minEntropy} required)`);
  }

  // Common password check
  if (requirements.preventCommon && COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('This password is too common and easily guessable');
  }

  // Pattern checks
  if (containsKeyboardPattern(password)) {
    warnings.push('Password contains keyboard patterns (e.g., qwerty) which are easier to guess');
  }
  if (containsSequentialPattern(password)) {
    warnings.push('Password contains sequential characters (e.g., abc, 123) which reduce security');
  }
  if (containsRepeatingPatterns(password)) {
    warnings.push('Password contains repeating patterns which reduce security');
  }

  // User info check
  if (requirements.preventUserInfo && containsUserInfo(password, userInfo)) {
    errors.push('Password cannot contain your name or email address');
  }

  // Calculate score and strength
  const score = calculateStrengthScore(password, entropy, requirements);
  const strength = determineStrength(score);
  const timeToCrack = estimateTimeToCrack(password, entropy);

  return {
    isValid: errors.length === 0,
    score,
    entropy: Math.round(entropy),
    errors,
    warnings,
    strength,
    timeToCrack,
  };
}

/**
 * Generates a strong random password
 * 
 * @param length - Length of password (default 16)
 * @returns Cryptographically secure random password
 */
export function generateStrongPassword(length: number = 16): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '@$!%*?&^#()_+-=[]{}|;:,.<>/';
  
  const allChars = lowercase + uppercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one of each required type
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += special[crypto.randomInt(special.length)];
  
  // Fill remaining with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }
  
  // Shuffle password
  return password.split('').sort(() => crypto.randomInt(3) - 1).join('');
}

/**
 * Hashes password using bcrypt (for storage)
 * 
 * @param password - Plain text password
 * @param rounds - Bcrypt rounds (default 12)
 * @returns Hashed password
 */
export async function hashPassword(password: string, rounds: number = 12): Promise<string> {
  const bcrypt = require('bcryptjs');
  return bcrypt.hash(password, rounds);
}

/**
 * Verifies password against hash
 * 
 * @param password - Plain text password
 * @param hash - Bcrypt hash
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = require('bcryptjs');
  return bcrypt.compare(password, hash);
}

/**
 * Checks if password has been in a known data breach
 * Uses k-anonymity model with Have I Been Pwned API
 * 
 * @param password - Password to check
 * @returns Number of times password appears in breaches (0 = safe)
 */
export async function checkPasswordBreach(password: string): Promise<number> {
  try {
    const crypto = require('crypto');
    const https = require('https');
    
    // Hash password with SHA-1
    const sha1Hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1Hash.substring(0, 5);
    const suffix = sha1Hash.substring(5);
    
    // Query HIBP API with k-anonymity (only send first 5 chars)
    return new Promise((resolve, reject) => {
      https.get(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { 'User-Agent': 'Shield-Platform-Password-Validator' },
      }, (res: import('http').IncomingMessage) => {
        let data = '';
        
        res.on('data', (chunk: Buffer | string) => { data += chunk.toString(); });
        res.on('end', () => {
          const lines = data.split('\n');
          for (const line of lines) {
            const [hashSuffix, count] = line.split(':');
            if (hashSuffix === suffix) {
              resolve(parseInt(count.trim(), 10));
              return;
            }
          }
          resolve(0); // Not found in breaches
        });
      }).on('error', () => {
        resolve(0); // On error, don't block password
      });
    });
  } catch (error) {
    // On any error, don't block the password
    return 0;
  }
}

/**
 * Joi validation schema for password with custom rules
 */
export function createPasswordSchema(requirements: PasswordRequirements = DEFAULT_REQUIREMENTS) {
  const Joi = require('joi');
  
  let schema = Joi.string()
    .min(requirements.minLength)
    .max(requirements.maxLength)
    .required();

  if (requirements.requireUppercase) {
    schema = schema.pattern(/[A-Z]/, 'uppercase letter');
  }
  if (requirements.requireLowercase) {
    schema = schema.pattern(/[a-z]/, 'lowercase letter');
  }
  if (requirements.requireNumbers) {
    schema = schema.pattern(/[0-9]/, 'number');
  }
  if (requirements.requireSpecial) {
    schema = schema.pattern(/[^a-zA-Z0-9]/, 'special character');
  }

  return schema.custom((value: string, helpers: { error: (type: string, options?: { message?: string }) => Error }) => {
    const result = validatePassword(value, requirements);
    
    if (!result.isValid) {
      return helpers.error('any.invalid', { 
        message: result.errors.join('; ') 
      });
    }
    
    return value;
  });
}

