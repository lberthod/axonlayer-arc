import { Router } from 'express';
import userStore from '../core/userStore.js';
import providerStore from '../core/providerStore.js';
import metricsEngine from '../core/metricsEngine.js';
import { requireAdmin } from '../core/auth.js';
import { config } from '../config.js';

const router = Router();

router.use(requireAdmin);

router.get('/overview', async (req, res) => {
  const users = userStore.list();
  const providers = Object.values(providerStore.providers);
  const metrics = await metricsEngine.compute({});

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const totalSpent = users.reduce((sum, u) => sum + (u.usage?.totalSpent || 0), 0);
  const totalStake = providers.reduce((sum, p) => sum + (p.stake || 0), 0);
  const totalSlashed = providers.reduce((sum, p) => sum + (p.stats?.slashed || 0), 0);

  // CAC/LTV rough proxy: assume CAC = 0, LTV = avg totalSpent per user
  const activeUsers = users.filter((u) => (u.usage?.tasks || 0) > 0);
  const avgLtv = activeUsers.length ? Number((totalSpent / activeUsers.length).toFixed(6)) : 0;

  res.json({
    counts: {
      users: users.length,
      byRole: roleCounts,
      providers: providers.length,
      approvedProviders: providers.filter((p) => p.status === 'approved').length,
      pendingProviders: providers.filter((p) => p.status === 'pending').length
    },
    economics: {
      grossVolume: metrics.totals.grossVolume,
      totalClientSpend: Number(totalSpent.toFixed(6)),
      totalStake: Number(totalStake.toFixed(6)),
      totalSlashed: Number(totalSlashed.toFixed(6)),
      avgLtv,
      orchestratorRevenue: metrics.revenueByWallet?.orchestrator_wallet || 0
    },
    tasks: metrics.totals,
    marketplace: {
      minStake: config.marketplace.minStake,
      slashPenalty: config.marketplace.slashPenalty
    }
  });
});

router.get('/users', (req, res) => {
  res.json(userStore.list().map((u) => ({
    uid: u.uid,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    walletAddress: u.walletAddress,
    usage: u.usage,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt
  })));
});

router.post('/users/:uid/role', async (req, res) => {
  const user = await userStore.setRole(req.params.uid, req.body?.role);
  if (!user) return res.status(404).json({ error: 'not found' });
  res.json(user);
});

router.get('/providers', (req, res) => {
  const status = req.query.status;
  res.json(providerStore.list(status ? { status } : {}));
});

export default router;
