/**
 * Gas Estimation Utilities
 * 
 * Utilities for estimating transaction costs
 * 
 * @module blockchain-service/utils
 */

import { ChainType } from '@shield/shared/types';
import { ethers } from 'ethers';

/**
 * Standard gas limits for common transaction types
 */
export const GAS_LIMITS = {
  POLYGON: {
    TRANSFER_NATIVE: 21000, // Native MATIC transfer
    TRANSFER_ERC20: 65000, // ERC20 token transfer
    APPROVE_ERC20: 50000, // ERC20 approve
    SWAP: 200000, // DEX swap (approximate)
    CONTRACT_DEPLOY: 1000000, // Contract deployment (rough estimate)
  },
  TRON: {
    TRANSFER_NATIVE: 100000, // Native TRX transfer (energy)
    TRANSFER_TRC20: 140000, // TRC20 token transfer (energy)
    APPROVE_TRC20: 50000, // TRC20 approve
  },
};

/**
 * Transaction types
 */
export enum TransactionType {
  TRANSFER_NATIVE = 'transfer_native',
  TRANSFER_TOKEN = 'transfer_token',
  APPROVE_TOKEN = 'approve_token',
  SWAP = 'swap',
  CONTRACT_CALL = 'contract_call',
}

/**
 * Gets standard gas limit for transaction type
 * 
 * @param chain - Blockchain network
 * @param txType - Transaction type
 * @returns Estimated gas limit
 */
export function getStandardGasLimit(chain: ChainType, txType: string): number {
  if (chain === ChainType.POLYGON) {
    switch (txType) {
      case TransactionType.TRANSFER_NATIVE:
        return GAS_LIMITS.POLYGON.TRANSFER_NATIVE;
      case TransactionType.TRANSFER_TOKEN:
        return GAS_LIMITS.POLYGON.TRANSFER_ERC20;
      case TransactionType.APPROVE_TOKEN:
        return GAS_LIMITS.POLYGON.APPROVE_ERC20;
      case TransactionType.SWAP:
        return GAS_LIMITS.POLYGON.SWAP;
      default:
        return GAS_LIMITS.POLYGON.TRANSFER_ERC20;
    }
  } else if (chain === ChainType.TRON) {
    switch (txType) {
      case TransactionType.TRANSFER_NATIVE:
        return GAS_LIMITS.TRON.TRANSFER_NATIVE;
      case TransactionType.TRANSFER_TOKEN:
        return GAS_LIMITS.TRON.TRANSFER_TRC20;
      case TransactionType.APPROVE_TOKEN:
        return GAS_LIMITS.TRON.APPROVE_TRC20;
      default:
        return GAS_LIMITS.TRON.TRANSFER_TRC20;
    }
  }
  
  return 21000; // Default fallback
}

/**
 * Calculates total gas cost in native token
 * 
 * @param gasLimit - Gas limit
 * @param gasPrice - Gas price in wei/gwei
 * @returns Total cost in native token
 */
export function calculateTotalGasCost(gasLimit: number, gasPrice: bigint): string {
  try {
    const totalWei = BigInt(gasLimit) * gasPrice;
    return ethers.formatEther(totalWei);
  } catch (error) {
    return '0';
  }
}

/**
 * Estimates USD cost (requires price oracle in production)
 * This is a placeholder that returns null - integrate with price oracle
 * 
 * @param nativeAmount - Amount in native token (MATIC/TRX)
 * @param chain - Blockchain network
 * @returns Estimated USD cost (null if price not available)
 */
export function estimateUSDCost(nativeAmount: string, chain: ChainType): string | null {
  // TODO: Integrate with price oracle (CoinGecko, Chainlink, etc.)
  // For now, return null to indicate price not available
  return null;
}

/**
 * Applies gas buffer for safety
 * 
 * @param gasLimit - Base gas limit
 * @param bufferPercent - Buffer percentage (default: 20%)
 * @returns Gas limit with buffer
 */
export function applyGasBuffer(gasLimit: number, bufferPercent: number = 20): number {
  return Math.ceil(gasLimit * (1 + bufferPercent / 100));
}

/**
 * Formats gas price for display
 * 
 * @param gasPriceWei - Gas price in wei
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted gas price in gwei
 */
export function formatGasPrice(gasPriceWei: bigint | string, decimals: number = 2): string {
  try {
    const gwei = ethers.formatUnits(gasPriceWei, 'gwei');
    return parseFloat(gwei).toFixed(decimals);
  } catch (error) {
    return '0.00';
  }
}

/**
 * Gets recommended gas price multipliers for different speeds
 * 
 * @param baseGasPrice - Base gas price in wei
 * @returns Gas prices for slow, normal, and fast transactions
 */
export function getGasPriceOptions(baseGasPrice: bigint): {
  slow: bigint;
  normal: bigint;
  fast: bigint;
} {
  return {
    slow: (baseGasPrice * BigInt(90)) / BigInt(100), // 90% of base
    normal: baseGasPrice, // 100% of base
    fast: (baseGasPrice * BigInt(120)) / BigInt(100), // 120% of base
  };
}

