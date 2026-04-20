import { v4 as uuid } from 'uuid';
import { JsonStore } from './jsonStore.js';
import { config } from '../config.js';

/**
 * Provider record (an agent offered on the marketplace):
 * {
 *   id, ownerUid, name, description, role: 'worker'|'validator',
 *   taskTypes: [],
 *   basePrice, apiEndpoint, walletAddress,
 *   status: 'pending'|'approved'|'rejected'|'slashed',
 *   stake, score,
 *   stats: { completed, failed, slashCount, earned, slashed },
 *   createdAt, updatedAt
 * }
 */
class ProviderStore {
  constructor() {
    this.store = new JsonStore(config.auth.providersFile, { providers: {} });
  }

  async load() {
    await this.store.load();
    return this;
  }

  get providers() { return this.store.data.providers; }

  list(filter = {}) {
    return Object.values(this.providers).filter((p) => {
      if (filter.status && p.status !== filter.status) return false;
      if (filter.ownerUid && p.ownerUid !== filter.ownerUid) return false;
      if (filter.role && p.role !== filter.role) return false;
      return true;
    });
  }

  get(id) { return this.providers[id] || null; }

  async register(ownerUid, payload) {
    const id = `prov_${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();
    const provider = {
      id,
      ownerUid,
      name: String(payload.name || 'Unnamed agent').slice(0, 80),
      description: String(payload.description || '').slice(0, 500),
      role: ['worker', 'validator'].includes(payload.role) ? payload.role : 'worker',
      taskTypes: Array.isArray(payload.taskTypes) && payload.taskTypes.length
        ? payload.taskTypes.map(String)
        : ['summarize'],
      basePrice: Math.max(0, Number(payload.basePrice || 0.0002)),
      apiEndpoint: payload.apiEndpoint ? String(payload.apiEndpoint) : null,
      walletAddress: payload.walletAddress ? String(payload.walletAddress) : null,
      status: 'pending',
      stake: Math.max(0, Number(payload.stake || 0)),
      score: config.registry.defaultScore,
      stats: { completed: 0, failed: 0, slashCount: 0, earned: 0, slashed: 0 },
      createdAt: now,
      updatedAt: now
    };
    this.providers[id] = provider;
    await this.store.flush();
    return provider;
  }

  async update(id, patch, { ownerUid } = {}) {
    const p = this.providers[id];
    if (!p) return null;
    if (ownerUid && p.ownerUid !== ownerUid) return null;
    const allowed = ['name', 'description', 'taskTypes', 'basePrice', 'apiEndpoint', 'walletAddress'];
    for (const key of allowed) {
      if (patch[key] !== undefined) p[key] = patch[key];
    }
    p.updatedAt = new Date().toISOString();
    await this.store.flush();
    return p;
  }

  async setStatus(id, status) {
    const p = this.providers[id];
    if (!p) return null;
    if (!['pending', 'approved', 'rejected', 'slashed'].includes(status)) {
      throw new Error('invalid status');
    }
    p.status = status;
    p.updatedAt = new Date().toISOString();
    await this.store.flush();
    return p;
  }

  async addStake(id, amount) {
    const p = this.providers[id];
    if (!p) return null;
    p.stake = Number((p.stake + Number(amount || 0)).toFixed(6));
    p.updatedAt = new Date().toISOString();
    await this.store.flush();
    return p;
  }

  async slash(id, amount, reason) {
    const p = this.providers[id];
    if (!p) return null;
    const penalty = Math.min(p.stake, Number(amount ?? config.marketplace.slashPenalty));
    p.stake = Number((p.stake - penalty).toFixed(6));
    p.stats.slashCount += 1;
    p.stats.slashed = Number((p.stats.slashed + penalty).toFixed(6));
    p.lastSlashReason = reason || null;
    if (p.stake < config.marketplace.minStake) {
      p.status = 'slashed';
    }
    p.updatedAt = new Date().toISOString();
    await this.store.flush();
    return { provider: p, penalty };
  }

  async recordOutcome(id, { success, amount = 0, score }) {
    const p = this.providers[id];
    if (!p) return null;
    if (success) {
      p.stats.completed += 1;
      p.stats.earned = Number((p.stats.earned + Number(amount || 0)).toFixed(6));
    } else {
      p.stats.failed += 1;
    }
    if (typeof score === 'number') {
      const alpha = 0.3;
      p.score = Number((alpha * score + (1 - alpha) * p.score).toFixed(3));
    }
    p.updatedAt = new Date().toISOString();
    await this.store.flush();
    return p;
  }
}

export default new ProviderStore();
