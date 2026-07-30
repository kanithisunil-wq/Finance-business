const express = require('express');
const pool = require('../config/db');
const requireAuth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
router.use(requireAuth);

// Balance formula shared across endpoints:
// current balance = initial_loan_amount + SUM(ADD) - SUM(MINUS)
const BALANCE_SELECT = `
  c.id, c.name, c.mobile_number, c.national_id_number, c.customer_photo,
  c.initial_loan_amount, c.created_at,
  (c.initial_loan_amount +
    COALESCE(SUM(CASE WHEN t.type = 'ADD' THEN t.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN t.type = 'MINUS' THEN t.amount ELSE 0 END), 0)
  ) AS total_amount
`;

// ---------------------------------------------------------
// GET /api/customers  — list all customers for logged-in user
// ---------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${BALANCE_SELECT}
       FROM customers c
       LEFT JOIN transactions t ON t.customer_id = c.id
       WHERE c.user_id = ?
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load customers.' });
  }
});

// ---------------------------------------------------------
// GET /api/customers/:id  — single customer details
// ---------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${BALANCE_SELECT}
       FROM customers c
       LEFT JOIN transactions t ON t.customer_id = c.id
       WHERE c.id = ? AND c.user_id = ?
       GROUP BY c.id`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Customer not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load customer.' });
  }
});

// ---------------------------------------------------------
// GET /api/customers/:id/transactions
// ---------------------------------------------------------
router.get('/:id/transactions', async (req, res) => {
  try {
    const [customerRows] = await pool.query(
      `SELECT ${BALANCE_SELECT}
       FROM customers c
       LEFT JOIN transactions t ON t.customer_id = c.id
       WHERE c.id = ? AND c.user_id = ?
       GROUP BY c.id`,
      [req.params.id, req.user.id]
    );
    if (!customerRows.length) return res.status(404).json({ error: 'Customer not found.' });

    const [transactions] = await pool.query(
      `SELECT id, type, amount, transaction_date
       FROM transactions
       WHERE customer_id = ?
       ORDER BY transaction_date DESC, id DESC`,
      [req.params.id]
    );

    res.json({ customer: customerRows[0], transactions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load transaction history.' });
  }
});

// ---------------------------------------------------------
// POST /api/customers  — add customer (multipart form, "photo" field)
// ---------------------------------------------------------
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { name, mobile_number, national_id_number, initial_loan_amount } = req.body;
    if (!name || !mobile_number || !national_id_number) {
      return res.status(400).json({ error: 'Name, mobile number and national ID are required.' });
    }

    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;
    const loanAmount = parseFloat(initial_loan_amount) || 0;

    const [result] = await pool.query(
      `INSERT INTO customers
        (user_id, name, mobile_number, national_id_number, customer_photo, initial_loan_amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, name, mobile_number, national_id_number, photoPath, loanAmount]
    );

    res.status(201).json({ id: result.insertId, message: 'Customer added.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add customer.' });
  }
});

// ---------------------------------------------------------
// DELETE /api/customers  — bulk delete, body: { ids: [1,2,3] }
// ---------------------------------------------------------
router.delete('/', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: 'Provide an array of customer ids to remove.' });
    }

    const placeholders = ids.map(() => '?').join(',');
    await pool.query(
      `DELETE FROM customers WHERE id IN (${placeholders}) AND user_id = ?`,
      [...ids, req.user.id]
    );

    res.json({ message: 'Customer(s) removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not remove customer(s).' });
  }
});

module.exports = router;
