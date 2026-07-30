const express = require('express');
const pool = require('../config/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ---------------------------------------------------------
// POST /api/transactions
// body: { customer_id, type: 'ADD'|'MINUS', amount, transaction_date? }
// ---------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { customer_id, type, amount, transaction_date } = req.body;

    if (!customer_id || !type || amount === undefined) {
      return res.status(400).json({ error: 'customer_id, type and amount are required.' });
    }
    if (!['ADD', 'MINUS'].includes(type)) {
      return res.status(400).json({ error: "type must be 'ADD' or 'MINUS'." });
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number.' });
    }

    // Ownership check
    const [owned] = await pool.query(
      'SELECT id FROM customers WHERE id = ? AND user_id = ?',
      [customer_id, req.user.id]
    );
    if (!owned.length) return res.status(404).json({ error: 'Customer not found.' });

    const [result] = await pool.query(
      `INSERT INTO transactions (customer_id, type, amount, transaction_date)
       VALUES (?, ?, ?, ?)`,
      [customer_id, type, numAmount, transaction_date || new Date()]
    );

    res.status(201).json({ id: result.insertId, message: 'Transaction recorded.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not record transaction.' });
  }
});

module.exports = router;
