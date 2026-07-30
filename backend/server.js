require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
// Added Extra
const cors = require("cors");

// Allow requests from any origin during setup, or restrict to your Vercel URL
app.use(cors());

const authRoutes = require('./routes/auth');
const meRoutes = require('./routes/me');
const customerRoutes = require('./routes/customers');
const transactionRoutes = require('./routes/transactions');
const calendarRoutes = require('./routes/calendar');
const balanceRoutes = require('./routes/balance');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded customer photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/balance', balanceRoutes);

// Serve the static frontend
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// Fallback to login page for unknown top-level routes (simple multi-page app)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
  res.sendFile(path.join(frontendDir, 'index.html'), (err) => {
    if (err) next();
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Something went wrong.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Finance Tracker API running on http://localhost:${PORT}`);
});
