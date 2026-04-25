import https from 'https';
import fs from 'fs';
import app from './app.js';
import ledger from './core/ledger.js';
import paymentAdapter from './core/paymentAdapter.js';
import agentRegistry from './core/agentRegistry.js';
import providerStore from './core/providerStore.js';
import taskEngine from './core/taskEngine.js';
import treasuryStore from './core/treasuryStore.js';
import { initializeAuth } from './core/auth.js';

const PORT = process.env.PORT || 3001;
const HTTPS_ENABLED = process.env.HTTPS_ENABLED === 'true';
const HTTPS_KEY_PATH = process.env.HTTPS_KEY_PATH;
const HTTPS_CERT_PATH = process.env.HTTPS_CERT_PATH;

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

    let server;
    if (HTTPS_ENABLED && HTTPS_KEY_PATH && HTTPS_CERT_PATH) {
      try {
        const key = fs.readFileSync(HTTPS_KEY_PATH, 'utf-8');
        const cert = fs.readFileSync(HTTPS_CERT_PATH, 'utf-8');
        server = https.createServer({ key, cert }, app);
        console.log(`🔒 HTTPS enabled (cert: ${HTTPS_CERT_PATH})`);
      } catch (err) {
        console.warn(`⚠️ Failed to load HTTPS certificates:`, err.message);
        console.log(`Falling back to HTTP...`);
        server = app;
      }
    } else {
      server = app;
    }

    server.listen(PORT, () => {
      const protocol = HTTPS_ENABLED && HTTPS_KEY_PATH && HTTPS_CERT_PATH ? 'https' : 'http';
      console.log(`Server running on ${protocol}://localhost:${PORT}`);
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
