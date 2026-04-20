import express from 'express';
import paymentAdapter from '../core/paymentAdapter.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const balances = await paymentAdapter.getAllBalances();
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
