/**
 * Enterprise Database Connection Singleton
 * 
 * Robust database connection management with connection pooling,
 * health checks, and graceful shutdown handling.
 * 
 * @module @shield/shared/database
 */

import { isNotNull } from '../utils/guards';
import { authServiceLogger } from '../logger/serviceLogger';
import { createRequire } from 'module';

/**
 * Database connection configuration
 */
interface DatabaseConfig {
  maxConnections?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
  enableQueryLogging?: boolean;
}

/**
 * Database connection health status
 */
interface DatabaseHealth {
  isConnected: boolean;
  connectionCount: number;
  lastHealthCheck: Date;
  uptime: number;
}

/**
 * Enterprise Database Connection Singleton
 * 
 * Implements singleton pattern with connection pooling,
 * health monitoring, and graceful shutdown.
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  private prismaClient: any | null = null; // Using any to avoid import issues - will be PrismaClient at runtime
  private isConnected: boolean = false;
  private connectionStartTime: Date | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly config: Required<DatabaseConfig>;

  private constructor(config: DatabaseConfig = {}) {
    this.config = {
      maxConnections: config.maxConnections ?? 10,
      connectionTimeout: config.connectionTimeout ?? 30000,
      queryTimeout: config.queryTimeout ?? 30000,
      enableQueryLogging: config.enableQueryLogging ?? process.env.NODE_ENV === 'development',
    };
  }

  /**
   * Gets the singleton instance
   */
  public static getInstance(config?: DatabaseConfig): DatabaseConnection {
    if (!isNotNull(DatabaseConnection.instance)) {
      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  /**
   * Gets the Prisma client instance
   * 
   * @throws Error if database is not connected
   */
  public getClient(): any {
    if (!isNotNull(this.prismaClient)) {
      throw new Error('Database client is not initialized. Call connect() first.');
    }
    return this.prismaClient;
  }

  /**
   * Connects to the database
   * 
   * @throws Error if connection fails
   */
  public async connect(): Promise<void> {
    if (this.isConnected && isNotNull(this.prismaClient)) {
      return;
    }

    try {
      // Dynamically import PrismaClient from the service's @prisma/client (ESM)
      // Resolve from process.cwd() which is the service's root directory
      // This ensures we resolve @prisma/client from the service's node_modules
      const serviceRoot = process.cwd();
      const require = createRequire(serviceRoot + '/');
      const prismaModulePath = require.resolve('@prisma/client');
      const prismaModule = await import(prismaModulePath);
      const { PrismaClient } = prismaModule;
      this.prismaClient = new PrismaClient({
        log: this.config.enableQueryLogging
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      });

      await this.prismaClient.$connect();
      this.isConnected = true;
      this.connectionStartTime = new Date();

      // Start health check monitoring
      this.startHealthCheck();

      // Setup graceful shutdown handlers
      this.setupGracefulShutdown();

      const logger = authServiceLogger();
      logger.info('Database connected successfully', {
        maxConnections: this.config.maxConnections,
        connectionTimeout: this.config.connectionTimeout,
      });
    } catch (error) {
      this.isConnected = false;
      this.prismaClient = null;
      const logger = authServiceLogger();
      logger.error('Database connection failed', error as Error);
      throw new Error(`Failed to connect to database: ${(error as Error).message}`);
    }
  }

  /**
   * Disconnects from the database
   */
  public async disconnect(): Promise<void> {
    if (!this.isConnected || !isNotNull(this.prismaClient)) {
      return;
    }

    try {
      // Stop health checks
      this.stopHealthCheck();

      // Disconnect Prisma client
      await this.prismaClient.$disconnect();
      
      this.isConnected = false;
      this.prismaClient = null;
      this.connectionStartTime = null;

      const logger = authServiceLogger();
      logger.info('Database disconnected successfully');
    } catch (error) {
      const logger = authServiceLogger();
      logger.error('Database disconnection failed', error as Error);
      throw error;
    }
  }

  /**
   * Checks database health
   */
  public async checkHealth(): Promise<DatabaseHealth> {
    if (!isNotNull(this.prismaClient) || !this.isConnected) {
      return {
        isConnected: false,
        connectionCount: 0,
        lastHealthCheck: new Date(),
        uptime: 0,
      };
    }

    try {
      // Simple query to check connection
      await this.prismaClient.$queryRaw`SELECT 1`;

      const uptime = isNotNull(this.connectionStartTime)
        ? Date.now() - this.connectionStartTime.getTime()
        : 0;

      return {
        isConnected: true,
        connectionCount: 1, // Prisma manages connection pool internally
        lastHealthCheck: new Date(),
        uptime,
      };
    } catch (error) {
      const logger = authServiceLogger();
      logger.error('Database health check failed', error as Error);
      
      return {
        isConnected: false,
        connectionCount: 0,
        lastHealthCheck: new Date(),
        uptime: isNotNull(this.connectionStartTime)
          ? Date.now() - this.connectionStartTime.getTime()
          : 0,
      };
    }
  }

  /**
   * Executes a transaction
   */
  public async transaction<T>(
    callback: (tx: any) => Promise<T>
  ): Promise<T> {
    if (!isNotNull(this.prismaClient)) {
      throw new Error('Database client is not initialized');
    }

    return this.prismaClient.$transaction(callback, {
      maxWait: this.config.connectionTimeout,
      timeout: this.config.queryTimeout,
    });
  }

  /**
   * Starts periodic health checks
   */
  private startHealthCheck(): void {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      const health = await this.checkHealth();
      if (!health.isConnected) {
        const logger = authServiceLogger();
        logger.warn('Database health check failed - connection lost', {
          lastHealthCheck: health.lastHealthCheck,
        });
      }
    }, 30000);
  }

  /**
   * Stops health check monitoring
   */
  private stopHealthCheck(): void {
    if (isNotNull(this.healthCheckInterval)) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Sets up graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      const logger = authServiceLogger();
      logger.info(`Received ${signal}, shutting down database connection gracefully`);
      
      try {
        await this.disconnect();
        process.exit(0);
      } catch (error) {
        logger.error('Error during database shutdown', error as Error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Checks if database is connected
   */
  public getIsConnected(): boolean {
    return this.isConnected && isNotNull(this.prismaClient);
  }

  /**
   * Resets the singleton instance (for testing)
   */
  public static resetInstance(): void {
    if (isNotNull(DatabaseConnection.instance)) {
      DatabaseConnection.instance.disconnect().catch(() => {
        // Ignore errors during reset
      });
    }
    DatabaseConnection.instance = null;
  }
}

