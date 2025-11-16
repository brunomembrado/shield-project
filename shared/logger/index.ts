/**
 * Advanced Logging System for Shield Platform
 * 
 * Comprehensive structured logging that tracks requests from controller to response.
 * Features:
 * - Correlation IDs for request tracking
 * - Log levels (DEBUG, INFO, WARN, ERROR, FATAL)
 * - Performance metrics
 * - Request/Response lifecycle tracking
 * - Structured JSON logging
 * - Type-safe implementation
 * 
 * @module @shield/shared/logger
 */

import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

/**
 * Log context metadata
 */
export interface LogContext {
  correlationId?: string;
  userId?: string;
  userEmail?: string;
  service?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: unknown;
}

/**
 * Structured log entry
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  correlationId?: string;
  service: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  performance?: {
    duration: number;
    unit: 'ms' | 's';
  };
  metadata?: Record<string, unknown>;
}

/**
 * Request lifecycle stages
 */
export enum RequestStage {
  INCOMING = 'INCOMING',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  CONTROLLER = 'CONTROLLER',
  SERVICE = 'SERVICE',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  RESPONSE = 'RESPONSE',
  ERROR = 'ERROR',
}

/**
 * Request tracking data
 */
export interface RequestTracking {
  correlationId: string;
  startTime: number;
  stages: Array<{
    stage: RequestStage;
    timestamp: number;
    duration?: number;
    metadata?: Record<string, unknown>;
  }>;
  userId?: string;
  method: string;
  path: string;
  statusCode?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// ============================================================================
// Logger Class
// ============================================================================

/**
 * Advanced logger class with structured logging and request tracking
 */
export class Logger {
  private serviceName: string;
  private minLogLevel: LogLevel;
  private requestTrackings: Map<string, RequestTracking>;

  constructor(serviceName: string, minLogLevel: LogLevel = LogLevel.INFO) {
    this.serviceName = serviceName;
    this.minLogLevel = minLogLevel;
    this.requestTrackings = new Map();
  }

  /**
   * Creates a log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    performance?: { duration: number; unit: 'ms' | 's' }
  ): LogEntry {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      correlationId: context?.correlationId,
      service: this.serviceName,
      context: context ? this.sanitizeContext(context) : undefined,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as Error & { code?: string }).code,
      };
    }

    if (performance) {
      logEntry.performance = performance;
    }

    return logEntry;
  }

  /**
   * Sanitizes context to remove sensitive data
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];

    for (const key in sanitized) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Outputs log entry to console (and potentially external service)
   */
  private outputLog(entry: LogEntry): void {
    const logString = JSON.stringify(entry, null, 2);
    
    switch (entry.level) {
      case 'DEBUG':
        console.debug(`[DEBUG] ${logString}`);
        break;
      case 'INFO':
        console.log(`[INFO] ${logString}`);
        break;
      case 'WARN':
        console.warn(`[WARN] ${logString}`);
        break;
      case 'ERROR':
      case 'FATAL':
        console.error(`[${entry.level}] ${logString}`);
        break;
    }

    // In production, send to logging service (CloudWatch, Datadog, etc.)
    // await this.sendToLoggingService(entry);
  }

  /**
   * Logs a debug message
   */
  debug(message: string, context?: LogContext): void {
    if (this.minLogLevel <= LogLevel.DEBUG) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
      this.outputLog(entry);
    }
  }

  /**
   * Logs an info message
   */
  info(message: string, context?: LogContext): void {
    if (this.minLogLevel <= LogLevel.INFO) {
      const entry = this.createLogEntry(LogLevel.INFO, message, context);
      this.outputLog(entry);
    }
  }

  /**
   * Logs a warning message
   */
  warn(message: string, context?: LogContext): void {
    if (this.minLogLevel <= LogLevel.WARN) {
      const entry = this.createLogEntry(LogLevel.WARN, message, context);
      this.outputLog(entry);
    }
  }

  /**
   * Logs an error
   */
  error(message: string, error: Error, context?: LogContext): void {
    if (this.minLogLevel <= LogLevel.ERROR) {
      const entry = this.createLogEntry(LogLevel.ERROR, message, context, error);
      this.outputLog(entry);
    }
  }

  /**
   * Logs a fatal error
   */
  fatal(message: string, error: Error, context?: LogContext): void {
    const entry = this.createLogEntry(LogLevel.FATAL, message, context, error);
    this.outputLog(entry);
  }

  /**
   * Starts tracking a request
   */
  startRequestTracking(req: Request): string {
    const correlationId = req.headers['x-correlation-id'] as string || randomUUID();
    const startTime = Date.now();

    const tracking: RequestTracking = {
      correlationId,
      startTime,
      stages: [{
        stage: RequestStage.INCOMING,
        timestamp: startTime,
        metadata: {
          method: req.method,
          path: req.path,
          query: req.query,
          headers: this.sanitizeHeaders(req.headers),
        },
      }],
      userId: (req as Request & { userId?: string }).userId,
      method: req.method,
      path: req.path,
    };

    this.requestTrackings.set(correlationId, tracking);

    // Attach correlation ID to request
    (req as Request & { correlationId?: string }).correlationId = correlationId;

    this.debug('Request tracking started', {
      correlationId,
      method: req.method,
      path: req.path,
      service: this.serviceName,
    });

    return correlationId;
  }

  /**
   * Records a request stage
   */
  recordStage(
    correlationId: string,
    stage: RequestStage,
    metadata?: Record<string, unknown>
  ): void {
    const tracking = this.requestTrackings.get(correlationId);
    if (!tracking) {
      this.warn('Attempted to record stage for unknown correlation ID', {
        correlationId,
        stage,
        service: this.serviceName,
      });
      return;
    }

    const now = Date.now();
    const lastStage = tracking.stages[tracking.stages.length - 1];
    const duration = lastStage ? now - lastStage.timestamp : undefined;

    tracking.stages.push({
      stage,
      timestamp: now,
      duration,
      metadata,
    });

    this.debug(`Request stage: ${stage}`, {
      correlationId,
      stage,
      duration,
      service: this.serviceName,
      ...metadata,
    });
  }

  /**
   * Completes request tracking and logs summary
   */
  completeRequestTracking(
    req: Request,
    res: Response,
    error?: Error
  ): void {
    const correlationId = (req as Request & { correlationId?: string }).correlationId;
    if (!correlationId) {
      return;
    }

    const tracking = this.requestTrackings.get(correlationId);
    if (!tracking) {
      return;
    }

    const endTime = Date.now();
    const totalDuration = endTime - tracking.startTime;
    tracking.statusCode = res.statusCode;

    if (error) {
      tracking.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
      tracking.stages.push({
        stage: RequestStage.ERROR,
        timestamp: endTime,
        metadata: {
          error: error.message,
        },
      });
    } else {
      tracking.stages.push({
        stage: RequestStage.RESPONSE,
        timestamp: endTime,
        metadata: {
          statusCode: res.statusCode,
        },
      });
    }

    // Log request summary
    const logLevel = error ? LogLevel.ERROR : 
                     res.statusCode >= 500 ? LogLevel.ERROR :
                     res.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

    const entry = this.createLogEntry(
      logLevel,
      `Request completed: ${req.method} ${req.path}`,
      {
        correlationId,
        userId: tracking.userId,
        method: tracking.method,
        path: tracking.path,
        service: this.serviceName,
      },
      error,
      { duration: totalDuration, unit: 'ms' }
    );

    entry.metadata = {
      statusCode: tracking.statusCode,
      stages: tracking.stages.map(s => ({
        stage: s.stage,
        duration: s.duration,
      })),
      totalDuration,
    };

    this.outputLog(entry);

    // Clean up old trackings (keep last 1000)
    if (this.requestTrackings.size > 1000) {
      const oldestKey = Array.from(this.requestTrackings.keys())[0];
      this.requestTrackings.delete(oldestKey);
    }
  }

  /**
   * Logs controller entry
   */
  logControllerEntry(
    controllerName: string,
    method: string,
    req: Request,
    params?: Record<string, unknown>
  ): void {
    const correlationId = (req as Request & { correlationId?: string }).correlationId;
    this.recordStage(correlationId || '', RequestStage.CONTROLLER, {
      controller: controllerName,
      method,
      params: params ? this.sanitizeContext(params as LogContext) : undefined,
    });

    this.info(`Controller entry: ${controllerName}.${method}`, {
      correlationId,
      controller: controllerName,
      method,
      service: this.serviceName,
    });
  }

  /**
   * Logs service call
   */
  logServiceCall(
    serviceName: string,
    method: string,
    correlationId: string,
    params?: Record<string, unknown>,
    duration?: number
  ): void {
    this.recordStage(correlationId, RequestStage.SERVICE, {
      service: serviceName,
      method,
      params: params ? this.sanitizeContext(params as LogContext) : undefined,
    });

    const context: LogContext = {
      correlationId,
      service: this.serviceName,
    };

    if (duration !== undefined) {
      this.info(`Service call: ${serviceName}.${method}`, {
        ...context,
        performance: { duration, unit: 'ms' as const },
      });
    } else {
      this.info(`Service call: ${serviceName}.${method}`, context);
    }
  }

  /**
   * Logs database operation
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    correlationId: string,
    duration?: number,
    metadata?: Record<string, unknown>
  ): void {
    this.recordStage(correlationId, RequestStage.DATABASE, {
      operation,
      table,
      ...metadata,
    });

    const context: LogContext = {
      correlationId,
      service: this.serviceName,
    };

    if (duration !== undefined) {
      this.debug(`Database ${operation} on ${table}`, {
        ...context,
        performance: { duration, unit: 'ms' as const },
        ...metadata,
      });
    } else {
      this.debug(`Database ${operation} on ${table}`, {
        ...context,
        ...metadata,
      });
    }
  }

  /**
   * Logs external API call
   */
  logExternalApiCall(
    apiName: string,
    endpoint: string,
    method: string,
    correlationId: string,
    duration?: number,
    statusCode?: number,
    error?: Error
  ): void {
    this.recordStage(correlationId, RequestStage.EXTERNAL_API, {
      api: apiName,
      endpoint,
      method,
      statusCode,
    });

    const context: LogContext = {
      correlationId,
      service: this.serviceName,
    };

    if (error) {
      this.error(`External API call failed: ${apiName} ${endpoint}`, error, {
        ...context,
        api: apiName,
        endpoint,
        method,
      });
    } else {
      const logMessage = `External API call: ${apiName} ${endpoint}`;
      if (duration !== undefined) {
        this.info(logMessage, {
          ...context,
          performance: { duration, unit: 'ms' as const },
          statusCode,
        });
      } else {
        this.info(logMessage, {
          ...context,
          statusCode,
        });
      }
    }
  }

  /**
   * Sanitizes HTTP headers
   */
  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Gets request tracking data
   */
  getRequestTracking(correlationId: string): RequestTracking | undefined {
    return this.requestTrackings.get(correlationId);
  }
}

// ============================================================================
// Default Logger Instance
// ============================================================================

/**
 * Creates a logger instance for a service
 */
export function createLogger(serviceName: string, minLogLevel?: LogLevel): Logger {
  return new Logger(serviceName, minLogLevel);
}

// ============================================================================
// Express Middleware
// ============================================================================

/**
 * Request tracking middleware
 * Must be used before other middleware to capture full request lifecycle
 */
export function requestTrackingMiddleware(logger: Logger) {
  return (req: Request, res: Response, next: () => void): void => {
    logger.startRequestTracking(req);
    next();
  };
}

/**
 * Request completion middleware
 * Must be used as error handler to capture response
 */
export function requestCompletionMiddleware(logger: Logger) {
  return (req: Request, res: Response, next: () => void): void => {
    const originalSend = res.send.bind(res);
    
    res.send = function(body: unknown) {
      logger.completeRequestTracking(req, res);
      return originalSend(body);
    };

    res.on('finish', () => {
      if (!res.headersSent) {
        logger.completeRequestTracking(req, res);
      }
    });

    next();
  };
}

