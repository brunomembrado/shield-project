/**
 * Transaction Parsing Utilities
 * 
 * Parses and formats blockchain transaction data
 * 
 * @module blockchain-service/utils
 */

import { ChainType } from '@shield/shared/types';
import { ethers } from 'ethers';

/**
 * Formats wei amount to ether (18 decimals)
 * 
 * @param weiAmount - Amount in wei (smallest unit)
 * @returns Formatted amount in ether
 */
export function formatEther(weiAmount: string | bigint): string {
  try {
    return ethers.formatEther(weiAmount);
  } catch (error) {
    return '0';
  }
}

/**
 * Formats token amount based on decimals
 * 
 * @param amount - Amount in smallest unit
 * @param decimals - Token decimals
 * @returns Formatted amount
 */
export function formatTokenAmount(amount: string | bigint, decimals: number): string {
  try {
    return ethers.formatUnits(amount, decimals);
  } catch (error) {
    return '0';
  }
}

/**
 * Parses ether amount to wei
 * 
 * @param etherAmount - Amount in ether
 * @returns Amount in wei
 */
export function parseEther(etherAmount: string): bigint {
  try {
    return ethers.parseEther(etherAmount);
  } catch (error) {
    return BigInt(0);
  }
}

/**
 * Parses token amount based on decimals
 * 
 * @param amount - Amount in human-readable format
 * @param decimals - Token decimals
 * @returns Amount in smallest unit
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  try {
    return ethers.parseUnits(amount, decimals);
  } catch (error) {
    return BigInt(0);
  }
}

/**
 * Formats transaction hash for display
 * 
 * @param hash - Transaction hash
 * @param chain - Blockchain network
 * @returns Formatted hash
 */
export function formatTxHash(hash: string, chain?: ChainType): string {
  if (!hash) return '';
  
  // For Polygon, ensure 0x prefix
  if (chain === ChainType.POLYGON && !hash.startsWith('0x')) {
    return `0x${hash}`;
  }
  
  return hash;
}

/**
 * Truncates address for display
 * 
 * @param address - Full address
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Truncated address (e.g., "0x742d...0bEb")
 */
export function truncateAddress(
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Converts timestamp to Date object
 * 
 * @param timestamp - Unix timestamp (seconds or milliseconds)
 * @returns Date object
 */
export function timestampToDate(timestamp: number): Date {
  // If timestamp is in milliseconds (13 digits), use as-is
  // If in seconds (10 digits), convert to milliseconds
  const ms = timestamp > 10000000000 ? timestamp : timestamp * 1000;
  return new Date(ms);
}

/**
 * Formats gas price from gwei to wei
 * 
 * @param gweiPrice - Gas price in gwei
 * @returns Gas price in wei
 */
export function gweiToWei(gweiPrice: string | number): bigint {
  try {
    return ethers.parseUnits(gweiPrice.toString(), 'gwei');
  } catch (error) {
    return BigInt(0);
  }
}

/**
 * Formats gas price from wei to gwei
 * 
 * @param weiPrice - Gas price in wei
 * @returns Gas price in gwei
 */
export function weiToGwei(weiPrice: string | bigint): string {
  try {
    return ethers.formatUnits(weiPrice, 'gwei');
  } catch (error) {
    return '0';
  }
}

/**
 * Calculates total gas cost
 * 
 * @param gasUsed - Gas units used
 * @param gasPrice - Gas price in wei
 * @returns Total cost in wei
 */
export function calculateGasCost(gasUsed: string | bigint, gasPrice: string | bigint): bigint {
  try {
    return BigInt(gasUsed) * BigInt(gasPrice);
  } catch (error) {
    return BigInt(0);
  }
}

/**
 * Formats transaction status
 * 
 * @param status - Transaction status (0 = failed, 1 = success)
 * @returns Human-readable status
 */
export function formatTxStatus(status: number | string): 'success' | 'failed' {
  return status === 1 || status === '1' || status === '0x1' ? 'success' : 'failed';
}

/**
 * Checks if transaction hash is valid
 * 
 * @param hash - Transaction hash
 * @param chain - Blockchain network
 * @returns true if hash is valid
 */
export function isValidTxHash(hash: string, chain: ChainType): boolean {
  if (chain === ChainType.POLYGON) {
    // Polygon uses 0x + 64 hex chars
    return /^0x[0-9a-fA-F]{64}$/.test(hash);
  } else if (chain === ChainType.TRON) {
    // Tron uses 64 hex chars (no 0x prefix)
    return /^[0-9a-fA-F]{64}$/.test(hash);
  }
  return false;
}

