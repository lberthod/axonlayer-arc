<template>
  <div class="wallet-manager">
    <!-- Disconnected State -->
    <div v-if="!web3.isConnected" class="wallet-card disconnected">
      <div class="wallet-header">
        <h3>🔗 Arc Testnet Wallet</h3>
        <p class="subtitle">Pure On-Chain Task Execution</p>
      </div>

      <div class="wallet-body">
        <p class="status-text">Not Connected</p>

        <button
          v-if="web3.isMetaMaskInstalled()"
          @click="connectWallet"
          :disabled="web3.loading"
          class="btn-connect"
        >
          <span v-if="!web3.loading">🦊 Connect MetaMask</span>
          <span v-else>Connecting...</span>
        </button>

        <div v-else class="error-box">
          <p>❌ MetaMask not found</p>
          <a href="https://metamask.io/" target="_blank" class="btn-install">
            Install MetaMask
          </a>
        </div>

        <div v-if="web3.error" class="error-box">
          <p>{{ web3.error }}</p>
        </div>
      </div>

      <div class="wallet-footer">
        <p class="footer-text">
          Arc Agent Hub uses MetaMask for secure, trustless on-chain task execution.
          No server-side wallet. No local ledger. Pure blockchain.
        </p>
      </div>
    </div>

    <!-- Connected but Wrong Network -->
    <div v-else-if="!web3.isArcTestnet" class="wallet-card warning">
      <div class="wallet-header">
        <h3>⚠️ Wrong Network</h3>
        <p class="subtitle">Currently on {{ web3.networkName }}</p>
      </div>

      <div class="wallet-body">
        <p class="status-text">{{ web3.displayAddress }}</p>

        <button
          @click="switchNetwork"
          :disabled="web3.loading"
          class="btn-switch"
        >
          <span v-if="!web3.loading">Switch to Arc Testnet</span>
          <span v-else>Switching...</span>
        </button>

        <p class="warning-text">
          Tasks can only be created on Arc Testnet.
          Please switch networks to continue.
        </p>
      </div>
    </div>

    <!-- Connected to Arc Testnet ✅ -->
    <div v-else class="wallet-card connected">
      <div class="wallet-header">
        <h3>✅ Connected to Arc Testnet</h3>
        <p class="subtitle">On-Chain Task Execution Ready</p>
      </div>

      <div class="wallet-body">
        <!-- Wallet Address -->
        <div class="wallet-item">
          <label>Wallet Address</label>
          <div class="address-box">
            <code>{{ web3.userAddress }}</code>
            <button @click="copyAddress" class="btn-copy" title="Copy address">
              📋
            </button>
            <a :href="web3.getExplorerUrl(web3.userAddress)" target="_blank" class="btn-explorer" title="View on Arc Explorer">
              🔍
            </a>
          </div>
        </div>

        <!-- Arc Native Balance -->
        <div class="wallet-item">
          <label>Arc Balance (Gas)</label>
          <div class="balance-display">
            <span class="balance-value">{{ parseFloat(web3.nativeBalance).toFixed(4) }}</span>
            <span class="balance-symbol">ARC</span>
          </div>
          <p class="balance-hint">Used for transaction gas fees</p>
        </div>

        <!-- Network Info -->
        <div class="wallet-item">
          <label>Network</label>
          <div class="network-box">
            <span class="network-badge">{{ web3.networkName }}</span>
            <span class="chain-id">Chain ID: 5042002</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="wallet-actions">
          <button @click="openExplorer" class="btn-action btn-explorer">
            📊 View on Explorer
          </button>
          <button @click="requestTestTokens" class="btn-action btn-faucet">
            💧 Request Test Tokens
          </button>
          <button @click="disconnectWallet" class="btn-action btn-disconnect">
            🔌 Disconnect
          </button>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div v-if="web3.recentTransactions.length > 0" class="transactions">
        <h4>Recent Transactions</h4>
        <div class="tx-list">
          <div v-for="tx in web3.recentTransactions" :key="tx.hash" class="tx-item">
            <div class="tx-icon">
              <span v-if="tx.type === 'create_task'">➕</span>
              <span v-else>⚙️</span>
            </div>
            <div class="tx-info">
              <p class="tx-type">{{ formatTxType(tx.type) }}</p>
              <code class="tx-hash">{{ tx.hash.slice(0, 20) }}...</code>
            </div>
            <div class="tx-status">
              <span v-if="tx.status === 'pending'" class="badge pending">⏳ Pending</span>
              <span v-else-if="tx.status === 'confirmed'" class="badge confirmed">✅ Confirmed</span>
              <span v-else class="badge">{{ tx.status }}</span>
            </div>
            <a :href="web3.getExplorerTxUrl(tx.hash)" target="_blank" class="tx-link">
              🔗
            </a>
          </div>
        </div>
      </div>

      <!-- Safety Info -->
      <div class="wallet-info">
        <h4>🔒 Security Notes</h4>
        <ul>
          <li>All tasks are on Arc Testnet blockchain</li>
          <li>Your funds are locked in smart contract escrow</li>
          <li>Transactions are immutable and transparent</li>
          <li>No private keys stored on server</li>
          <li>Verify all transactions on Arc Explorer</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useWeb3Store } from '@/stores/web3Store';

const web3 = useWeb3Store();

// Methods
const connectWallet = async () => {
  await web3.connectWallet();
};

const switchNetwork = async () => {
  await web3.switchToArcTestnet();
};

const disconnectWallet = async () => {
  await web3.disconnectWallet();
};

const copyAddress = () => {
  if (web3.userAddress) {
    navigator.clipboard.writeText(web3.userAddress);
    alert('Address copied to clipboard!');
  }
};

const openExplorer = () => {
  if (web3.userAddress) {
    window.open(web3.getExplorerUrl(web3.userAddress), '_blank');
  }
};

const requestTestTokens = () => {
  window.open('https://faucet.testnet.arc.network', '_blank');
};

const formatTxType = (type) => {
  const typeMap = {
    create_task: 'Task Created',
    submit_result: 'Result Submitted',
    validate: 'Validation Submitted',
    settle: 'Task Settled'
  };
  return typeMap[type] || type;
};
</script>

<style scoped>
.wallet-manager {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.wallet-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
}

.wallet-card.disconnected,
.wallet-card.warning {
  border: 2px solid #f59e0b;
  background: #fffbf0;
}

.wallet-card.connected {
  border: 2px solid #10b981;
  background: #f0fdf4;
}

.wallet-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
}

.wallet-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.wallet-header .subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.wallet-body {
  padding: 24px;
}

.wallet-footer {
  background: #f9fafb;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
}

.footer-text {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.status-text {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.warning-text {
  margin: 16px 0 0 0;
  font-size: 14px;
  color: #d97706;
}

.btn-connect,
.btn-switch,
.btn-action {
  width: 100%;
  padding: 12px 16px;
  margin: 8px 0;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-connect,
.btn-switch {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  margin-bottom: 16px;
}

.btn-connect:hover:not(:disabled),
.btn-switch:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-connect:disabled,
.btn-switch:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-action {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  margin: 4px 0;
}

.btn-action:hover {
  background: #e5e7eb;
}

.btn-explorer {
  background: #dbeafe;
  color: #0369a1;
}

.btn-explorer:hover {
  background: #bfdbfe;
}

.btn-faucet {
  background: #d1fae5;
  color: #065f46;
}

.btn-faucet:hover {
  background: #a7f3d0;
}

.btn-disconnect {
  background: #fee2e2;
  color: #7f1d1d;
}

.btn-disconnect:hover {
  background: #fecaca;
}

.btn-copy,
.btn-install {
  padding: 6px 12px;
  margin-left: 8px;
  font-size: 13px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background: #f3f4f6;
  transition: all 0.2s ease;
}

.btn-copy:hover,
.btn-install:hover {
  background: #e5e7eb;
}

.btn-install {
  display: inline-block;
  margin-top: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
}

.wallet-item {
  margin-bottom: 20px;
}

.wallet-item label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.address-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f9fafb;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.address-box code {
  flex: 1;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #374151;
  word-break: break-all;
}

.balance-display {
  display: flex;
  align-items: baseline;
  gap: 8px;
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.balance-value {
  font-size: 28px;
  font-weight: 700;
  color: #10b981;
}

.balance-symbol {
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
}

.balance-hint {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #9ca3af;
}

.network-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f9fafb;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.network-badge {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.chain-id {
  font-size: 12px;
  color: #6b7280;
  font-family: monospace;
}

.wallet-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 20px;
}

.wallet-actions .btn-disconnect {
  grid-column: 1 / -1;
}

.error-box {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  padding: 12px;
  margin: 12px 0;
  color: #7f1d1d;
  font-size: 14px;
}

.transactions {
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
  margin-top: 24px;
}

.transactions h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tx-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tx-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.tx-icon {
  font-size: 20px;
  min-width: 32px;
  text-align: center;
}

.tx-info {
  flex: 1;
}

.tx-type {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.tx-hash {
  display: block;
  margin: 4px 0 0 0;
  font-size: 11px;
  color: #6b7280;
  font-family: monospace;
}

.tx-status {
  font-size: 12px;
}

.badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
}

.badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.badge.confirmed {
  background: #d1fae5;
  color: #065f46;
}

.tx-link {
  display: inline-block;
  padding: 4px 8px;
  color: #667eea;
  text-decoration: none;
  font-size: 16px;
}

.tx-link:hover {
  opacity: 0.7;
}

.wallet-info {
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
  margin-top: 24px;
}

.wallet-info h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.wallet-info ul {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.wallet-info li {
  margin: 6px 0;
  padding-left: 20px;
  position: relative;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.5;
}

.wallet-info li:before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: bold;
}

@media (max-width: 600px) {
  .wallet-actions {
    grid-template-columns: 1fr;
  }

  .balance-value {
    font-size: 24px;
  }

  .tx-item {
    flex-wrap: wrap;
  }

  .tx-status {
    flex: 1;
    margin-top: 4px;
  }
}
</style>
