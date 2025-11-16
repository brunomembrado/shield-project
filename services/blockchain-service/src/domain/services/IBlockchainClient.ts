/**
 * Blockchain Client Interface
 * 
 * Defines the contract for blockchain interactions
 * 
 * @module blockchain-service/domain/services
 */

import { ChainType } from '@shield/shared/types';

/**
 * Token balance result
 */
export interface TokenBalance {
  chain: ChainType;
  address: string;
  balance: string;
  symbol: string;
}

/**
 * Blockchain transaction details
 */
export interface BlockchainTransactionDetails {
  hash: string;
  from: string;
  transaction: {
    from: string;
    to: string;
    value: string;
    blockNumber: number;
    timestamp: number;
    confirmations: number;
    status: 'success' | 'failed' | 'pending';
  };
}

/**
 * Transaction validation result
 */
export interface TransactionValidationResult {
  valid: boolean;
  reason?: string;
  amount: string;
  amountUSDT: string;
  from: string;
  to: string;
}

/**
 * USDT transfer information
 */
export interface USDTTransfer {
  from: string;
  to: string;
  amount: string;
  txHash: string;
  timestamp: number;
}

/**
 * Network status information
 */
export interface NetworkStatus {
  chain: ChainType;
  isHealthy: boolean;
  latestBlock: number;
  blockTime: number;
  gasPrice?: string;
  energyPrice?: string;
}

/**
 * Token balance with metadata
 */
export interface TokenBalanceData {
  balance: string;
  formatted: string;
  symbol: string;
  decimals: number;
}

/**
 * Gas estimation data
 */
export interface GasEstimateData {
  gasLimit: string;
  gasPrice: string;
  totalCost: string;
  totalCostUSD?: string;
}

/**
 * Blockchain client interface
 */
export interface IBlockchainClient {
  /**
   * Gets USDT balance for an address
   */
  getUSDTBalance(address: string): Promise<string>;

  /**
   * Gets transaction details by hash
   */
  getTransaction(txHash: string): Promise<BlockchainTransactionDetails['transaction']>;

  /**
   * Validates a USDT transaction
   */
  validateUSDTTransaction(txHash: string, expectedToAddress: string): Promise<TransactionValidationResult>;

  /**
   * Monitors blockchain for USDT transfers
   */
  monitorUSDTTransfers(
    toAddress: string,
    fromBlock: number,
    toBlock: number
  ): Promise<USDTTransfer[]>;

  /**
   * Gets network status
   */
  getNetworkStatus(): Promise<NetworkStatus>;

  /**
   * Gets transaction count for address (nonce for Polygon, tx count for Tron)
   */
  getTransactionCount(chain: ChainType, address: string): Promise<number>;

  /**
   * Gets native token balance (MATIC for Polygon, TRX for Tron)
   */
  getNativeBalance(chain: ChainType, address: string): Promise<string>;

  /**
   * Gets token balance with metadata
   */
  getTokenBalance(
    chain: ChainType,
    address: string,
    tokenAddress: string
  ): Promise<TokenBalanceData>;

  /**
   * Estimates gas/energy cost for transaction
   */
  estimateGas(chain: ChainType, transactionType: string): Promise<GasEstimateData>;
}

