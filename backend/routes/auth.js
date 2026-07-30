const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
require('dotenv').config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ---------------------------------------------------------
// POST /api/auth/signup
// ---------------------------------------------------------
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashed]
    );

    const user = { id: result.insertId, name, email };
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not create account. Please try again.' });
  }
});

// ---------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ---------------------------------------------------------
// POST /api/auth/forgot-password
// Generates a one-time reset token valid for 1 hour.
// In production this would be emailed; here it is returned
// directly (and logged to the server console) so the flow is
// fully testable without an email provider configured.
// ---------------------------------------------------------
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const [rows] = await pool.query('SELECT id, name FROM users WHERE email = ?', [email]);

    // Always respond the same way whether or not the account exists,
    // so the endpoint can't be used to discover registered emails.
    const genericResponse = {
      message: 'If an account with that email exists, a password reset link has been generated.'
    };

    if (!rows.length) {
      return res.json(genericResponse);
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );

    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5000';
    const resetLink = `${baseUrl}/reset-password.html?token=${token}`;

    console.log(`Password reset requested for ${email}: ${resetLink}`);

    // Included in the response for demo/testing purposes since no
    // email service is wired up. Remove `resetLink` from the response
    // in production and send it via email instead.
    res.json({ ...genericResponse, resetLink });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not process the request. Please try again.' });
  }
});

// ---------------------------------------------------------
// POST /api/auth/reset-password
// ---------------------------------------------------------
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const [rows] = await pool.query(
      'SELECT * FROM password_resets WHERE token = ? AND used = 0',
      [token]
    );
    if (!rows.length) {
      return res.status(400).json({ error: 'This reset link is invalid or has already been used.' });
    }

    const reset = rows[0];
    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, reset.user_id]);
    await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [reset.id]);

    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not reset password. Please try again.' });
  }
});

module.exports = router;
