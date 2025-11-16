/**
 * Blockchain Wallet Generation Utilities
 * 
 * Generates new wallets on supported blockchains (Polygon/Ethereum, Tron)
 * Returns address + private key for secure storage
 * 
 * @module wallet-service/utils/walletGenerator
 */

import { ethers } from 'ethers';
import { ValidationError } from '@shield/shared/errors';

/**
 * Generated wallet result
 */
export interface GeneratedWallet {
  address: string;
  privateKey: string;
  publicKey?: string;
}

/**
 * Supported blockchain networks
 */
export type ChainType = 'POLYGON' | 'TRON';

/**
 * Generates a new Ethereum/Polygon wallet
 * 
 * @returns Generated wallet with address and private key
 * 
 * @example
 * ```typescript
 * const wallet = generatePolygonWallet();
 * console.log(wallet.address); // 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
 * console.log(wallet.privateKey); // 0x123...
 * ```
 */
export function generatePolygonWallet(): GeneratedWallet {
  try {
    // Create a new random wallet using ethers.js
    const wallet = ethers.Wallet.createRandom();

    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      publicKey: wallet.publicKey,
    };
  } catch (error) {
    throw new ValidationError('Failed to generate Polygon wallet', {
      originalError: error instanceof Error ? error.message : String(error),
      chain: 'POLYGON',
    });
  }
}

/**
 * Generates a new Tron wallet
 * 
 * @returns Generated wallet with address and private key
 * 
 * @example
 * ```typescript
 * const wallet = await generateTronWallet();
 * console.log(wallet.address); // TJz...
 * console.log(wallet.privateKey); // 123... (hex)
 * ```
 */
export async function generateTronWallet(): Promise<GeneratedWallet> {
  try {
    // TronWeb v6.x uses named exports, not default export
    // See: https://www.npmjs.com/package/tronweb
    const { TronWeb } = await import('tronweb');

    // Initialize TronWeb (no provider needed for offline wallet generation)
    const tronWeb = new TronWeb({
      fullHost: 'https://api.trongrid.io', // Not actually used for generation
    });

    // Create a new account
    const account = await tronWeb.createAccount();

    return {
      address: account.address.base58,
      privateKey: account.privateKey,
      publicKey: account.publicKey,
    };
  } catch (error) {
    throw new ValidationError('Failed to generate Tron wallet', {
      originalError: error instanceof Error ? error.message : String(error),
      chain: 'TRON',
    });
  }
}

/**
 * Generates a wallet for the specified blockchain
 * 
 * @param chain - Blockchain network (POLYGON or TRON)
 * @returns Generated wallet with address and private key
 * 
 * @throws ValidationError if chain is not supported
 * 
 * @example
 * ```typescript
 * const polygonWallet = await generateWallet('POLYGON');
 * const tronWallet = await generateWallet('TRON');
 * ```
 */
export async function generateWallet(chain: ChainType): Promise<GeneratedWallet> {
  switch (chain) {
    case 'POLYGON':
      return generatePolygonWallet();
    
    case 'TRON':
      return await generateTronWallet();
    
    default:
      throw new ValidationError(`Unsupported blockchain: ${chain}`, {
        providedChain: chain,
        supportedChains: ['POLYGON', 'TRON'],
      });
  }
}

/**
 * Validates if an address matches the expected format for a chain
 * 
 * @param address - Blockchain address to validate
 * @param chain - Expected blockchain network
 * @returns true if valid, false otherwise
 * 
 * @example
 * ```typescript
 * isValidAddressForChain('0x742...', 'POLYGON'); // true
 * isValidAddressForChain('TJz...', 'TRON'); // true
 * isValidAddressForChain('0x742...', 'TRON'); // false
 * ```
 */
export function isValidAddressForChain(address: string, chain: ChainType): boolean {
  switch (chain) {
    case 'POLYGON':
      // Ethereum/Polygon address: 0x followed by 40 hex characters
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    
    case 'TRON':
      // Tron address: T followed by 33 base58 characters
      return /^T[a-km-zA-HJ-NP-Z1-9]{33}$/.test(address);
    
    default:
      return false;
  }
}

/**
 * Gets a human-readable name for a blockchain
 * 
 * @param chain - Blockchain network
 * @returns Human-readable name
 */
export function getChainName(chain: ChainType): string {
  switch (chain) {
    case 'POLYGON':
      return 'Polygon (MATIC)';
    case 'TRON':
      return 'Tron (TRX)';
    default:
      return chain;
  }
}

