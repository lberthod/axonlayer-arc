import crypto from 'crypto';
import { JsonStore } from './jsonStore.js';
import { config } from '../config.js';

/**
 * User record:
 * {
 *   uid, email, displayName, role: 'user'|'provider'|'admin',
 *   apiKey, walletAddress, createdAt, lastLoginAt,
 *   usage: { tasks, totalSpent, lastReset, today },
 *   missionWallet: { address: string, balance: number }
 * }
 */
class UserStore {
  constructor() {
    this.store = new JsonStore(config.auth.usersFile, { users: {}, byApiKey: {} });
  }

  async load() {
    await this.store.load();
    return this;
  }

  get users() { return this.store.data.users; }
  get byApiKey() { return this.store.data.byApiKey; }

  async upsertFromFirebase({ uid, email, displayName }) {
    const existing = this.users[uid];
    const isAdminByEmail = email && config.auth.adminEmails.includes(email);

    if (existing) {
      existing.email = email || existing.email;
      existing.displayName = displayName || existing.displayName;
      existing.lastLoginAt = new Date().toISOString();
      if (isAdminByEmail && existing.role !== 'admin') existing.role = 'admin';
      // Ensure mission wallet exists for existing users
      if (!existing.missionWallet) {
        existing.missionWallet = {
          address: `mission_${uid}_${crypto.randomBytes(8).toString('hex')}`,
          balance: 0
        };
      }
      await this.store.flush();
      return existing;
    }

    const apiKey = `sk_${crypto.randomBytes(24).toString('hex')}`;
    const user = {
      uid,
      email: email || null,
      displayName: displayName || null,
      role: isAdminByEmail ? 'admin' : 'user',
      apiKey,
      walletAddress: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      usage: { tasks: 0, totalSpent: 0, today: { date: null, tasks: 0, spent: 0 } },
      missionWallet: {
        address: `mission_${uid}_${crypto.randomBytes(8).toString('hex')}`,
        balance: 0
      }
    };
    this.users[uid] = user;
    this.byApiKey[apiKey] = uid;
    await this.store.flush();
    return user;
  }

  getByUid(uid) { return this.users[uid] || null; }

  getByApiKey(apiKey) {
    const uid = this.byApiKey[apiKey];
    return uid ? this.users[uid] : null;
  }

  async rotateApiKey(uid) {
    const user = this.users[uid];
    if (!user) return null;
    delete this.byApiKey[user.apiKey];
    user.apiKey = `sk_${crypto.randomBytes(24).toString('hex')}`;
    this.byApiKey[user.apiKey] = uid;
    await this.store.flush();
    return user;
  }

  async setRole(uid, role) {
    if (!['user', 'provider', 'admin'].includes(role)) throw new Error('invalid role');
    const user = this.users[uid];
    if (!user) return null;
    user.role = role;
    await this.store.flush();
    return user;
  }

  async setWalletAddress(uid, address) {
    const user = this.users[uid];
    if (!user) return null;
    user.walletAddress = address;
    await this.store.flush();
    return user;
  }

  async setWallet(uid, wallet) {
    const user = this.users[uid];
    if (!user) return null;
    user.wallet = wallet;
    user.balance = wallet.balance || 0;
    await this.store.flush();
    return user;
  }

  async setBalance(uid, balance) {
    const user = this.users[uid];
    if (!user) return null;
    user.balance = balance;
    await this.store.flush();
    return user;
  }

  todayBucket() {
    return new Date().toISOString().slice(0, 10);
  }

  async recordUsage(uid, { amount = 0 } = {}) {
    const user = this.users[uid];
    if (!user) return;
    const today = this.todayBucket();
    if (user.usage.today.date !== today) {
      user.usage.today = { date: today, tasks: 0, spent: 0 };
    }
    user.usage.today.tasks += 1;
    user.usage.today.spent = Number((user.usage.today.spent + amount).toFixed(6));
    user.usage.tasks += 1;
    user.usage.totalSpent = Number((user.usage.totalSpent + amount).toFixed(6));
    await this.store.flush();
  }

  checkQuota(user) {
    const today = this.todayBucket();
    const usageToday = user.usage.today.date === today ? user.usage.today : { tasks: 0, spent: 0 };
    if (usageToday.tasks >= config.clients.defaultDailyQuota) {
      return { ok: false, reason: `daily quota exceeded (${config.clients.defaultDailyQuota} tasks)` };
    }
    if (user.usage.totalSpent >= config.clients.defaultMonthlyBudget) {
      return { ok: false, reason: `monthly budget exceeded (${config.clients.defaultMonthlyBudget} USDC)` };
    }
    return { ok: true };
  }

  list() {
    return Object.values(this.users);
  }
}

export default new UserStore();
