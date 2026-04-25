import express from 'express';
import paymentAdapter from '../core/paymentAdapter.js';
import { authMiddleware } from '../core/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filters = {};

    if (req.query.taskId) {
      filters.taskId = req.query.taskId;
    }

    if (req.query.wallet) {
      filters.wallet = req.query.wallet;
    }

    if (req.query.latest) {
      filters.latest = parseInt(req.query.latest);
    }

    const transactions = await paymentAdapter.getTransactions(filters);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fund treasury from user wallet
router.post('/fund-treasury', authMiddleware, async (req, res, next) => {
  try {
    const { amount, from, to } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!from || !to) {
      return res.status(400).json({ error: 'Missing from or to address' });
    }

    // Transfer USDC from user wallet to treasury
    const result = await paymentAdapter.transfer(
      from,
      to,
      Number(amount),
      'User fund to treasury',
      null,
      'treasury_funding'
    );

    res.json({
      success: true,
      transaction: result,
      message: `Transferred ${amount} USDC to treasury`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
