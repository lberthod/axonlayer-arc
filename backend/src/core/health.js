import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import paymentAdapter from './paymentAdapter.js';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_DIR = path.join(__dirname, '../data');

/**
 * Liveness vs readiness:
 *   - liveness: the process is alive (no crash). Cheap, always 200.
 *   - readiness: every dependency the service needs to serve a task is OK.
 *                Returns 503 if any dependency is down, so orchestrators
 *                (k8s / compose) can stop routing traffic.
 */

async function checkLedger() {
  try {
    await fs.access(STORE_DIR);
    const balances = await paymentAdapter.getAllBalances();
    return { ok: true, walletCount: Object.keys(balances).length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function checkOnChain() {
  if (config.walletProvider.mode !== 'onchain') {
    return { ok: true, mode: 'simulated' };
  }
  const oc = config.walletProvider.onChain;
  if (oc.dryRun) {
    return { ok: true, mode: 'onchain', dryRun: true, network: oc.label };
  }
  try {
    const { ethers } = await import('ethers');
    const provider = new ethers.JsonRpcProvider(oc.rpcUrl);
    const block = await provider.getBlockNumber();
    return { ok: true, mode: 'onchain', dryRun: false, network: oc.label, blockNumber: block };
  } catch (err) {
    return { ok: false, mode: 'onchain', error: err.message };
  }
}

function checkAuth() {
  if (!config.auth.enabled) return { ok: true, enabled: false };
  return {
    ok: Boolean(config.auth.firebaseProjectId || config.auth.serviceAccountPath),
    enabled: true,
    projectId: config.auth.firebaseProjectId || null
  };
}

export async function liveness() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSec: Math.floor(process.uptime()),
    version: process.env.npm_package_version || 'dev'
  };
}

export async function readiness() {
  const [ledger, onchain] = await Promise.all([checkLedger(), checkOnChain()]);
  const auth = checkAuth();
  const checks = { ledger, onchain, auth };
  const ok = Object.values(checks).every((c) => c.ok);
  return {
    status: ok ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    settlementMode: paymentAdapter.mode,
    checks
  };
}
