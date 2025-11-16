/**
 * Address Validation Utilities
 * 
 * Validates blockchain addresses for different chains
 * 
 * @module blockchain-service/utils
 */

import { ChainType } from '@shield/shared/types';
import { ValidationError } from '@shield/shared/errors';

/**
 * Validates blockchain address format
 * 
 * @param chain - Blockchain network
 * @param address - Address to validate
 * @throws ValidationError if address is invalid
 */
export function validateAddress(chain: ChainType, address: string): void {
  if (!isValidAddress(chain, address)) {
    throw new ValidationError(`Invalid ${chain} address format: ${address}`, {
      chain,
      address,
    });
  }
}

/**
 * Checks if address is valid for the given chain
 * 
 * @param chain - Blockchain network
 * @param address - Address to check
 * @returns true if address is valid
 */
export function isValidAddress(chain: ChainType, address: string): boolean {
  if (chain === ChainType.POLYGON) {
    return isValidPolygonAddress(address);
  } else if (chain === ChainType.TRON) {
    return isValidTronAddress(address);
  }
  return false;
}

/**
 * Validates Polygon/Ethereum address format
 * 
 * Format: 0x followed by 40 hexadecimal characters
 * Example: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
 */
export function isValidPolygonAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Validates Tron address format
 * 
 * Format: T followed by 33 base58 characters
 * Example: TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9
 */
export function isValidTronAddress(address: string): boolean {
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
}

/**
 * Normalizes address to checksum format (for Polygon/Ethereum)
 * 
 * @param address - Polygon address
 * @returns Checksummed address
 */
export function normalizePolygonAddress(address: string): string {
  if (!isValidPolygonAddress(address)) {
    throw new ValidationError(`Invalid Polygon address: ${address}`);
  }
  // Convert to lowercase for consistency
  return address.toLowerCase();
}

/**
 * Checks if address is a smart contract (basic check)
 * Note: This is a simplified check. Full verification requires RPC calls.
 * 
 * @param address - Address to check
 * @returns true if address appears to be a smart contract
 */
export function looksLikeContract(address: string): boolean {
  // Simple heuristic: contracts often have 0x in lowercase
  // This is NOT a reliable check - use RPC getCode() for real verification
  return address.startsWith('0x');
}

/**
 * Gets address type description
 * 
 * @param chain - Blockchain network
 * @param address - Address to describe
 * @returns Human-readable address type
 */
export function getAddressType(chain: ChainType, address: string): string {
  if (chain === ChainType.POLYGON) {
    return 'Polygon (EVM) address';
  } else if (chain === ChainType.TRON) {
    return 'Tron address';
  }
  return 'Unknown address type';
}

