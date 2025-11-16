/**
 * Tron Network Client using TronWeb
 * 
 * Handles Tron network interactions for USDT transactions.
 * 
 * @module blockchain-service/tronClient
 */

import TronWeb from 'tronweb';
import { ChainType, logError, logInfo } from '@shield/shared/types';
import { weiToToken } from '@shield/shared/utils';

/**
 * Tron network configuration
 */
interface TronConfig {
  rpcUrl: string;
  chainId: number;
  usdtContract: string;
}

/**
 * Tron client for interacting with Tron network
 */
export class TronClient {
  private tronWeb: TronWeb;
  private config: TronConfig;

  constructor(config: TronConfig) {
    this.config = config;
    this.tronWeb = new TronWeb({
      fullHost: config.rpcUrl,
    });
  }

  /**
   * Gets USDT balance for an address
   * 
   * @param address - Wallet address to check
   * @returns USDT balance as string (human-readable)
   */
  async getUSDTBalance(address: string): Promise<string> {
    try {
      const contract = await this.tronWeb.contract().at(this.config.usdtContract);
      const balance = await contract.balanceOf(address).call();
      // Tron USDT has 6 decimals
      return weiToToken(balance.toString(), 6);
    } catch (error) {
      logError(error as Error, { address, chain: ChainType.TRON, context: 'get-balance' });
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
      const tx = await this.tronWeb.trx.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction not found');
      }

      const txInfo = await this.tronWeb.trx.getTransactionInfo(txHash);
      const block = await this.tronWeb.trx.getBlockByNumber(tx.blockNumber);

      return {
        hash: txHash,
        from: tx.raw_data.contract[0].parameter.value.owner_address
          ? this.tronWeb.address.fromHex(tx.raw_data.contract[0].parameter.value.owner_address)
          : null,
        to: tx.raw_data.contract[0].parameter.value.to_address
          ? this.tronWeb.address.fromHex(tx.raw_data.contract[0].parameter.value.to_address)
          : null,
        value: tx.raw_data.contract[0].parameter.value.amount?.toString() || '0',
        blockNumber: tx.blockNumber,
        confirmations: txInfo ? txInfo.receipt.result === 'SUCCESS' ? 1 : 0 : 0,
        status: txInfo?.receipt.result === 'SUCCESS' ? 'success' : 'failed',
        energyUsed: txInfo?.receipt.energy_usage_total || null,
        timestamp: block?.block_header?.raw_data?.timestamp || null,
      };
    } catch (error) {
      logError(error as Error, { txHash, chain: ChainType.TRON, context: 'get-transaction' });
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
      const tx = await this.tronWeb.trx.getTransaction(txHash);
      if (!tx) {
        return { valid: false, reason: 'Transaction not found' };
      }

      const txInfo = await this.tronWeb.trx.getTransactionInfo(txHash);
      if (txInfo?.receipt.result !== 'SUCCESS') {
        return { valid: false, reason: 'Transaction failed' };
      }

      // Check if it's a TRC20 transfer
      const contract = tx.raw_data.contract[0];
      if (contract.type !== 'TriggerSmartContract') {
        return { valid: false, reason: 'Not a smart contract transaction' };
      }

      const contractAddress = this.tronWeb.address.fromHex(contract.parameter.value.contract_address);
      if (contractAddress !== this.config.usdtContract) {
        return { valid: false, reason: 'Not a USDT contract transaction' };
      }

      // Parse transfer data
      const data = contract.parameter.value.data;
      // Transfer function signature: transfer(address,uint256)
      // First 4 bytes are function selector: 0xa9059cbb
      if (!data.startsWith('a9059cbb')) {
        return { valid: false, reason: 'Not a transfer function call' };
      }

      // Extract to address and amount from data
      const toAddressHex = '41' + data.slice(32, 72); // Add T prefix
      const toAddress = this.tronWeb.address.fromHex(toAddressHex);
      const amountHex = data.slice(72, 136);
      const amount = BigInt('0x' + amountHex).toString();

      if (toAddress !== expectedToAddress) {
        return { valid: false, reason: 'Recipient address mismatch' };
      }

      const amountUSDT = weiToToken(amount, 6); // Tron USDT has 6 decimals

      return {
        valid: true,
        from: this.tronWeb.address.fromHex(contract.parameter.value.owner_address),
        to: toAddress,
        amount,
        amountUSDT,
        confirmations: 1, // Tron transactions are confirmed immediately
      };
    } catch (error) {
      logError(error as Error, { txHash, chain: ChainType.TRON, context: 'validate-transaction' });
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
      const block = await this.tronWeb.trx.getCurrentBlock();
      const blockNumber = block.block_header.raw_data.number;

      return {
        chainId: this.config.chainId,
        latestBlock: BigInt(blockNumber),
        currentEnergyPrice: null, // Tron doesn't use gas, uses energy/bandwidth
        isHealthy: true,
      };
    } catch (error) {
      logError(error as Error, { chain: ChainType.TRON, context: 'network-status' });
      return {
        chainId: this.config.chainId,
        latestBlock: BigInt(0),
        currentEnergyPrice: null,
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
      const transfers: Array<{ from: string; to: string; amount: string; txHash: string; timestamp: number }> = [];
      
      // Tron doesn't have event filtering like Ethereum
      // We need to check each block
      for (let blockNum = fromBlock; blockNum <= toBlock; blockNum++) {
        try {
          const block = await this.tronWeb.trx.getBlockByNumber(blockNum);
          if (!block || !block.transactions) continue;

          for (const tx of block.transactions) {
            const contract = tx.raw_data?.contract?.[0];
            if (!contract || contract.type !== 'TriggerSmartContract') continue;

            const contractAddress = this.tronWeb.address.fromHex(contract.parameter.value.contract_address);
            if (contractAddress !== this.config.usdtContract) continue;

            const validation = await this.validateUSDTTransaction(tx.txID, toAddress);
            if (validation.valid) {
              transfers.push({
                txHash: tx.txID,
                from: validation.from,
                to: validation.to,
                amount: validation.amount,
                amountUSDT: validation.amountUSDT,
                blockNumber: blockNum,
                confirmations: 1,
                timestamp: block.block_header.raw_data.timestamp,
              });
            }
          }
        } catch (error) {
          // Continue to next block if error
          logError(error as Error, { blockNum, chain: ChainType.TRON, context: 'monitor-block' });
        }
      }

      logInfo('USDT transfers monitored', {
        chain: ChainType.TRON,
        toAddress,
        count: transfers.length,
        fromBlock,
        toBlock,
      });

      return transfers;
    } catch (error) {
      logError(error as Error, {
        chain: ChainType.TRON,
        toAddress,
        fromBlock,
        toBlock,
        context: 'monitor-transfers',
      });
      throw new Error(`Failed to monitor transfers: ${error}`);
    }
  }

  /**
   * Gets transaction count for an address
   * 
   * @param address - Wallet address
   * @returns Transaction count (approximate - Tron doesn't have exact nonce)
   */
  async getTransactionCount(address: string): Promise<number> {
    try {
      // Tron doesn't have a direct "get transaction count" method
      // We can get account info and count transactions
      const account = await this.tronWeb.trx.getAccount(address);
      
      // If account doesn't exist, return 0
      if (!account || Object.keys(account).length === 0) {
        return 0;
      }

      // Check if account has any transactions by checking balance or resources
      // This is an approximation - a real implementation would need to query transaction history
      const hasActivity = 
        (account.balance && account.balance > 0) ||
        (account.assetV2 && account.assetV2.length > 0) ||
        (account.account_resource && Object.keys(account.account_resource).length > 0);

      return hasActivity ? 1 : 0;
    } catch (error) {
      logError(error as Error, { address, chain: ChainType.TRON, context: 'get-transaction-count' });
      return 0; // Return 0 if error (likely account doesn't exist)
    }
  }

  /**
   * Gets native token balance (TRX) for an address
   * 
   * @param address - Wallet address
   * @returns Balance in SUN (smallest unit) as string
   */
  async getNativeBalance(address: string): Promise<string> {
    try {
      const balance = await this.tronWeb.trx.getBalance(address);
      return balance.toString();
    } catch (error) {
      logError(error as Error, { address, chain: ChainType.TRON, context: 'get-native-balance' });
      return '0';
    }
  }

  /**
   * Gets token balance with metadata
   * 
   * @param address - Wallet address
   * @param tokenAddress - Token contract address
   * @returns Token balance with metadata
   */
  async getTokenBalance(address: string, tokenAddress: string) {
    try {
      const contract = await this.tronWeb.contract().at(tokenAddress);

      const [balance, decimals, symbol] = await Promise.all([
        contract.balanceOf(address).call(),
        contract.decimals().call(),
        contract.symbol().call(),
      ]);

      return {
        balance: balance.toString(),
        formatted: weiToToken(balance.toString(), decimals),
        symbol,
        decimals: Number(decimals),
      };
    } catch (error) {
      logError(error as Error, { address, tokenAddress, chain: ChainType.TRON, context: 'get-token-balance' });
      throw new Error(`Failed to get token balance: ${error}`);
    }
  }

  /**
   * Estimates energy cost for a transaction
   * 
   * @param transactionType - Type of transaction (transfer, approve, etc.)
   * @returns Gas estimation data (energy for Tron)
   */
  async estimateGas(transactionType: string) {
    try {
      // Standard energy costs for different transaction types on Tron
      const energyCosts: Record<string, number> = {
        'transfer_native': 0, // Native TRX transfers use bandwidth, not energy
        'transfer_token': 14000, // TRC20 token transfer
        'approve_token': 10000, // TRC20 approve
        'swap': 50000, // Approximate
      };

      const energyRequired = energyCosts[transactionType] || 14000;

      // Get current energy price (approximate - 420 SUN per energy unit)
      const energyPrice = '420';
      const totalCost = BigInt(energyRequired) * BigInt(energyPrice);

      // Convert SUN to TRX (1 TRX = 1,000,000 SUN)
      const totalCostTRX = (Number(totalCost) / 1_000_000).toFixed(6);

      return {
        gasLimit: energyRequired.toString(),
        gasPrice: energyPrice,
        totalCost: totalCostTRX,
        totalCostUSD: null, // Would integrate with price oracle
      };
    } catch (error) {
      logError(error as Error, { transactionType, chain: ChainType.TRON, context: 'estimate-gas' });
      throw new Error(`Failed to estimate energy: ${error}`);
    }
  }
}

