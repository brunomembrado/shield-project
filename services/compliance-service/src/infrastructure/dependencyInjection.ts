/**
 * Dependency Injection Container
 * 
 * Wires up all dependencies following Clean Architecture principles
 * 
 * @module compliance-service/infrastructure
 */

import { DatabaseConnection } from '../../../shared/database/DatabaseConnection';

// Domain repositories (interfaces)
import { IComplianceRepository } from '../domain/repositories/IComplianceRepository';
import { IComplianceScreeningService } from '../domain/services/IComplianceScreeningService';

// Data layer implementations
import { ComplianceRepository } from '../data/repositories/ComplianceRepository';
import { ComplianceScreeningService } from '../data/services/ComplianceScreeningService';

// Domain use cases
import { PerformKYCUseCase } from '../domain/useCases/PerformKYCUseCase';
import { PerformKYBUseCase } from '../domain/useCases/PerformKYBUseCase';
import { ScreenWalletUseCase } from '../domain/useCases/ScreenWalletUseCase';
import { ScreenTransactionUseCase } from '../domain/useCases/ScreenTransactionUseCase';
import { GetComplianceStatusUseCase } from '../domain/useCases/GetComplianceStatusUseCase';
import { ReviewComplianceCheckUseCase } from '../domain/useCases/ReviewComplianceCheckUseCase';

// Presentation layer
import { ComplianceController } from '../presentation/controllers/ComplianceController';

/**
 * Dependency Injection Container
 */
export class DependencyContainer {
  private static instance: DependencyContainer | null = null;

  // Repositories
  public readonly complianceRepository: IComplianceRepository;

  // Services
  public readonly screeningService: IComplianceScreeningService;

  // Use Cases
  public readonly performKYCUseCase: PerformKYCUseCase;
  public readonly performKYBUseCase: PerformKYBUseCase;
  public readonly screenWalletUseCase: ScreenWalletUseCase;
  public readonly screenTransactionUseCase: ScreenTransactionUseCase;
  public readonly getComplianceStatusUseCase: GetComplianceStatusUseCase;
  public readonly reviewComplianceCheckUseCase: ReviewComplianceCheckUseCase;

  // Controllers
  public readonly complianceController: ComplianceController;

  private constructor() {
    // Initialize database connection
    DatabaseConnection.getInstance().connect().catch((error) => {
      throw new Error(`Failed to initialize database: ${error.message}`);
    });

    // Initialize repositories
    this.complianceRepository = new ComplianceRepository();

    // Initialize services
    this.screeningService = new ComplianceScreeningService();

    // Initialize use cases
    this.performKYCUseCase = new PerformKYCUseCase(
      this.complianceRepository,
      this.screeningService
    );

    this.performKYBUseCase = new PerformKYBUseCase(
      this.complianceRepository
    );

    this.screenWalletUseCase = new ScreenWalletUseCase(
      this.screeningService
    );

    this.screenTransactionUseCase = new ScreenTransactionUseCase(
      this.screeningService
    );

    this.getComplianceStatusUseCase = new GetComplianceStatusUseCase(
      this.complianceRepository
    );

    this.reviewComplianceCheckUseCase = new ReviewComplianceCheckUseCase(
      this.complianceRepository
    );

    // Initialize controllers
    this.complianceController = new ComplianceController(
      this.performKYCUseCase,
      this.performKYBUseCase,
      this.screenWalletUseCase,
      this.screenTransactionUseCase,
      this.getComplianceStatusUseCase,
      this.reviewComplianceCheckUseCase
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

