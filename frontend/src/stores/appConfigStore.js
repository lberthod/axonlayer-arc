import { reactive } from 'vue';
import { api } from '../services/api.js';

/**
 * Reactive snapshot of /api/config + /api/health, lazy-loaded once on first
 * use and refreshable. Used by SettlementBanner and TransactionsTable to
 * build explorer URLs and pick the right banner tone.
 */
export const appConfig = reactive({
  loaded: false,
  loading: false,
  error: null,
  asset: 'USDC',
  walletProvider: {
    mode: 'simulated',
    dryRun: true,
    network: null,
    label: null,
    chainId: null,
    explorer: null,
    faucet: null
  },
  health: { status: 'unknown', uptimeSec: 0 }
});

let inflight = null;

export async function loadAppConfig(force = false) {
  if (appConfig.loaded && !force) return appConfig;
  if (inflight) return inflight;

  appConfig.loading = true;
  appConfig.error = null;

  inflight = Promise.all([api.getConfig(), api.getHealth()])
    .then(([cfg, health]) => {
      appConfig.asset = cfg.asset || 'USDC';
      Object.assign(appConfig.walletProvider, cfg.walletProvider || {});
      appConfig.health = health || appConfig.health;
      appConfig.loaded = true;
      return appConfig;
    })
    .catch((err) => {
      appConfig.error = err.message || String(err);
      throw err;
    })
    .finally(() => {
      appConfig.loading = false;
      inflight = null;
    });

  return inflight;
}

/**
 * Returns 'live' | 'dryrun' | 'simulated' — drives banner colors and labels.
 */
export function settlementMode() {
  const wp = appConfig.walletProvider;
  if (wp.mode !== 'onchain') return 'simulated';
  return wp.dryRun ? 'dryrun' : 'live';
}

/**
 * Build an explorer URL for an on-chain transaction hash. Returns null when
 * we are not in onchain mode or no explorer is configured for the network.
 */
export function explorerTxUrl(hash) {
  const wp = appConfig.walletProvider;
  if (!hash || !wp.explorer) return null;
  return `${wp.explorer.replace(/\/$/, '')}/tx/${hash}`;
}

export function explorerAddressUrl(address) {
  const wp = appConfig.walletProvider;
  if (!address || !wp.explorer) return null;
  return `${wp.explorer.replace(/\/$/, '')}/address/${address}`;
}
