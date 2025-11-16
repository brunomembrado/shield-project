/**
 * Dependency Injection Container
 * 
 * Wires up all dependencies following Clean Architecture principles
 * 
 * @module blockchain-service/infrastructure
 */

import { ChainType } from '../../../shared/types';
import { BlockchainClientFactory } from '../data/clients/BlockchainClientFactory';
import { IBlockchainClient } from '../domain/services/IBlockchainClient';

// Domain use cases
import { GetUSDTBalanceUseCase } from '../domain/useCases/GetUSDTBalanceUseCase';
import { GetTransactionUseCase } from '../domain/useCases/GetTransactionUseCase';
import { ValidateTransactionUseCase } from '../domain/useCases/ValidateTransactionUseCase';
import { MonitorTransfersUseCase } from '../domain/useCases/MonitorTransfersUseCase';
import { GetNetworkStatusUseCase } from '../domain/useCases/GetNetworkStatusUseCase';

// Presentation layer
import { BlockchainController } from '../presentation/controllers/BlockchainController';

/**
 * Dependency Injection Container
 */
export class DependencyContainer {
  private static instance: DependencyContainer | null = null;

  // Blockchain clients (created per chain)
  private readonly polygonClient: IBlockchainClient;
  private readonly tronClient: IBlockchainClient;

  // Use Cases (per chain)
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

  // Controllers
  public readonly blockchainController: BlockchainController;

  private constructor() {
    // Initialize blockchain clients
    this.polygonClient = BlockchainClientFactory.create(ChainType.POLYGON);
    this.tronClient = BlockchainClientFactory.create(ChainType.TRON);

    // Initialize use cases for Polygon
    this.polygonGetBalanceUseCase = new GetUSDTBalanceUseCase(this.polygonClient);
    this.polygonGetTransactionUseCase = new GetTransactionUseCase(this.polygonClient);
    this.polygonValidateTransactionUseCase = new ValidateTransactionUseCase(this.polygonClient);
    this.polygonMonitorTransfersUseCase = new MonitorTransfersUseCase(this.polygonClient);
    this.polygonGetNetworkStatusUseCase = new GetNetworkStatusUseCase(this.polygonClient);

    // Initialize use cases for Tron
    this.tronGetBalanceUseCase = new GetUSDTBalanceUseCase(this.tronClient);
    this.tronGetTransactionUseCase = new GetTransactionUseCase(this.tronClient);
    this.tronValidateTransactionUseCase = new ValidateTransactionUseCase(this.tronClient);
    this.tronMonitorTransfersUseCase = new MonitorTransfersUseCase(this.tronClient);
    this.tronGetNetworkStatusUseCase = new GetNetworkStatusUseCase(this.tronClient);

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

