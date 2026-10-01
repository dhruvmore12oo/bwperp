const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requirePermission = require('../middleware/requirePermission');

const VALID_STATUSES = ['queued', 'in_progress', 'qc', 'done', 'cancelled'];

/**
 * GET /api/manufacturing-jobs
 * requirePermission('manufacturing', 'view')
 * 200: manufacturing_jobs JOIN sales_orders for order_code + customer_name
 */
router.get('/', requireAuth, requirePermission('manufacturing', 'view'), async (req, res) => {
  try {
    const query = `
      SELECT 
        mj.id,
        mj.sales_order_id,
        mj.status,
        mj.created_at,
        mj.created_at AS updated_at,
        so.order_code,
        so.customer_name
      FROM manufacturing_jobs mj
      JOIN sales_orders so ON mj.sales_order_id = so.id
      ORDER BY mj.created_at DESC, mj.id DESC
    `;
    const result = await db.query(query);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching manufacturing jobs:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/manufacturing-jobs
 * requirePermission('manufacturing', 'edit')
 * Body: { sales_order_id }
 * 201: created job (status defaults 'queued')
 */
router.post('/', requireAuth, requirePermission('manufacturing', 'edit'), async (req, res) => {
  try {
    const { sales_order_id } = req.body;

    if (!sales_order_id) {
      return res.status(400).json({ error: "sales_order_id is required" });
    }

    // Verify sales order exists
    const orderCheck = await db.query(`SELECT id FROM sales_orders WHERE id = $1`, [sales_order_id]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: "Sales order not found" });
    }

    const insertQuery = `
      INSERT INTO manufacturing_jobs (sales_order_id, status)
      VALUES ($1, 'queued')
      RETURNING id, sales_order_id, status, created_at
    `;
    const result = await db.query(insertQuery, [sales_order_id]);

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating manufacturing job:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/manufacturing-jobs/:id/status
 * requirePermission('manufacturing', 'edit')
 * Body: { status }
 * 200: { id, status } — if status becomes 'done', advance the linked sales_order stage to 'qc'
 */
router.patch('/:id/status', requireAuth, requirePermission('manufacturing', 'edit'), async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}` });
    }

    await client.query('BEGIN');

    const updateJobQuery = `
      UPDATE manufacturing_jobs
      SET status = $1
      WHERE id = $2
      RETURNING id, sales_order_id, status
    `;
    const jobResult = await client.query(updateJobQuery, [status, id]);

    if (jobResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Manufacturing job not found" });
    }

    const updatedJob = jobResult.rows[0];

    // Side effect: if status becomes 'done', advance linked sales_order stage to 'qc'
    if (status === 'done' && updatedJob.sales_order_id) {
      await client.query(
        `UPDATE sales_orders SET stage = 'qc' WHERE id = $1`,
        [updatedJob.sales_order_id]
      );
    }

    await client.query('COMMIT');

    return res.status(200).json({
      id: updatedJob.id,
      status: updatedJob.status
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating manufacturing job status:', err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

module.exports = router;
