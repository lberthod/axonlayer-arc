import express from 'express';
import paymentAdapter from '../core/paymentAdapter.js';

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

export default router;
