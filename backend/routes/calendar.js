const express = require('express');
const pool = require('../config/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ---------------------------------------------------------
// GET /api/calendar/summary?month=YYYY-MM
// Returns which dates in the month have at least one transaction,
// used to mark days on the calendar widget.
// ---------------------------------------------------------
router.get('/summary', async (req, res) => {
  try {
    const month = req.query.month; // "YYYY-MM"
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Provide month as YYYY-MM.' });
    }

    const [rows] = await pool.query(
      `SELECT DATE(t.transaction_date) AS day, COUNT(*) AS count
       FROM transactions t
       JOIN customers c ON c.id = t.customer_id
       WHERE c.user_id = ? AND DATE_FORMAT(t.transaction_date, '%Y-%m') = ?
       GROUP BY DATE(t.transaction_date)`,
      [req.user.id, month]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load calendar summary.' });
  }
});

// ---------------------------------------------------------
// GET /api/calendar/:date  (date = YYYY-MM-DD)
// All transactions on that date, across all of this user's customers.
// ---------------------------------------------------------
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Date must be in YYYY-MM-DD format.' });
    }

    const [rows] = await pool.query(
      `SELECT t.id, t.type, t.amount, t.transaction_date, c.name AS customer_name, c.id AS customer_id
       FROM transactions t
       JOIN customers c ON c.id = t.customer_id
       WHERE c.user_id = ? AND DATE(t.transaction_date) = ?
       ORDER BY t.transaction_date DESC`,
      [req.user.id, date]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load transactions for that date.' });
  }
});

module.exports = router;
