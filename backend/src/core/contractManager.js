import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TaskManagerABIPath = join(__dirname, '../../artifacts/contracts/TaskManager.sol/TaskManager.json');
const TaskManagerABI = JSON.parse(readFileSync(TaskManagerABIPath, 'utf-8'));

/**
 * ContractManager
 * Handles all interactions with the TaskManager smart contract on Arc Testnet
 * Replaces local ledger system with trustless blockchain protocol
 */
class ContractManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = null;
    this.initialized = false;
  }

  /**
   * Initialize contract connection
   * Called once at server startup
   */
  async initialize() {
    try {
      const rpcUrl = process.env.ARC_TESTNET_RPC || 'https://rpc.testnet.arc.network';
      const contractAddress = process.env.TASK_MANAGER_ADDRESS;
      const orchestratorPrivateKey = process.env.ORCHESTRATOR_PRIVATE_KEY;

      if (!contractAddress) {
        throw new Error('TASK_MANAGER_ADDRESS not set in environment');
      }

      if (!orchestratorPrivateKey) {
        throw new Error('ORCHESTRATOR_PRIVATE_KEY not set in environment');
      }

      // Create provider
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Create signer from orchestrator private key
      this.signer = new ethers.Wallet(orchestratorPrivateKey, this.provider);

      // Create contract instance
      this.contract = new ethers.Contract(
        contractAddress,
        TaskManagerABI.abi,
        this.signer
      );

      this.contractAddress = contractAddress;
      this.initialized = true;

      console.log(`[ContractManager] ✅ Initialized on Arc Testnet`);
      console.log(`[ContractManager] Contract Address: ${contractAddress}`);
      console.log(`[ContractManager] Orchestrator Address: ${this.signer.address}`);

      return true;
    } catch (error) {
      console.error(`[ContractManager] ❌ Initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new task on-chain
   * @param {string} userAddress - User's wallet address
   * @param {string} input - Task input/prompt
   * @param {string} budget - Budget in USDC (as string with decimals)
   * @param {string} taskType - Type of task (summarize, keywords, etc.)
   * @param {string} metadata - Additional metadata as JSON string
   * @returns {Promise<Object>} - { taskId, txHash, explorerUrl }
   */
  async createTask(userAddress, input, budget, taskType, metadata = '{}') {
    try {
      if (!this.initialized || !this.contract) {
        throw new Error('ContractManager not initialized');
      }

      console.log(`[ContractManager:createTask] Creating task...`);
      console.log(`  User: ${userAddress}`);
      console.log(`  Input length: ${input.length} chars`);
      console.log(`  Budget: ${budget} USDC`);
      console.log(`  Task Type: ${taskType}`);

      // Convert budget to wei (USDC uses 6 decimals)
      const budgetInWei = ethers.parseUnits(budget, 6);

      // Call contract (using signer, so it's a write transaction)
      const tx = await this.contract.createTask(
        input,
        budgetInWei,
        taskType,
        metadata
      );

      console.log(`[ContractManager:createTask] Transaction submitted: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`[ContractManager:createTask] ✅ Confirmed in block ${receipt.blockNumber}`);

      // Extract task ID from event logs
      const event = receipt.logs
        .map(log => {
          try {
            return this.contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(event => event?.name === 'TaskCreated');

      if (!event) {
        throw new Error('TaskCreated event not found in receipt');
      }

      const taskId = event.args.taskId;
      const explorerUrl = `https://explorer.testnet.arc.network/tx/${tx.hash}`;

      console.log(`[ContractManager:createTask] ✅ Task created: ${taskId}`);

      return {
        taskId,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        explorerUrl,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error(`[ContractManager:createTask] ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Submit worker result on-chain
   * @param {string} taskId - Task identifier
   * @param {string} result - Worker's result
   * @param {string} payment - Payment to worker in USDC
   * @returns {Promise<Object>} - { txHash, blockNumber }
   */
  async submitWorkerResult(taskId, result, payment) {
    try {
      if (!this.initialized || !this.contract) {
        throw new Error('ContractManager not initialized');
      }

      console.log(`[ContractManager:submitWorkerResult] Submitting result...`);
      console.log(`  Task ID: ${taskId}`);
      console.log(`  Result length: ${result.length} chars`);
      console.log(`  Payment: ${payment} USDC`);

      const paymentInWei = ethers.parseUnits(payment, 6);

      const tx = await this.contract.submitWorkerResult(
        taskId,
        result,
        paymentInWei
      );

      console.log(`[ContractManager:submitWorkerResult] Transaction submitted: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`[ContractManager:submitWorkerResult] ✅ Confirmed in block ${receipt.blockNumber}`);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error(`[ContractManager:submitWorkerResult] ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Submit validation score on-chain
   * @param {string} taskId - Task identifier
   * @param {number} score - Validation score (0-100)
   * @param {string} payment - Payment to validator in USDC
   * @returns {Promise<Object>} - { txHash, blockNumber }
   */
  async submitValidation(taskId, score, payment) {
    try {
      if (!this.initialized || !this.contract) {
        throw new Error('ContractManager not initialized');
      }

      console.log(`[ContractManager:submitValidation] Submitting validation...`);
      console.log(`  Task ID: ${taskId}`);
      console.log(`  Score: ${score}/100`);
      console.log(`  Payment: ${payment} USDC`);

      const paymentInWei = ethers.parseUnits(payment, 6);

      const tx = await this.contract.submitValidation(
        taskId,
        score,
        paymentInWei
      );

      console.log(`[ContractManager:submitValidation] Transaction submitted: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`[ContractManager:submitValidation] ✅ Confirmed in block ${receipt.blockNumber}`);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error(`[ContractManager:submitValidation] ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Settle a completed task (pay orchestrator, refund user)
   * @param {string} taskId - Task identifier
   * @returns {Promise<Object>} - { txHash, blockNumber }
   */
  async settleTask(taskId) {
    try {
      if (!this.initialized || !this.contract) {
        throw new Error('ContractManager not initialized');
      }

      console.log(`[ContractManager:settleTask] Settling task: ${taskId}`);

      const tx = await this.contract.settleTask(taskId);

      console.log(`[ContractManager:settleTask] Transaction submitted: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`[ContractManager:settleTask] ✅ Confirmed in block ${receipt.blockNumber}`);

      return {
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error(`[ContractManager:settleTask] ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get task details from contract
   * @param {string} taskId - Task identifier
   * @returns {Promise<Object>} - Task struct data
   */
  async getTask(taskId) {
    try {
      if (!this.initialized || !this.contract) {
        throw new Error('ContractManager not initialized');
      }

      const task = await this.contract.getTask(taskId);

      return {
        id: task.id,
        creator: task.creator,
        input: task.input,
        budget: ethers.formatUnits(task.budget, 6),
        totalSpent: ethers.formatUnits(task.totalSpent, 6),
        result: task.result,
        validationScore: task.validationScore,
        status: task.status,
        createdAt: task.createdAt.toString(),
        completedAt: task.completedAt.toString(),
        taskType: task.taskType,
        metadata: task.metadata,
      };
    } catch (error) {
      console.error(`[ContractManager:getTask] ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all tasks for a user
   * @param {string} userAddress - User's wallet address
   * @returns {Promise<Array>} - Array of task IDs
   */
  async getUserTasks(userAddress) {
    try {
      if (!this.initialized || !this.contract) {
        throw new Error('ContractManager not initialized');
      }

      const taskIds = await this.contract.getUserTasks(userAddress);
      return taskIds;
    } catch (error) {
      console.error(`[ContractManager:getUserTasks] ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get total task count
   * @returns {Promise<number>}
   */
  async getTaskCount() {
    try {
      if (!this.initialized || !this.contract) {
        throw new Error('ContractManager not initialized');
      }

      const count = await this.contract.getTaskCount();
      return Number(count);
    } catch (error) {
      console.error(`[ContractManager:getTaskCount] ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get agent earnings (worker/validator/orchestrator)
   * @param {string} agentAddress - Agent's wallet address
   * @returns {Promise<Object>} - { worker, validator, orchestrator }
   */
  async getAgentEarnings(agentAddress) {
    try {
      if (!this.initialized || !this.contract) {
        throw new Error('ContractManager not initialized');
      }

      const earnings = await this.contract.getAgentEarnings(agentAddress);

      return {
        worker: ethers.formatUnits(earnings[0], 6),
        validator: ethers.formatUnits(earnings[1], 6),
        orchestrator: ethers.formatUnits(earnings[2], 6),
      };
    } catch (error) {
      console.error(`[ContractManager:getAgentEarnings] ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get contract USDC balance (total in escrow)
   * @returns {Promise<string>} - Balance in USDC
   */
  async getContractBalance() {
    try {
      if (!this.initialized || !this.contract) {
        throw new Error('ContractManager not initialized');
      }

      const balance = await this.contract.getContractBalance();
      return ethers.formatUnits(balance, 6);
    } catch (error) {
      console.error(`[ContractManager:getContractBalance] ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get task worker address
   * @param {string} taskId - Task identifier
   * @returns {Promise<string>} - Worker's address
   */
  async getTaskWorker(taskId) {
    try {
      if (!this.initialized || !this.contract) {
        throw new Error('ContractManager not initialized');
      }

      return await this.contract.getTaskWorker(taskId);
    } catch (error) {
      console.error(`[ContractManager:getTaskWorker] ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get task validator address
   * @param {string} taskId - Task identifier
   * @returns {Promise<string>} - Validator's address
   */
  async getTaskValidator(taskId) {
    try {
      if (!this.initialized || !this.contract) {
        throw new Error('ContractManager not initialized');
      }

      return await this.contract.getTaskValidator(taskId);
    } catch (error) {
      console.error(`[ContractManager:getTaskValidator] ❌ Failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if contract is initialized and connected
   * @returns {boolean}
   */
  isInitialized() {
    return this.initialized && this.contract !== null;
  }

  /**
   * Get contract address
   * @returns {string}
   */
  getContractAddress() {
    return this.contractAddress;
  }

  /**
   * Get orchestrator address
   * @returns {string}
   */
  getOrchestratorAddress() {
    return this.signer?.address || null;
  }
}

// Export singleton instance
const contractManager = new ContractManager();
export default contractManager;
