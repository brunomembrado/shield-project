/**
 * Polygon Network Client using Ethers.js
 * 
 * Handles Polygon (MATIC) network interactions for USDT transactions.
 * 
 * @module blockchain-service/polygonClient
 */

import { ethers } from 'ethers';
import { ChainType, logError, logInfo } from '../../../shared/types';
import { weiToToken, tokenToWei } from '../../../shared/utils';

/**
 * USDT contract ABI (ERC-20 standard functions)
 */
const USDT_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function symbol() view returns (string)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

/**
 * Polygon network configuration
 */
interface PolygonConfig {
  rpcUrl: string;
  chainId: number;
  usdtContract: string;
}

/**
 * Polygon client for interacting with Polygon network
 */
export class PolygonClient {
  private provider: ethers.JsonRpcProvider;
  private usdtContract: ethers.Contract;
  private config: PolygonConfig;

  constructor(config: PolygonConfig) {
    this.config = config;
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.usdtContract = new ethers.Contract(
      config.usdtContract,
      USDT_ABI,
      this.provider
    );
  }

  /**
   * Gets USDT balance for an address
   * 
   * @param address - Wallet address to check
   * @returns USDT balance as string (human-readable)
   */
  async getUSDTBalance(address: string): Promise<string> {
    try {
      const balance = await this.usdtContract.balanceOf(address);
      const decimals = await this.usdtContract.decimals();
      return weiToToken(balance.toString(), decimals);
    } catch (error) {
      logError(error as Error, { address, chain: ChainType.POLYGON, context: 'get-balance' });
      throw new Error(`Failed to get USDT balance: ${error}`);
    }
  }

  /**
   * Gets transaction details by hash
   * 
   * @param txHash - Transaction hash
   * @returns Transaction details
   */
  async getTransaction(txHash: string) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction not found');
      }

      const receipt = await this.provider.getTransactionReceipt(txHash);
      const block = await this.provider.getBlock(tx.blockNumber || 0);

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        blockNumber: tx.blockNumber,
        confirmations: receipt ? receipt.confirmations : 0,
        status: receipt?.status === 1 ? 'success' : receipt?.status === 0 ? 'failed' : 'pending',
        gasUsed: receipt?.gasUsed.toString(),
        gasPrice: tx.gasPrice?.toString(),
        timestamp: block?.timestamp,
      };
    } catch (error) {
      logError(error as Error, { txHash, chain: ChainType.POLYGON, context: 'get-transaction' });
      throw new Error(`Failed to get transaction: ${error}`);
    }
  }

  /**
   * Validates if a transaction is a USDT transfer to a specific address
   * 
   * @param txHash - Transaction hash
   * @param expectedToAddress - Expected recipient address
   * @returns Transaction validation result
   */
  async validateUSDTTransaction(txHash: string, expectedToAddress: string) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return { valid: false, reason: 'Transaction receipt not found' };
      }

      // Check if transaction was successful
      if (receipt.status !== 1) {
        return { valid: false, reason: 'Transaction failed' };
      }

      // Parse Transfer events from USDT contract
      const transferEvent = this.usdtContract.interface.parseLog({
        topics: receipt.logs.find(log => 
          log.address.toLowerCase() === this.config.usdtContract.toLowerCase()
        )?.topics || [],
        data: '0x',
      });

      if (!transferEvent || transferEvent.name !== 'Transfer') {
        return { valid: false, reason: 'Not a USDT transfer' };
      }

      const toAddress = transferEvent.args.to;
      const amount = transferEvent.args.value.toString();

      if (toAddress.toLowerCase() !== expectedToAddress.toLowerCase()) {
        return { valid: false, reason: 'Recipient address mismatch' };
      }

      const decimals = await this.usdtContract.decimals();
      const amountUSDT = weiToToken(amount, decimals);

      return {
        valid: true,
        from: transferEvent.args.from,
        to: toAddress,
        amount,
        amountUSDT,
        confirmations: receipt.confirmations,
      };
    } catch (error) {
      logError(error as Error, { txHash, chain: ChainType.POLYGON, context: 'validate-transaction' });
      return { valid: false, reason: `Validation error: ${error}` };
    }
  }

  /**
   * Gets current network status
   * 
   * @returns Network status information
   */
  async getNetworkStatus() {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getFeeData();

      return {
        chainId: this.config.chainId,
        latestBlock: BigInt(blockNumber),
        currentGasPrice: gasPrice.gasPrice?.toString() || '0',
        isHealthy: true,
      };
    } catch (error) {
      logError(error as Error, { chain: ChainType.POLYGON, context: 'network-status' });
      return {
        chainId: this.config.chainId,
        latestBlock: BigInt(0),
        currentGasPrice: '0',
        isHealthy: false,
      };
    }
  }

  /**
   * Monitors blocks for USDT transfers to a specific address
   * 
   * @param toAddress - Address to monitor
   * @param fromBlock - Starting block number
   * @param toBlock - Ending block number
   * @returns Array of USDT transfer transactions
   */
  async monitorUSDTTransfers(
    toAddress: string,
    fromBlock: number,
    toBlock: number
  ) {
    try {
      const filter = this.usdtContract.filters.Transfer(null, toAddress);
      const events = await this.usdtContract.queryFilter(filter, fromBlock, toBlock);

      const transfers = await Promise.all(
        events.map(async (event) => {
          const receipt = await event.getTransactionReceipt();
          const block = await event.getBlock();
          const decimals = await this.usdtContract.decimals();

          return {
            txHash: event.transactionHash,
            from: event.args.from,
            to: event.args.to,
            amount: event.args.value.toString(),
            amountUSDT: weiToToken(event.args.value.toString(), decimals),
            blockNumber: event.blockNumber,
            confirmations: receipt?.confirmations || 0,
            timestamp: block?.timestamp,
          };
        })
      );

      logInfo('USDT transfers monitored', {
        chain: ChainType.POLYGON,
        toAddress,
        count: transfers.length,
        fromBlock,
        toBlock,
      });

      return transfers;
    } catch (error) {
      logError(error as Error, {
        chain: ChainType.POLYGON,
        toAddress,
        fromBlock,
        toBlock,
        context: 'monitor-transfers',
      });
      throw new Error(`Failed to monitor transfers: ${error}`);
    }
  }
}

