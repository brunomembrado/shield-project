/**
 * Centralized Security Middleware Setup
 * 
 * Provides helmet and other security middleware configured for all services.
 * This ensures consistent security headers and settings across the platform.
 * 
 * @module @shield/shared/middleware/security
 */

import { Express } from 'express';
import helmet from 'helmet';

/**
 * Configures helmet with enterprise-grade security settings
 * 
 * @param app - Express application instance
 * @param options - Optional helmet configuration overrides
 */
export function setupSecurityHeaders(
  app: Express,
  options?: {
    cspEnabled?: boolean;
    hstsMaxAge?: number;
    crossOriginEmbedderPolicy?: boolean;
  }
): void {
  const cspEnabled = options?.cspEnabled ?? process.env.CSP_ENABLED === 'true';
  const hstsMaxAge = options?.hstsMaxAge ?? parseInt(process.env.HSTS_MAX_AGE || '31536000', 10);
  const crossOriginEmbedderPolicy = options?.crossOriginEmbedderPolicy ?? false;

  app.use(
    helmet({
      // HTTP Strict Transport Security (HSTS)
      hsts: {
        maxAge: hstsMaxAge, // 1 year default
        includeSubDomains: true,
        preload: true,
      },
      // Content Security Policy
      contentSecurityPolicy: cspEnabled
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              scriptSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"],
            },
          }
        : false,
      // Cross-Origin Embedder Policy
      crossOriginEmbedderPolicy: crossOriginEmbedderPolicy,
      // Cross-Origin Resource Policy
      crossOriginResourcePolicy: {
        policy: 'same-origin',
      },
      // X-Content-Type-Options: nosniff
      // Prevents browsers from MIME-sniffing responses
      noSniff: true,
      // X-Frame-Options: DENY
      // Prevents clickjacking attacks
      frameguard: {
        action: 'deny',
      },
      // X-XSS-Protection
      // Legacy XSS protection (modern browsers use CSP)
      xssFilter: true,
      // X-DNS-Prefetch-Control
      // Controls DNS prefetching
      dnsPrefetchControl: true,
      // X-Download-Options
      // Prevents IE from executing downloads in site context
      ieNoOpen: true,
      // X-Permitted-Cross-Domain-Policies
      // Restricts Adobe products from loading content
      permittedCrossDomainPolicies: false,
      // Referrer-Policy
      // Controls referrer information
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      // Hide X-Powered-By header
      // Removes Express version disclosure
      hidePoweredBy: true,
    })
  );
}

