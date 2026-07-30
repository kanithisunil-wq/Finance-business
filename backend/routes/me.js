const express = require('express');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /api/me — returns the logged-in user from a valid JWT.
// Used by the frontend on page load to confirm the stored token is still valid.
router.get('/', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
