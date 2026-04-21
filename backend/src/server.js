import app from './app.js';
import ledger from './core/ledger.js';
import paymentAdapter from './core/paymentAdapter.js';
import agentRegistry from './core/agentRegistry.js';
import providerStore from './core/providerStore.js';
import taskEngine from './core/taskEngine.js';
import treasuryStore from './core/treasuryStore.js';
import { initializeAuth } from './core/auth.js';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await ledger.load();
    await treasuryStore.load();
    await paymentAdapter.initializeWallets();
    await providerStore.load();
    await taskEngine.load();
    await initializeAuth();
    await agentRegistry.hydrateFromProviders();
    
    const { config } = await import('./config.js');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Settlement mode: ${paymentAdapter.mode}`);
      console.log(`Pricing profile: ${config.pricing.profile}`);
      if (paymentAdapter.mode === 'onchain') {
        const oc = config.walletProvider.onChain;
        console.log(`On-chain network: ${oc.label} (chainId ${oc.chainId})`);
        console.log(`USDC contract:    ${oc.usdcAddress || '(unset)'}`);
        console.log(`Dry run:          ${oc.dryRun}`);
      }
      console.log(`API endpoints available:`);
      console.log(`  POST /api/tasks           - Create and execute a task`);
      console.log(`  GET  /api/tasks/:id       - Get task details`);
      console.log(`  GET  /api/balances        - Get all wallet balances`);
      console.log(`  GET  /api/transactions    - Get transactions`);
      console.log(`  POST /api/simulate        - Run simulation`);
      console.log(`  GET  /api/metrics         - Get operational / economic metrics`);
      console.log(`  GET  /api/agents          - List agents + stats`);
      console.log(`  POST /api/agents/quote    - Quote a task (price + selected agents)`);
      console.log(`  GET  /api/health          - Health check`);
      console.log(`  GET  /api/config          - Get configuration`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
