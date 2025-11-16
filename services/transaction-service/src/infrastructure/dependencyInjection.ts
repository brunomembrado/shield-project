/**
 * Dependency Injection Container
 * 
 * Wires up all dependencies following Clean Architecture principles
 * 
 * @module transaction-service/infrastructure
 */

import { DatabaseConnection } from '../../../shared/database/DatabaseConnection';

// Domain repositories (interfaces)
import { ITransactionRepository } from '../domain/repositories/ITransactionRepository';
import { IExchangeRateService } from '../domain/services/IExchangeRateService';
import { IWalletService } from '../domain/services/IWalletService';

// Data layer implementations
import { TransactionRepository } from '../data/repositories/TransactionRepository';
import { ExchangeRateService } from '../data/services/ExchangeRateService';
import { WalletService } from '../data/services/WalletService';

// Domain use cases
import { CreateTransactionUseCase } from '../domain/useCases/CreateTransactionUseCase';
import { GetUserTransactionsUseCase } from '../domain/useCases/GetUserTransactionsUseCase';
import { GetTransactionByIdUseCase } from '../domain/useCases/GetTransactionByIdUseCase';
import { UpdateTransactionStatusUseCase } from '../domain/useCases/UpdateTransactionStatusUseCase';

// Presentation layer
import { TransactionController } from '../presentation/controllers/TransactionController';

/**
 * Dependency Injection Container
 */
export class DependencyContainer {
  private static instance: DependencyContainer | null = null;

  // Repositories
  public readonly transactionRepository: ITransactionRepository;

  // Services
  public readonly exchangeRateService: IExchangeRateService;

  // Use Cases
  public readonly createTransactionUseCase: CreateTransactionUseCase;
  public readonly getUserTransactionsUseCase: GetUserTransactionsUseCase;
  public readonly getTransactionByIdUseCase: GetTransactionByIdUseCase;
  public readonly updateTransactionStatusUseCase: UpdateTransactionStatusUseCase;

  // Controllers
  public readonly transactionController: TransactionController;

  private constructor() {
    // Initialize database connection
    DatabaseConnection.getInstance().connect().catch((error) => {
      throw new Error(`Failed to initialize database: ${error.message}`);
    });

    // Initialize repositories
    this.transactionRepository = new TransactionRepository();

    // Initialize services
    this.exchangeRateService = new ExchangeRateService();

    // Initialize use cases
    this.createTransactionUseCase = new CreateTransactionUseCase(
      this.transactionRepository,
      this.exchangeRateService
    );

    this.getUserTransactionsUseCase = new GetUserTransactionsUseCase(
      this.transactionRepository
    );

    this.getTransactionByIdUseCase = new GetTransactionByIdUseCase(
      this.transactionRepository
    );

    this.updateTransactionStatusUseCase = new UpdateTransactionStatusUseCase(
      this.transactionRepository
    );

    // Initialize controllers
    this.transactionController = new TransactionController(
      this.createTransactionUseCase,
      this.getUserTransactionsUseCase,
      this.getTransactionByIdUseCase,
      this.updateTransactionStatusUseCase
    );
  }

  /**
   * Gets the singleton instance
   */
  public static getInstance(): DependencyContainer {
    if (!DependencyContainer.instance) {
      DependencyContainer.instance = new DependencyContainer();
    }
    return DependencyContainer.instance;
  }

  /**
   * Resets the instance (for testing)
   */
  public static reset(): void {
    DependencyContainer.instance = null;
  }
}

