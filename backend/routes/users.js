const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requirePermission = require('../middleware/requirePermission');

/**
 * GET /api/users
 * requirePermission('users', 'view')
 * 200: users rows joined with role name (never return password_hash)
 */
router.get('/', requireAuth, requirePermission('users', 'view'), async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.name, u.email, u.is_active, u.created_at, r.name AS role
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.id ASC
    `;
    const result = await db.query(query);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/users
 * requirePermission('users', 'create')
 * Body: { name, email, password, role } — hash password with bcrypt before storing
 * 201: created user (no password_hash in response)
 */
router.post('/', requireAuth, requirePermission('users', 'create'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "name, email, password, and role are required" });
    }

    // Look up role ID from roles table
    const roleQuery = `SELECT id, name FROM roles WHERE LOWER(name) = LOWER($1) OR id::text = $1`;
    const roleResult = await db.query(roleQuery, [String(role).trim()]);

    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: "Invalid role specified. Allowed: admin, manager, staff" });
    }

    const roleId = roleResult.rows[0].id;
    const roleName = roleResult.rows[0].name;

    // Hash password with bcrypt
    const password_hash = await bcrypt.hash(password, 10);

    const insertUserQuery = `
      INSERT INTO users (name, email, password_hash, role_id, is_active)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, name, email, is_active, created_at
    `;
    const userResult = await db.query(insertUserQuery, [
      name.trim(),
      email.trim().toLowerCase(),
      password_hash,
      roleId
    ]);

    const createdUser = userResult.rows[0];

    return res.status(201).json({
      ...createdUser,
      role: roleName
    });
  } catch (err) {
    console.error('Error creating user:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: "Email address already registered" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/users/:id
 * requirePermission('users', 'edit')
 * Body: { is_active?, role? }
 * 200: updated user (no password_hash)
 */
router.patch('/:id', requireAuth, requirePermission('users', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active, role } = req.body;

    if (is_active === undefined && role === undefined) {
      return res.status(400).json({ error: "Provide at least is_active or role to update" });
    }

    let roleId = null;
    let roleName = null;

    if (role !== undefined) {
      const roleQuery = `SELECT id, name FROM roles WHERE LOWER(name) = LOWER($1) OR id::text = $1`;
      const roleResult = await db.query(roleQuery, [String(role).trim()]);

      if (roleResult.rows.length === 0) {
        return res.status(400).json({ error: "Invalid role specified" });
      }

      roleId = roleResult.rows[0].id;
      roleName = roleResult.rows[0].name;
    }

    // Build dynamic UPDATE query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(Boolean(is_active));
    }

    if (roleId !== null) {
      updates.push(`role_id = $${paramIndex++}`);
      values.push(roleId);
    }

    values.push(id); // for WHERE id = $paramIndex

    const updateQuery = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, email, is_active, role_id, created_at
    `;

    const result = await db.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = result.rows[0];

    // Fetch updated role name if not set
    if (!roleName) {
      const roleRes = await db.query(`SELECT name FROM roles WHERE id = $1`, [updatedUser.role_id]);
      roleName = roleRes.rows[0]?.name;
    }

    delete updatedUser.role_id;

    return res.status(200).json({
      ...updatedUser,
      role: roleName
    });
  } catch (err) {
    console.error('Error updating user:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
