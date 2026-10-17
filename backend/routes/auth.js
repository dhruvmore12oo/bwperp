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
 * POST /api/auth/register (and alias /signup)
 * Creates a new user account, associates the chosen role,
 * and establishes a session for immediate login.
 */
const handleRegister = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Name, email, password, and role are required" });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedRole = String(role).trim().toLowerCase();

    // Validate that role is one of the three database roles
    if (!['admin', 'manager', 'staff'].includes(trimmedRole)) {
      return res.status(400).json({ error: "Role must be 'admin', 'manager', or 'staff'" });
    }

    // Check if email already exists
    const checkQuery = `SELECT id FROM users WHERE LOWER(email) = $1`;
    const checkResult = await db.query(checkQuery, [trimmedEmail]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ error: "An account with this email address already exists" });
    }

    // Fetch corresponding role_id from database
    const roleQuery = `SELECT id, name FROM roles WHERE LOWER(name) = $1`;
    const roleResult = await db.query(roleQuery, [trimmedRole]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: "Specified role does not exist in database" });
    }
    const roleId = roleResult.rows[0].id;

    // Hash password with bcrypt salt rounds = 10
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user record with active status
    const insertUserQuery = `
      INSERT INTO users (name, email, password_hash, role_id, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, name, email, is_active, created_at
    `;
    const insertResult = await db.query(insertUserQuery, [
      name.trim(),
      trimmedEmail,
      password_hash,
      roleId
    ]);

    const createdUser = insertResult.rows[0];

    // Auto-login newly registered user by creating session
    req.session.user = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      role: trimmedRole
    };

    return res.status(201).json({
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        role: trimmedRole
      },
      message: "Account registered successfully"
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: "An account with this email address already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
};

router.post('/register', handleRegister);
router.post('/signup', handleRegister);

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
