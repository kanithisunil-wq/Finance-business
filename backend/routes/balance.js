const express = require('express');
const pool = require('../config/db');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// ---------------------------------------------------------
// GET /api/balance
// Dashboard summary for the logged-in user:
//  - total_customers
//  - total_loan_amount   : SUM(initial_loan_amount)
//  - total_profit        : SUM(ADD transactions) — money added on top
//                           of the original loan across all customers
//  - net_outstanding_amount : total_loan_amount + total ADD - total MINUS
//                              i.e. what is still owed across all customers
// ---------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const [[counts]] = await pool.query(
      'SELECT COUNT(*) AS total_customers, COALESCE(SUM(initial_loan_amount),0) AS total_loan_amount FROM customers WHERE user_id = ?',
      [req.user.id]
    );

    const [[sums]] = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN t.type = 'ADD' THEN t.amount ELSE 0 END), 0) AS total_added,
         COALESCE(SUM(CASE WHEN t.type = 'MINUS' THEN t.amount ELSE 0 END), 0) AS total_repaid
       FROM transactions t
       JOIN customers c ON c.id = t.customer_id
       WHERE c.user_id = ?`,
      [req.user.id]
    );

    const totalLoanAmount = parseFloat(counts.total_loan_amount);
    const totalAdded = parseFloat(sums.total_added);
    const totalRepaid = parseFloat(sums.total_repaid);
    const netOutstanding = totalLoanAmount + totalAdded - totalRepaid;

    res.json({
      total_customers: counts.total_customers,
      total_loan_amount: totalLoanAmount,
      total_profit: totalAdded,
      net_outstanding_amount: netOutstanding
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load balance summary.' });
  }
});

module.exports = router;
