/**
 * Dependency Injection Container
 * 
 * Wires up all dependencies following Clean Architecture principles
 * 
 * @module auth-service/infrastructure
 */

import { DatabaseConnection } from '@shield/shared/database/DatabaseConnection';

// Domain repositories (interfaces)
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { IRefreshTokenRepository } from '../domain/repositories/IRefreshTokenRepository';
import { IPasswordService } from '../domain/services/IPasswordService';
import { ITokenService } from '../domain/services/ITokenService';

// Data layer implementations
import { UserRepository } from '../data/repositories/UserRepository';
import { RefreshTokenRepository } from '../data/repositories/RefreshTokenRepository';
import { PasswordService } from '../data/services/PasswordService';
import { TokenService } from '../data/services/TokenService';

// Domain use cases
import { RegisterUserUseCase } from '../domain/useCases/RegisterUserUseCase';
import { LoginUserUseCase } from '../domain/useCases/LoginUserUseCase';
import { RefreshTokenUseCase } from '../domain/useCases/RefreshTokenUseCase';
import { LogoutUserUseCase } from '../domain/useCases/LogoutUserUseCase';

// Presentation layer
import { AuthController } from '../presentation/controllers/AuthController';

/**
 * Dependency Injection Container
 */
export class DependencyContainer {
  private static instance: DependencyContainer | null = null;

  // Repositories
  public readonly userRepository: IUserRepository;
  public readonly refreshTokenRepository: IRefreshTokenRepository;

  // Services
  public readonly passwordService: IPasswordService;
  public readonly tokenService: ITokenService;

  // Use Cases
  public readonly registerUserUseCase: RegisterUserUseCase;
  public readonly loginUserUseCase: LoginUserUseCase;
  public readonly refreshTokenUseCase: RefreshTokenUseCase;
  public readonly logoutUserUseCase: LogoutUserUseCase;

  // Controllers
  public readonly authController: AuthController;

  private constructor() {
    // Initialize database connection
    DatabaseConnection.getInstance().connect().catch((error) => {
      throw new Error(`Failed to initialize database: ${error.message}`);
    });

    // Initialize repositories
    this.userRepository = new UserRepository();
    this.refreshTokenRepository = new RefreshTokenRepository();

    // Initialize services
    this.passwordService = new PasswordService();
    this.tokenService = new TokenService();

    // Initialize use cases
    this.registerUserUseCase = new RegisterUserUseCase(
      this.userRepository,
      this.refreshTokenRepository,
      this.passwordService,
      this.tokenService
    );

    this.loginUserUseCase = new LoginUserUseCase(
      this.userRepository,
      this.refreshTokenRepository,
      this.passwordService,
      this.tokenService
    );

    this.refreshTokenUseCase = new RefreshTokenUseCase(
      this.refreshTokenRepository,
      this.tokenService
    );

    this.logoutUserUseCase = new LogoutUserUseCase(
      this.refreshTokenRepository,
      this.tokenService
    );

    // Initialize controllers
    this.authController = new AuthController(
      this.registerUserUseCase,
      this.loginUserUseCase,
      this.refreshTokenUseCase,
      this.logoutUserUseCase
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

