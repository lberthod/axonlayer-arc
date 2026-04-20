import { Router } from 'express';
import providerStore from '../core/providerStore.js';
import userStore from '../core/userStore.js';
import agentRegistry from '../core/agentRegistry.js';
import { requireAuth, requireAdmin } from '../core/auth.js';
import { config } from '../config.js';

const router = Router();

router.get('/', async (req, res) => {
  const status = req.query.status || 'approved';
  const providers = providerStore.list({ status });
  res.json(providers);
});

router.get('/mine', requireAuth, (req, res) => {
  res.json(providerStore.list({ ownerUid: req.user.uid }));
});

router.get('/:id', (req, res) => {
  const p = providerStore.get(req.params.id);
  if (!p) return res.status(404).json({ error: 'not found' });
  res.json(p);
});

router.post('/', requireAuth, async (req, res) => {
  const provider = await providerStore.register(req.user.uid, req.body || {});
  // Automatically promote to provider role
  if (req.user.role === 'user') {
    await userStore.setRole(req.user.uid, 'provider');
  }
  res.status(201).json(provider);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const isAdmin = req.role === 'admin';
  const provider = await providerStore.update(
    req.params.id,
    req.body || {},
    isAdmin ? {} : { ownerUid: req.user.uid }
  );
  if (!provider) return res.status(404).json({ error: 'not found or forbidden' });
  res.json(provider);
});

router.post('/:id/stake', requireAuth, async (req, res) => {
  const amount = Number(req.body?.amount);
  if (!(amount > 0)) return res.status(400).json({ error: 'amount must be positive' });
  const provider = providerStore.get(req.params.id);
  if (!provider) return res.status(404).json({ error: 'not found' });
  if (provider.ownerUid !== req.user.uid && req.role !== 'admin') {
    return res.status(403).json({ error: 'not your provider' });
  }
  const updated = await providerStore.addStake(req.params.id, amount);
  if (updated.stake >= config.marketplace.minStake && updated.status === 'slashed') {
    await providerStore.setStatus(req.params.id, 'pending');
  }
  res.json(updated);
});

router.post('/:id/approve', requireAdmin, async (req, res) => {
  const provider = await providerStore.setStatus(req.params.id, 'approved');
  if (!provider) return res.status(404).json({ error: 'not found' });
  await agentRegistry.hydrateFromProviders();
  res.json(provider);
});

router.post('/:id/reject', requireAdmin, async (req, res) => {
  const provider = await providerStore.setStatus(req.params.id, 'rejected');
  if (!provider) return res.status(404).json({ error: 'not found' });
  await agentRegistry.hydrateFromProviders();
  res.json(provider);
});

router.post('/:id/slash', requireAdmin, async (req, res) => {
  const { amount, reason } = req.body || {};
  const result = await providerStore.slash(req.params.id, amount, reason);
  if (!result) return res.status(404).json({ error: 'not found' });
  await agentRegistry.hydrateFromProviders();
  res.json(result);
});

export default router;
