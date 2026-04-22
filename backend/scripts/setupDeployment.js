#!/usr/bin/env node
/**
 * Deployment Setup Script
 *
 * This script helps set up the environment for deploying TaskManager to Arc Testnet.
 * It handles:
 * 1. Generating orchestrator account
 * 2. Instructions for getting test tokens
 * 3. Creating/updating .env file
 * 4. Validating configuration
 */

import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║      Arc Agent Hub - TaskManager Deployment Setup Script       ║');
  console.log('║                                                                ║');
  console.log('║                   Pure On-Chain Task Execution                 ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Step 1: Generate Orchestrator Account
  console.log('STEP 1: Generate Orchestrator Account');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const wallet = ethers.Wallet.createRandom();
  const orchestratorAddress = wallet.address;
  const orchestratorPrivateKey = wallet.privateKey;

  console.log('\n✅ Generated new orchestrator account:\n');
  console.log(`  Address (Public Key):  ${orchestratorAddress}`);
  console.log(`  Private Key:           ${orchestratorPrivateKey}`);
  console.log('\n⚠️  SAVE THIS PRIVATE KEY - You will need it in next steps!\n');

  // Step 2: Arc Testnet Token Faucet
  console.log('STEP 2: Get Arc Testnet Tokens');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`
1. Open your browser and go to:
   🔗 https://faucet.testnet.arc.network

2. Paste this address into the faucet:
   📋 ${orchestratorAddress}

3. Click "Request Tokens" and wait 1-2 minutes

4. Verify receipt on Arc Explorer:
   🔗 https://explorer.testnet.arc.network/address/${orchestratorAddress}

5. You should see Arc tokens in your balance

⏸️  Press Enter when you have received tokens...
  `);

  await question('');

  // Step 3: Verify .env exists
  console.log('\nSTEP 3: Configure Environment Variables');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
    console.log('✅ Found existing .env file');
  } else {
    console.log('⚠️  .env not found, will create new one');
  }

  // Update or create .env with orchestrator details
  const requiredVars = {
    'ARC_TESTNET_RPC': 'https://rpc.testnet.arc.network',
    'ARC_CHAIN_ID': '5042002',
    'ARC_USDC_ADDRESS': '0x3600000000000000000000000000000000000000',
    'ORCHESTRATOR_PRIVATE_KEY': orchestratorPrivateKey,
    'ORCHESTRATOR_ADDRESS': orchestratorAddress,
  };

  let newEnvContent = envContent;

  for (const [key, value] of Object.entries(requiredVars)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');

    if (newEnvContent.match(regex)) {
      // Update existing
      newEnvContent = newEnvContent.replace(regex, `${key}=${value}`);
    } else {
      // Append new
      if (!newEnvContent.endsWith('\n')) {
        newEnvContent += '\n';
      }
      newEnvContent += `${key}=${value}\n`;
    }
  }

  fs.writeFileSync(envPath, newEnvContent);
  console.log('✅ Updated .env with orchestrator details\n');

  // Step 4: Deployment Instructions
  console.log('STEP 4: Deploy Smart Contract');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`
Now that your orchestrator account is funded, deploy the contract:

  npm run contract:deploy:testnet

This will:
  1. Compile the smart contract
  2. Deploy TaskManager to Arc Testnet
  3. Output the contract address
  4. Print explorer link

⏸️  Press Enter after running the deployment command...
  `);

  await question('');

  // Step 5: Get Contract Address
  console.log('\nSTEP 5: Update Contract Address');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const contractAddress = await question(
    'Paste the deployed TaskManager contract address (0x...): '
  );

  if (!contractAddress.startsWith('0x') || contractAddress.length !== 42) {
    console.error('❌ Invalid contract address format. Should be 0x... with 40 hex characters');
    process.exit(1);
  }

  // Update .env with contract address
  let finalEnvContent = fs.readFileSync(envPath, 'utf-8');
  const taskManagerRegex = /^TASK_MANAGER_ADDRESS=.*$/m;

  if (finalEnvContent.match(taskManagerRegex)) {
    finalEnvContent = finalEnvContent.replace(taskManagerRegex, `TASK_MANAGER_ADDRESS=${contractAddress}`);
  } else {
    if (!finalEnvContent.endsWith('\n')) {
      finalEnvContent += '\n';
    }
    finalEnvContent += `TASK_MANAGER_ADDRESS=${contractAddress}\n`;
  }

  fs.writeFileSync(envPath, finalEnvContent);
  console.log('\n✅ Updated .env with contract address\n');

  // Step 6: Verification
  console.log('STEP 6: Verify Deployment');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`
View your deployed contract on Arc Explorer:
  🔗 https://explorer.testnet.arc.network/address/${contractAddress}

Should show:
  ✓ Contract bytecode
  ✓ TaskManager ABI
  ✓ Read/Write methods available
  `);

  // Step 7: Start Server
  console.log('STEP 7: Start Backend Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`
Start the backend with:

  npm start

Expected output:
  [Server] ✅ Smart contract initialized for on-chain task execution
  [ContractManager] ✅ Initialized on Arc Testnet
  [ContractManager] Contract Address: ${contractAddress}
  [ContractManager] Orchestrator Address: ${orchestratorAddress}
  `);

  // Step 8: Test
  console.log('STEP 8: Test On-Chain Task Creation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`
Create a test task (in another terminal):

  curl -X POST http://localhost:3001/api/tasks \\
    -H "Content-Type: application/json" \\
    -d '{
      "input": "Summarize: Artificial intelligence is transforming the world",
      "taskType": "summarize",
      "budget": "10",
      "userAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f123"
    }'

Expected response:
  {
    "success": true,
    "taskId": "0x...",
    "transactionHash": "0x...",
    "explorerUrl": "https://explorer.testnet.arc.network/tx/0x...",
    ...
  }

View the transaction on Arc Explorer:
  🔗 https://explorer.testnet.arc.network/tx/{transactionHash}
  `);

  // Final Summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    🎉 Setup Complete! 🎉                       ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Configuration Summary:');
  console.log(`   Orchestrator Address: ${orchestratorAddress}`);
  console.log(`   Contract Address:     ${contractAddress}`);
  console.log(`   Network:              Arc Testnet (chainId: 5042002)`);
  console.log(`   RPC Endpoint:         https://rpc.testnet.arc.network`);
  console.log(`   USDC Token:           0x3600000000000000000000000000000000000000`);
  console.log(`\n✅ .env file updated with all values`);
  console.log(`✅ Ready to start: npm start`);
  console.log(`✅ Ready to test: curl -X POST http://localhost:3001/api/tasks ...\n`);

  console.log('🔗 Useful Links:');
  console.log(`   Arc Explorer:     https://explorer.testnet.arc.network`);
  console.log(`   Arc Faucet:       https://faucet.testnet.arc.network`);
  console.log(`   Arc Docs:         https://docs.arc.network\n`);

  rl.close();
}

main().catch(error => {
  console.error('❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
});
