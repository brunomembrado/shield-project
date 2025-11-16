/**
 * Dependency Injection Container
 * 
 * Wires up all dependencies following Clean Architecture principles
 * ALL BLOCKCHAIN CALLS ARE DIRECT - NO CACHING
 * 
 * @module blockchain-service/infrastructure
 */

import { ChainType } from '@shield/shared/types';
import { DatabaseConnection } from '@shield/shared/database/DatabaseConnection';
import { BlockchainClientFactory } from '../data/clients/BlockchainClientFactory';
import { IBlockchainClient } from '../domain/services/IBlockchainClient';

// Domain use cases (all direct blockchain calls)
import { GetUSDTBalanceUseCase } from '../domain/useCases/GetUSDTBalanceUseCase';
import { GetTransactionUseCase } from '../domain/useCases/GetTransactionUseCase';
import { ValidateTransactionUseCase } from '../domain/useCases/ValidateTransactionUseCase';
import { MonitorTransfersUseCase } from '../domain/useCases/MonitorTransfersUseCase';
import { GetNetworkStatusUseCase } from '../domain/useCases/GetNetworkStatusUseCase';
import { VerifyWalletUseCase } from '../domain/useCases/VerifyWalletUseCase';
import { GetTokenBalanceUseCase } from '../domain/useCases/GetTokenBalanceUseCase';
import { EstimateGasUseCase } from '../domain/useCases/EstimateGasUseCase';

// Presentation layer
import { BlockchainController } from '../presentation/controllers/BlockchainController';

/**
 * Dependency Injection Container
 * ALL USE CASES CALL BLOCKCHAIN DIRECTLY - NO CACHING
 */
export class DependencyContainer {
  private static instance: DependencyContainer | null = null;

  // Blockchain clients (created per chain)
  private readonly polygonClient: IBlockchainClient;
  private readonly tronClient: IBlockchainClient;

  // Use Cases (per chain) - all direct blockchain calls
  public readonly polygonGetBalanceUseCase: GetUSDTBalanceUseCase;
  public readonly tronGetBalanceUseCase: GetUSDTBalanceUseCase;
  public readonly polygonGetTransactionUseCase: GetTransactionUseCase;
  public readonly tronGetTransactionUseCase: GetTransactionUseCase;
  public readonly polygonValidateTransactionUseCase: ValidateTransactionUseCase;
  public readonly tronValidateTransactionUseCase: ValidateTransactionUseCase;
  public readonly polygonMonitorTransfersUseCase: MonitorTransfersUseCase;
  public readonly tronMonitorTransfersUseCase: MonitorTransfersUseCase;
  public readonly polygonGetNetworkStatusUseCase: GetNetworkStatusUseCase;
  public readonly tronGetNetworkStatusUseCase: GetNetworkStatusUseCase;
  
  // Direct blockchain call use cases
  public readonly polygonVerifyWalletUseCase: VerifyWalletUseCase;
  public readonly tronVerifyWalletUseCase: VerifyWalletUseCase;
  public readonly polygonGetTokenBalanceUseCase: GetTokenBalanceUseCase;
  public readonly tronGetTokenBalanceUseCase: GetTokenBalanceUseCase;
  public readonly polygonEstimateGasUseCase: EstimateGasUseCase;
  public readonly tronEstimateGasUseCase: EstimateGasUseCase;

  // Controllers
  public readonly blockchainController: BlockchainController;

  private constructor() {
    // Initialize database connection (for transaction history only)
    DatabaseConnection.getInstance().connect().catch((error) => {
      throw new Error(`Failed to initialize database: ${error.message}`);
    });

    // Initialize blockchain clients
    this.polygonClient = BlockchainClientFactory.create(ChainType.POLYGON);
    this.tronClient = BlockchainClientFactory.create(ChainType.TRON);

    // ✅ ALL USE CASES - DIRECT BLOCKCHAIN CALLS (NO CACHING)

    // Initialize use cases for Polygon
    this.polygonGetBalanceUseCase = new GetUSDTBalanceUseCase(this.polygonClient);
    this.polygonGetTransactionUseCase = new GetTransactionUseCase(this.polygonClient);
    this.polygonValidateTransactionUseCase = new ValidateTransactionUseCase(this.polygonClient);
    this.polygonMonitorTransfersUseCase = new MonitorTransfersUseCase(this.polygonClient);
    this.polygonGetNetworkStatusUseCase = new GetNetworkStatusUseCase(this.polygonClient);
    this.polygonVerifyWalletUseCase = new VerifyWalletUseCase(this.polygonClient);
    this.polygonGetTokenBalanceUseCase = new GetTokenBalanceUseCase(this.polygonClient);
    this.polygonEstimateGasUseCase = new EstimateGasUseCase(this.polygonClient);

    // Initialize use cases for Tron
    this.tronGetBalanceUseCase = new GetUSDTBalanceUseCase(this.tronClient);
    this.tronGetTransactionUseCase = new GetTransactionUseCase(this.tronClient);
    this.tronValidateTransactionUseCase = new ValidateTransactionUseCase(this.tronClient);
    this.tronMonitorTransfersUseCase = new MonitorTransfersUseCase(this.tronClient);
    this.tronGetNetworkStatusUseCase = new GetNetworkStatusUseCase(this.tronClient);
    this.tronVerifyWalletUseCase = new VerifyWalletUseCase(this.tronClient);
    this.tronGetTokenBalanceUseCase = new GetTokenBalanceUseCase(this.tronClient);
    this.tronEstimateGasUseCase = new EstimateGasUseCase(this.tronClient);

    // Initialize controllers
    this.blockchainController = new BlockchainController(
      this.polygonGetBalanceUseCase,
      this.tronGetBalanceUseCase,
      this.polygonGetTransactionUseCase,
      this.tronGetTransactionUseCase,
      this.polygonValidateTransactionUseCase,
      this.tronValidateTransactionUseCase,
      this.polygonMonitorTransfersUseCase,
      this.tronMonitorTransfersUseCase,
      this.polygonGetNetworkStatusUseCase,
      this.tronGetNetworkStatusUseCase
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

