import { ethers } from 'ethers';

/**
 * Arc Blockchain Service
 * Connects to Arc testnet to query real USDC balances
 */
class ArcBlockchainService {
  constructor() {
    // Arc testnet RPC endpoint
    this.rpcUrl = process.env.ARC_TESTNET_RPC || 'https://testnet-rpc.arc.io';
    this.usdcContractAddress = process.env.ARC_USDC_CONTRACT || '0x833589fcd6edb6e08f4c7c32d4f71b1566469c3d';
    this.provider = null;
    this.usdcContract = null;
    this.initializeProvider();
  }

  initializeProvider() {
    try {
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);

      // USDC ABI (minimal for balanceOf)
      const usdcAbi = [
        'function balanceOf(address account) public view returns (uint256)',
        'function decimals() public view returns (uint8)',
        'function symbol() public view returns (string)'
      ];

      this.usdcContract = new ethers.Contract(
        this.usdcContractAddress,
        usdcAbi,
        this.provider
      );
    } catch (error) {
      console.error('Failed to initialize Arc blockchain provider:', error);
      this.provider = null;
      this.usdcContract = null;
    }
  }

  /**
   * Check if address is valid Arc format
   */
  isValidArcAddress(address) {
    if (!address) return false;
    if (typeof address !== 'string') return false;
    if (!address.startsWith('0x')) return false;
    if (address.length !== 42) return false;
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return false;
    return true;
  }

  /**
   * Get USDC balance for an Arc wallet address
   * Returns balance in USDC (6 decimals)
   */
  async getBalance(walletAddress) {
    try {
      if (!this.isValidArcAddress(walletAddress)) {
        throw new Error(`Invalid Arc address: ${walletAddress}`);
      }

      if (!this.usdcContract) {
        console.warn('USDC contract not initialized, returning 0');
        return 0;
      }

      // Query balance from contract
      const balance = await this.usdcContract.balanceOf(walletAddress);

      // USDC has 6 decimals, convert to decimal
      const decimals = 6;
      const balanceInUsdc = Number(ethers.formatUnits(balance, decimals));

      return balanceInUsdc;
    } catch (error) {
      console.error(`Failed to get balance for ${walletAddress}:`, error);
      return 0;
    }
  }

  /**
   * Get multiple balances
   */
  async getBalances(addresses) {
    const results = {};
    for (const addr of addresses) {
      results[addr] = await this.getBalance(addr);
    }
    return results;
  }

  /**
   * Watch balance changes (polling)
   */
  async watchBalance(walletAddress, callback, pollIntervalMs = 5000) {
    if (!this.isValidArcAddress(walletAddress)) {
      throw new Error(`Invalid Arc address: ${walletAddress}`);
    }

    let lastBalance = null;

    const interval = setInterval(async () => {
      try {
        const currentBalance = await this.getBalance(walletAddress);
        if (currentBalance !== lastBalance) {
          lastBalance = currentBalance;
          callback(currentBalance);
        }
      } catch (error) {
        console.error('Error watching balance:', error);
      }
    }, pollIntervalMs);

    // Return unwatch function
    return () => clearInterval(interval);
  }

  /**
   * Get network status
   */
  async getNetworkStatus() {
    try {
      if (!this.provider) {
        return { connected: false, network: null, blockNumber: null };
      }

      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        connected: true,
        network: {
          name: network.name,
          chainId: network.chainId,
          ensAddress: network.ensAddress
        },
        blockNumber
      };
    } catch (error) {
      console.error('Failed to get network status:', error);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Get Arc testnet info
   */
  async getTestnetInfo() {
    const status = await this.getNetworkStatus();
    return {
      rpc: this.rpcUrl,
      usdcContract: this.usdcContractAddress,
      connected: status.connected,
      status
    };
  }
}

export default new ArcBlockchainService();
