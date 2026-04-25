import express from 'express';
import paymentAdapter from '../core/paymentAdapter.js';
import { authMiddleware } from '../core/auth.js';
import userStore from '../core/userStore.js';

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

// Fund user's personal treasury from their wallet
router.post('/fund-treasury', authMiddleware, async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const { amount, from } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!from) {
      return res.status(400).json({ error: 'Missing from address' });
    }

    // Get user's personal treasury wallet
    const user = userStore.getByUid(uid);
    if (!user || !user.treasuryWallet) {
      return res.status(400).json({ error: 'User has no treasury wallet' });
    }

    const treasuryAddress = user.treasuryWallet.address;

    // Transfer USDC from user wallet to their personal treasury
    const result = await paymentAdapter.transfer(
      from,
      treasuryAddress,
      Number(amount),
      'User fund to personal treasury',
      null,
      'treasury_funding'
    );

    res.json({
      success: true,
      transaction: result,
      message: `Transferred ${amount} USDC to your treasury`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
