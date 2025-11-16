/**
 * Dependency Injection Container
 * 
 * Wires up all dependencies following Clean Architecture principles
 * 
 * @module wallet-service/infrastructure
 */

import { DatabaseConnection } from '@shield/shared/database/DatabaseConnection';

// Domain repositories (interfaces)
import { IWalletRepository } from '../domain/repositories/IWalletRepository';

// Data layer implementations
import { WalletRepository } from '../data/repositories/WalletRepository';

// Domain use cases
import { CreateWalletUseCase } from '../domain/useCases/CreateWalletUseCase';
import { GetUserWalletsUseCase } from '../domain/useCases/GetUserWalletsUseCase';
import { GetWalletByIdUseCase } from '../domain/useCases/GetWalletByIdUseCase';
import { UpdateWalletUseCase } from '../domain/useCases/UpdateWalletUseCase';
import { DeleteWalletUseCase } from '../domain/useCases/DeleteWalletUseCase';
import { GenerateWalletUseCase } from '../domain/useCases/GenerateWalletUseCase';
import { RevealPrivateKeyUseCase } from '../domain/useCases/RevealPrivateKeyUseCase';

// Presentation layer
import { WalletController } from '../presentation/controllers/WalletController';

/**
 * Dependency Injection Container
 */
export class DependencyContainer {
  private static instance: DependencyContainer | null = null;

  // Repositories
  public readonly walletRepository: IWalletRepository;

  // Use Cases
  public readonly createWalletUseCase: CreateWalletUseCase;
  public readonly getUserWalletsUseCase: GetUserWalletsUseCase;
  public readonly getWalletByIdUseCase: GetWalletByIdUseCase;
  public readonly updateWalletUseCase: UpdateWalletUseCase;
  public readonly deleteWalletUseCase: DeleteWalletUseCase;
  public readonly generateWalletUseCase: GenerateWalletUseCase;
  public readonly revealPrivateKeyUseCase: RevealPrivateKeyUseCase;

  // Controllers
  public readonly walletController: WalletController;

  private constructor() {
    // Initialize database connection
    DatabaseConnection.getInstance().connect().catch((error) => {
      throw new Error(`Failed to initialize database: ${error.message}`);
    });

    // Initialize repositories
    this.walletRepository = new WalletRepository();

    // Initialize use cases
    this.createWalletUseCase = new CreateWalletUseCase(this.walletRepository);
    this.getUserWalletsUseCase = new GetUserWalletsUseCase(this.walletRepository);
    this.getWalletByIdUseCase = new GetWalletByIdUseCase(this.walletRepository);
    this.updateWalletUseCase = new UpdateWalletUseCase(this.walletRepository);
    this.deleteWalletUseCase = new DeleteWalletUseCase(this.walletRepository);
    this.generateWalletUseCase = new GenerateWalletUseCase(this.walletRepository);
    this.revealPrivateKeyUseCase = new RevealPrivateKeyUseCase(this.walletRepository);

    // Initialize controllers
    this.walletController = new WalletController(
      this.createWalletUseCase,
      this.getUserWalletsUseCase,
      this.getWalletByIdUseCase,
      this.updateWalletUseCase,
      this.deleteWalletUseCase,
      this.generateWalletUseCase,
      this.revealPrivateKeyUseCase
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

