import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { ethers } from 'ethers';

/**
 * Web3 Store - Pinia store for MetaMask wallet and blockchain state
 * Replaces local mission wallet with on-chain Arc Testnet wallet
 *
 * Features:
 * - MetaMask connection/disconnection
 * - Wallet address and balance tracking
 * - Network detection (Arc Testnet)
 * - On-chain task creation
 * - Transaction monitoring
 */
export const useWeb3Store = defineStore('web3', () => {
  // State
  const isConnected = ref(false);
  const userAddress = ref(null);
  const userBalance = ref('0'); // Balance in USDC
  const nativeBalance = ref('0'); // Balance in Arc tokens
  const networkId = ref(null);
  const networkName = ref('disconnected');
  const provider = ref(null);
  const signer = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Recent transactions
  const recentTransactions = ref([]);
  const maxRecentTransactions = 10;

  // Arc Testnet constants
  const ARC_TESTNET_CHAIN_ID = '0x4D0602'; // 5042002 in hex
  const ARC_TESTNET_RPC = 'https://rpc.testnet.arc.network';
  const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

  // Computed
  const isArcTestnet = computed(() => networkId.value === ARC_TESTNET_CHAIN_ID);
  const isReady = computed(() => isConnected.value && isArcTestnet.value);
  const displayAddress = computed(() => {
    if (!userAddress.value) return '';
    return `${userAddress.value.slice(0, 6)}...${userAddress.value.slice(-4)}`;
  });

  /**
   * Connect to MetaMask wallet
   */
  async function connectWallet() {
    try {
      loading.value = true;
      error.value = null;

      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error('MetaMask not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No account selected');
      }

      // Create provider and signer
      provider.value = new ethers.BrowserProvider(window.ethereum);
      signer.value = await provider.value.getSigner();

      // Set user address
      userAddress.value = accounts[0];
      isConnected.value = true;

      // Get network info
      const network = await provider.value.getNetwork();
      networkId.value = `0x${network.chainId.toString(16)}`;
      updateNetworkName();

      // Fetch balances
      await fetchBalances();

      // Request Arc Testnet if user is on different network
      if (!isArcTestnet.value) {
        await switchToArcTestnet();
      }

      // Listen for account/network changes
      setupEventListeners();

      console.log('[Web3Store] ✅ Wallet connected', {
        address: userAddress.value,
        network: networkName.value,
        balance: userBalance.value
      });

      return true;
    } catch (err) {
      error.value = err.message;
      console.error('[Web3Store] ❌ Connection failed:', err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Disconnect wallet
   */
  async function disconnectWallet() {
    try {
      isConnected.value = false;
      userAddress.value = null;
      userBalance.value = '0';
      nativeBalance.value = '0';
      networkId.value = null;
      networkName.value = 'disconnected';
      provider.value = null;
      signer.value = null;
      recentTransactions.value = [];
      error.value = null;

      // Remove event listeners
      if (window.ethereum) {
        window.ethereum.removeAllListeners?.();
      }

      console.log('[Web3Store] ✅ Wallet disconnected');
    } catch (err) {
      console.error('[Web3Store] ❌ Disconnect failed:', err);
    }
  }

  /**
   * Switch to Arc Testnet
   */
  async function switchToArcTestnet() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ARC_TESTNET_CHAIN_ID }]
      });
      return true;
    } catch (switchError) {
      // Network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: ARC_TESTNET_CHAIN_ID,
                chainName: 'Arc Testnet',
                rpcUrls: [ARC_TESTNET_RPC],
                nativeCurrency: {
                  name: 'Arc',
                  symbol: 'ARC',
                  decimals: 18
                },
                blockExplorerUrls: ['https://explorer.testnet.arc.network'],
                iconUrls: ['https://arc.network/logo.png']
              }
            ]
          });

          // Update network info
          const network = await provider.value.getNetwork();
          networkId.value = `0x${network.chainId.toString(16)}`;
          updateNetworkName();

          return true;
        } catch (addError) {
          error.value = 'Failed to add Arc Testnet to MetaMask';
          console.error('[Web3Store] ❌ Add network failed:', addError);
          return false;
        }
      }
      throw switchError;
    }
  }

  /**
   * Fetch user balances (USDC + Arc)
   */
  async function fetchBalances() {
    if (!provider.value || !userAddress.value) return;

    try {
      // Fetch native balance (Arc tokens)
      const nativeBalanceWei = await provider.value.getBalance(userAddress.value);
      nativeBalance.value = ethers.formatEther(nativeBalanceWei);

      // Fetch USDC balance (requires contract call)
      // For now, just log it - actual balance check done on server
      console.log('[Web3Store] Fetched balances:', {
        arc: nativeBalance.value,
        address: userAddress.value
      });
    } catch (err) {
      console.error('[Web3Store] ❌ Failed to fetch balances:', err);
    }
  }

  /**
   * Create an on-chain task
   */
  async function createTask(input, taskType, budget) {
    if (!isReady.value) {
      throw new Error('Wallet not connected to Arc Testnet');
    }

    try {
      loading.value = true;
      error.value = null;

      // Call backend API with wallet address
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input,
          taskType,
          budget: budget.toString(),
          userAddress: userAddress.value
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();

      // Add to recent transactions
      addTransaction({
        hash: result.transactionHash,
        type: 'create_task',
        taskId: result.taskId,
        status: 'pending',
        timestamp: new Date()
      });

      console.log('[Web3Store] ✅ Task created:', {
        taskId: result.taskId,
        txHash: result.transactionHash,
        explorerUrl: result.explorerUrl
      });

      return result;
    } catch (err) {
      error.value = err.message;
      console.error('[Web3Store] ❌ Task creation failed:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get user's on-chain tasks
   */
  async function getUserTasks() {
    if (!userAddress.value) {
      throw new Error('User not connected');
    }

    try {
      const response = await fetch(`/api/tasks/mine?address=${userAddress.value}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.tasks || [];
    } catch (err) {
      console.error('[Web3Store] ❌ Failed to fetch user tasks:', err);
      throw err;
    }
  }

  /**
   * Get task details from blockchain
   */
  async function getTaskDetails(taskId) {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.task;
    } catch (err) {
      console.error('[Web3Store] ❌ Failed to fetch task details:', err);
      throw err;
    }
  }

  /**
   * Add transaction to recent list
   */
  function addTransaction(tx) {
    recentTransactions.value.unshift(tx);
    if (recentTransactions.value.length > maxRecentTransactions) {
      recentTransactions.value.pop();
    }
  }

  /**
   * Update network name based on chainId
   */
  function updateNetworkName() {
    if (isArcTestnet.value) {
      networkName.value = 'Arc Testnet';
    } else if (networkId.value === '0x1') {
      networkName.value = 'Ethereum Mainnet';
    } else if (networkId.value === '0xaa36a7') {
      networkName.value = 'Sepolia Testnet';
    } else {
      networkName.value = `Chain ${parseInt(networkId.value, 16)}`;
    }
  }

  /**
   * Setup MetaMask event listeners
   */
  function setupEventListeners() {
    if (!window.ethereum) return;

    // Account changed
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        userAddress.value = accounts[0];
        console.log('[Web3Store] Account changed:', userAddress.value);
        fetchBalances();
      }
    });

    // Network changed
    window.ethereum.on('chainChanged', (chainId) => {
      networkId.value = chainId;
      updateNetworkName();
      console.log('[Web3Store] Network changed:', networkName.value);

      if (!isArcTestnet.value) {
        error.value = 'Wrong network. Please switch to Arc Testnet.';
      } else {
        error.value = null;
      }
    });

    // Disconnected
    window.ethereum.on('disconnect', () => {
      disconnectWallet();
    });
  }

  /**
   * Check if MetaMask is installed
   */
  function isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined';
  }

  /**
   * Get Arc Explorer URL for address
   */
  function getExplorerUrl(address) {
    return `https://explorer.testnet.arc.network/address/${address}`;
  }

  /**
   * Get Arc Explorer URL for transaction
   */
  function getExplorerTxUrl(txHash) {
    return `https://explorer.testnet.arc.network/tx/${txHash}`;
  }

  return {
    // State
    isConnected,
    userAddress,
    userBalance,
    nativeBalance,
    networkId,
    networkName,
    loading,
    error,
    recentTransactions,

    // Computed
    isArcTestnet,
    isReady,
    displayAddress,

    // Methods
    connectWallet,
    disconnectWallet,
    switchToArcTestnet,
    fetchBalances,
    createTask,
    getUserTasks,
    getTaskDetails,
    addTransaction,
    isMetaMaskInstalled,
    getExplorerUrl,
    getExplorerTxUrl
  };
});
