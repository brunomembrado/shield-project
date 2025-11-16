/**
 * Enterprise Security Middleware Suite
 * 
 * Comprehensive security middleware for fintech applications:
 * - SQL Injection protection
 * - XSS (Cross-Site Scripting) prevention
 * - Request sanitization and validation
 * - Brute force protection
 * - IP-based rate limiting
 * - Suspicious activity detection
 * - Request fingerprinting
 * - CSRF protection
 * 
 * @module @shield/shared/security/securityMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// ============================================================================
// SQL Injection Protection
// ============================================================================

/**
 * SQL injection patterns to detect and block
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
  /(\bOR\b.*=.*)/gi,
  /(\bAND\b.*=.*)/gi,
  /(--|\#|\/\*|\*\/)/g,
  /('|")(.*)\1.*=/gi,
  /(\bxp_\w+)/gi, // SQL Server extended procedures
  /(\bsp_\w+)/gi, // SQL Server stored procedures
  /(\binto\s+outfile\b)/gi,
  /(\bload_file\b)/gi,
  /(\bunion\s+select)/gi,
  /(\bconcat\s*\()/gi,
  /(\bchar\s*\()/gi,
  /(0x[0-9a-f]+)/gi, // Hex encoding
  /(\\\x27)/gi, // Escape sequences
];

/**
 * NoSQL injection patterns
 */
const NOSQL_INJECTION_PATTERNS = [
  /\$where/gi,
  /\$ne/gi,
  /\$gt/gi,
  /\$gte/gi,
  /\$lt/gi,
  /\$lte/gi,
  /\$regex/gi,
  /\$in/gi,
  /\$nin/gi,
];

/**
 * Detects potential SQL injection attempts
 */
function detectSQLInjection(input: string): boolean {
  if (typeof input !== 'string') return false;
  
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Detects potential NoSQL injection attempts
 */
function detectNoSQLInjection(input: unknown): boolean {
  if (typeof input === 'string') {
    return NOSQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
  }
  
  if (typeof input === 'object' && input !== null) {
    const str = JSON.stringify(input);
    return NOSQL_INJECTION_PATTERNS.some(pattern => pattern.test(str));
  }
  
  return false;
}

/**
 * Middleware to protect against SQL and NoSQL injection
 */
export function sqlInjectionProtection(req: Request, res: Response, next: NextFunction): void {
  try {
    const checkObject = (obj: unknown, path: string = ''): boolean => {
      if (!obj || typeof obj !== 'object') {
        return false;
      }

      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'string') {
          if (detectSQLInjection(value) || detectNoSQLInjection(value)) {
            console.error(`🚨 SQL/NoSQL injection attempt detected in ${currentPath}:`, value);
            return true;
          }
        } else if (typeof value === 'object' && value !== null) {
          if (detectNoSQLInjection(value) || checkObject(value, currentPath)) {
            return true;
          }
        }
      }

      return false;
    };

    // Check all input sources
    if (checkObject(req.body, 'body') || 
        checkObject(req.query, 'query') || 
        checkObject(req.params, 'params')) {
      
      logSecurityEvent(req, 'SQL_INJECTION_ATTEMPT', {
        body: req.body,
        query: req.query,
        params: req.params,
      });

      res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Invalid characters detected in request',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error in SQL injection protection:', error);
    next();
  }
}

// ============================================================================
// XSS Protection
// ============================================================================

/**
 * XSS attack patterns
 */
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  /<img[^>]+src\s*=\s*["']?javascript:/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
];

/**
 * Detects potential XSS attacks
 */
function detectXSS(input: string): boolean {
  if (typeof input !== 'string') return false;
  
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitizes string to prevent XSS
 */
function sanitizeXSS(input: string): string {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Middleware to protect against XSS attacks
 */
export function xssProtection(req: Request, res: Response, next: NextFunction): void {
  try {
    const checkForXSS = (obj: unknown, path: string = ''): boolean => {
      if (!obj || typeof obj !== 'object') return false;

      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'string') {
          if (detectXSS(value)) {
            console.error(`🚨 XSS attempt detected in ${currentPath}:`, value);
            return true;
          }
        } else if (typeof value === 'object' && value !== null) {
          if (checkForXSS(value, currentPath)) {
            return true;
          }
        }
      }

      return false;
    };

    if (checkForXSS(req.body, 'body') || 
        checkForXSS(req.query, 'query')) {
      
      logSecurityEvent(req, 'XSS_ATTEMPT', {
        body: req.body,
        query: req.query,
      });

      res.status(400).json({
        success: false,
        error: 'INVALID_INPUT',
        message: 'Potentially malicious content detected',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error in XSS protection:', error);
    next();
  }
}

// ============================================================================
// Request Sanitization
// ============================================================================

/**
 * Sanitizes all request inputs
 */
export function sanitizeRequest(req: Request, res: Response, next: NextFunction): void {
  const sanitizeObject = (obj: unknown): unknown => {
    if (!obj || typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Trim whitespace
        let cleaned = value.trim();
        
        // Remove null bytes
        cleaned = cleaned.replace(/\0/g, '');
        
        // Limit string length
        if (cleaned.length > 10000) {
          cleaned = cleaned.substring(0, 10000);
        }
        
        sanitized[key] = cleaned;
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  };

  req.body = sanitizeObject(req.body) as typeof req.body;
  req.params = sanitizeObject(req.params) as typeof req.params;
  
  // Note: In Express 5, req.query is read-only and cannot be reassigned.
  // Express already safely parses query parameters, so we skip sanitizing it here.
  // SQL injection and XSS protection middleware will still check query parameters.

  next();
}

// ============================================================================
// Brute Force Protection
// ============================================================================

interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  locked: boolean;
  lockExpires?: number;
}

const loginAttempts = new Map<string, LoginAttempt>();

const BRUTE_FORCE_CONFIG = {
  maxAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
  windowMs: parseInt(process.env.LOGIN_WINDOW_MS || '900000'), // 15 minutes
  lockDuration: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION_MS || '900000'), // 15 minutes
};

/**
 * Records a failed login attempt
 */
export function recordFailedLogin(identifier: string): void {
  const now = Date.now();
  const existing = loginAttempts.get(identifier);

  if (!existing) {
    loginAttempts.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      locked: false,
    });
    return;
  }

  // Reset if outside window
  if (now - existing.firstAttempt > BRUTE_FORCE_CONFIG.windowMs) {
    loginAttempts.set(identifier, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now,
      locked: false,
    });
    return;
  }

  existing.count++;
  existing.lastAttempt = now;

  // Lock account if max attempts exceeded
  if (existing.count >= BRUTE_FORCE_CONFIG.maxAttempts) {
    existing.locked = true;
    existing.lockExpires = now + BRUTE_FORCE_CONFIG.lockDuration;
    
    console.warn(`🔒 Account locked: ${identifier} after ${existing.count} failed attempts`);
  }

  loginAttempts.set(identifier, existing);
}

/**
 * Records a successful login (resets attempts)
 */
export function recordSuccessfulLogin(identifier: string): void {
  loginAttempts.delete(identifier);
}

/**
 * Checks if account is locked due to brute force
 */
export function isAccountLocked(identifier: string): boolean {
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts || !attempts.locked) return false;

  const now = Date.now();
  
  // Check if lock has expired
  if (attempts.lockExpires && now > attempts.lockExpires) {
    loginAttempts.delete(identifier);
    return false;
  }

  return true;
}

/**
 * Gets remaining time for account lock
 */
export function getLockRemainingTime(identifier: string): number {
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts || !attempts.locked || !attempts.lockExpires) return 0;

  const remaining = attempts.lockExpires - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000)); // Return seconds
}

/**
 * Middleware to check for account lockout
 */
export function bruteForceProtection(req: Request, res: Response, next: NextFunction): void {
  // Only apply to login endpoints
  if (!req.path.includes('/login') && !req.path.includes('/auth')) {
    next();
    return;
  }

  const identifier = req.body?.email || req.ip || 'unknown';

  if (isAccountLocked(identifier)) {
    const remainingTime = getLockRemainingTime(identifier);
    
    logSecurityEvent(req, 'BRUTE_FORCE_BLOCKED', { identifier, remainingTime });

    res.status(429).json({
      success: false,
      error: 'ACCOUNT_LOCKED',
      message: `Too many failed login attempts. Account is locked.`,
      retryAfter: remainingTime,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
}

// ============================================================================
// Suspicious Activity Detection
// ============================================================================

interface SuspiciousActivityScore {
  score: number;
  reasons: string[];
}

/**
 * Analyzes request for suspicious patterns
 */
function analyzeSuspiciousActivity(req: Request): SuspiciousActivityScore {
  let score = 0;
  const reasons: string[] = [];

  // Check User-Agent
  const userAgent = req.headers['user-agent'];
  if (!userAgent) {
    score += 20;
    reasons.push('Missing User-Agent');
  } else if (/bot|crawler|spider|scraper/i.test(userAgent)) {
    score += 15;
    reasons.push('Bot-like User-Agent');
  }

  // Check for unusual request patterns
  if (req.body) {
    const bodyString = JSON.stringify(req.body);
    const bodySize = bodyString ? bodyString.length : 0;
    if (bodySize > 100000) {
      score += 25;
      reasons.push('Unusually large request body');
    }
  }

  // Check for multiple authentication headers
  const authHeaders = Object.keys(req.headers).filter(h => 
    h.toLowerCase().includes('auth') || h.toLowerCase().includes('token')
  );
  if (authHeaders.length > 2) {
    score += 15;
    reasons.push('Multiple authentication headers');
  }

  // Check for unusual query parameters
  const queryKeys = Object.keys(req.query);
  if (queryKeys.length > 50) {
    score += 20;
    reasons.push('Excessive query parameters');
  }

  // Check for known attack patterns in URL
  if (/\.\.[\/\\]/.test(req.url)) {
    score += 30;
    reasons.push('Path traversal attempt');
  }

  return { score, reasons };
}

/**
 * Middleware to detect and block suspicious activity
 */
export function suspiciousActivityDetection(
  threshold: number = 50
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const analysis = analyzeSuspiciousActivity(req);

    if (analysis.score >= threshold) {
      logSecurityEvent(req, 'SUSPICIOUS_ACTIVITY', {
        score: analysis.score,
        reasons: analysis.reasons,
      });

      res.status(403).json({
        success: false,
        error: 'SUSPICIOUS_ACTIVITY',
        message: 'Request blocked due to suspicious patterns',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

// ============================================================================
// Request Fingerprinting
// ============================================================================

/**
 * Generates unique fingerprint for request
 */
export function generateRequestFingerprint(req: Request): string {
  const components = [
    req.ip,
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
  ];

  const hash = crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex');

  return hash.substring(0, 16);
}

/**
 * Adds request fingerprint to request object
 */
export function requestFingerprinting(req: Request, res: Response, next: NextFunction): void {
  (req as any).fingerprint = generateRequestFingerprint(req);
  next();
}

// ============================================================================
// CSRF Protection
// ============================================================================

/**
 * Generates CSRF token
 */
export function generateCSRFToken(sessionId: string): string {
  const secret = process.env.SESSION_SECRET || 'default-secret';
  const timestamp = Date.now().toString();
  
  const token = crypto
    .createHmac('sha256', secret)
    .update(`${sessionId}:${timestamp}`)
    .digest('hex');

  return `${token}:${timestamp}`;
}

/**
 * Validates CSRF token
 */
export function validateCSRFToken(token: string, sessionId: string): boolean {
  try {
    const [tokenHash, timestamp] = token.split(':');
    const secret = process.env.SESSION_SECRET || 'default-secret';

    // Check token age (max 24 hours)
    const age = Date.now() - parseInt(timestamp);
    if (age > 86400000) return false;

    const expectedToken = crypto
      .createHmac('sha256', secret)
      .update(`${sessionId}:${timestamp}`)
      .digest('hex');

    return tokenHash === expectedToken;
  } catch {
    return false;
  }
}

/**
 * CSRF protection middleware
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }

  const token = req.headers['x-csrf-token'] as string;
  const sessionId = (req as any).sessionId || req.headers['x-session-id'] as string;

  if (!token || !sessionId) {
    res.status(403).json({
      success: false,
      error: 'CSRF_TOKEN_MISSING',
      message: 'CSRF token is required',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!validateCSRFToken(token, sessionId)) {
    logSecurityEvent(req, 'CSRF_VALIDATION_FAILED', { token, sessionId });

    res.status(403).json({
      success: false,
      error: 'CSRF_TOKEN_INVALID',
      message: 'Invalid CSRF token',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
}

// ============================================================================
// IP Filtering
// ============================================================================

const blockedIPs = new Set<string>();
const whitelistedIPs = new Set<string>();

/**
 * Adds IP to blocklist
 */
export function blockIP(ip: string): void {
  blockedIPs.add(ip);
  console.log(`🚫 IP blocked: ${ip}`);
}

/**
 * Removes IP from blocklist
 */
export function unblockIP(ip: string): void {
  blockedIPs.delete(ip);
  console.log(`✅ IP unblocked: ${ip}`);
}

/**
 * Adds IP to whitelist
 */
export function whitelistIP(ip: string): void {
  whitelistedIPs.add(ip);
  console.log(`✅ IP whitelisted: ${ip}`);
}

/**
 * IP filtering middleware
 */
export function ipFiltering(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  // Check whitelist first
  if (whitelistedIPs.has(ip)) {
    next();
    return;
  }

  // Check blocklist
  if (blockedIPs.has(ip)) {
    logSecurityEvent(req, 'BLOCKED_IP_ATTEMPT', { ip });

    res.status(403).json({
      success: false,
      error: 'IP_BLOCKED',
      message: 'Your IP address has been blocked',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
}

// ============================================================================
// Security Event Logging
// ============================================================================

interface SecurityEvent {
  timestamp: Date;
  type: string;
  ip: string;
  userAgent: string;
  path: string;
  method: string;
  userId?: string;
  data?: Record<string, unknown>;
}

const securityEvents: SecurityEvent[] = [];

/**
 * Logs security event
 */
function logSecurityEvent(req: Request, type: string, data?: Record<string, unknown>): void {
  const event: SecurityEvent = {
    timestamp: new Date(),
    type,
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
    path: req.path,
    method: req.method,
    userId: (req as any).userId,
    data,
  };

  securityEvents.push(event);

  // Keep only last 10000 events in memory
  if (securityEvents.length > 10000) {
    securityEvents.shift();
  }

  // Log to console
  console.warn('🔐 SECURITY EVENT:', JSON.stringify(event));

  // In production, send to logging service (e.g., CloudWatch, Datadog)
  // sendToLoggingService(event);
}

/**
 * Gets recent security events
 */
export function getSecurityEvents(limit: number = 100): SecurityEvent[] {
  return securityEvents.slice(-limit);
}

/**
 * Clears security events
 */
export function clearSecurityEvents(): void {
  securityEvents.length = 0;
}

