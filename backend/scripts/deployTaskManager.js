import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log("Deploying TaskManager contract...\n");

  // Configuration from environment
  const rpcUrl = process.env.ARC_TESTNET_RPC || 'https://rpc.testnet.arc.network';
  const orchestratorPrivateKey = process.env.ORCHESTRATOR_PRIVATE_KEY;
  const usdcAddress = process.env.ARC_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
  const orchestratorAddress = process.env.ORCHESTRATOR_ADDRESS;

  if (!orchestratorPrivateKey || !orchestratorAddress) {
    throw new Error("ORCHESTRATOR_PRIVATE_KEY and ORCHESTRATOR_ADDRESS environment variables are required");
  }

  console.log("Deployment Configuration:");
  console.log(`- USDC Token Address: ${usdcAddress}`);
  console.log(`- Orchestrator Address: ${orchestratorAddress}`);
  console.log(`- Network: Arc Testnet`);
  console.log(`- Chain ID: 5042002\n`);

  // Create provider and signer
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(orchestratorPrivateKey, provider);

  console.log(`Deploying from: ${signer.address}\n`);

  // Read contract ABI and bytecode
  const artifactPath = join(__dirname, '../artifacts/contracts/TaskManager.sol/TaskManager.json');
  const artifact = JSON.parse(readFileSync(artifactPath, 'utf-8'));

  // Create contract factory
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);

  // Deploy the contract
  console.log("Deploying TaskManager...");
  const taskManager = await factory.deploy(usdcAddress, orchestratorAddress);
  const deploymentTx = taskManager.deploymentTransaction();

  console.log(`Transaction hash: ${deploymentTx.hash}`);
  console.log("Waiting for deployment confirmation...\n");

  // Wait for deployment
  const receipt = await deploymentTx.wait();
  const deploymentAddress = receipt.contractAddress;

  console.log(`✅ TaskManager deployed at: ${deploymentAddress}`);
  console.log(`Block: ${receipt.blockNumber}`);
  console.log(`Gas used: ${receipt.gasUsed.toString()}`);

  // Output deployment summary
  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log(`Contract Address: ${deploymentAddress}`);
  console.log(`USDC Token: ${usdcAddress}`);
  console.log(`Orchestrator: ${orchestratorAddress}`);
  console.log(`Explorer URL: https://explorer.testnet.arc.network/address/${deploymentAddress}`);
  console.log(`Transaction: https://explorer.testnet.arc.network/tx/${deploymentTx.hash}`);
  console.log("\n⚠️  SAVE THIS ADDRESS - Add to .env as TASK_MANAGER_ADDRESS");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
