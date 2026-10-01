const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');

/**
 * POST /api/auth/login
 * Verifies email + password against password_hash.
 * On success, populates req.session.user = { id, name, email, role }.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Body validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Fetch user and join with roles table to get role name
    const userQuery = `
      SELECT u.id, u.name, u.email, u.password_hash, u.is_active, r.name AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE LOWER(u.email) = LOWER($1)
    `;
    const result = await db.query(userQuery, [email.trim()]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(401).json({ error: "Account is inactive" });
    }

    // Verify password with bcrypt
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Populate session user object
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/auth/logout
 * Destroys user session and clears cookie.
 */
router.post('/logout', (req, res) => {
  if (!req.session) {
    return res.status(200).json({ message: "Logged out" });
  }

  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: "Could not log out, please try again" });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ message: "Logged out" });
  });
});

/**
 * GET /api/auth/me
 * Returns currently authenticated user session object.
 */
router.get('/me', requireAuth, (req, res) => {
  return res.status(200).json({ user: req.session.user });
});

module.exports = router;
