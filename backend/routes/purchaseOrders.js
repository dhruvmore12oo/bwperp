const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requirePermission = require('../middleware/requirePermission');

const VALID_STATUSES = ['pending', 'received', 'cancelled'];

/**
 * GET /api/purchase-orders
 * requirePermission('purchase_orders', 'view')
 * 200: array of purchase_orders rows
 */
router.get('/', requireAuth, requirePermission('purchase_orders', 'view'), async (req, res) => {
  try {
    const query = `
      SELECT id, po_code, supplier_name, linked_sales_order_id, status, created_by, created_at
      FROM purchase_orders
      ORDER BY created_at DESC, id DESC
    `;
    const result = await db.query(query);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching purchase orders:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/purchase-orders
 * requirePermission('purchase_orders', 'create')
 * Body: { po_code, supplier_name, linked_sales_order_id }
 * created_by = req.session.user.id, status defaults 'pending'
 * 201: created PO
 * Side effect: if the linked sales order's stage is 'demand', update it to 'procurement'
 */
router.post('/', requireAuth, requirePermission('purchase_orders', 'create'), async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { po_code, supplier_name, linked_sales_order_id } = req.body;

    if (!po_code || !supplier_name) {
      return res.status(400).json({ error: "po_code and supplier_name are required" });
    }

    const created_by = req.session.user.id;

    await client.query('BEGIN');

    // Insert purchase order
    const insertPoQuery = `
      INSERT INTO purchase_orders (po_code, supplier_name, linked_sales_order_id, status, created_by)
      VALUES ($1, $2, $3, 'pending', $4)
      RETURNING id, po_code, supplier_name, linked_sales_order_id, status, created_by, created_at
    `;
    const poResult = await client.query(insertPoQuery, [
      po_code.trim(),
      supplier_name.trim(),
      linked_sales_order_id || null,
      created_by
    ]);

    const createdPo = poResult.rows[0];

    // Side effect: if linked_sales_order_id present and stage is 'demand', update it to 'procurement'
    if (linked_sales_order_id) {
      const updateSalesOrderQuery = `
        UPDATE sales_orders
        SET stage = 'procurement'
        WHERE id = $1 AND stage = 'demand'
      `;
      await client.query(updateSalesOrderQuery, [linked_sales_order_id]);
    }

    await client.query('COMMIT');

    return res.status(201).json(createdPo);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating purchase order:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: "Purchase order code already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

/**
 * PATCH /api/purchase-orders/:id/status
 * requirePermission('purchase_orders', 'approve')
 * Body: { status }
 * 200: { id, status }
 * Side effect: if status becomes 'received', check if the linked sales_order has no other
 * 'pending' purchase_orders remaining, advance its stage to 'production'
 */
router.patch('/:id/status', requireAuth, requirePermission('purchase_orders', 'approve'), async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed values: ${VALID_STATUSES.join(', ')}` });
    }

    await client.query('BEGIN');

    const updatePoQuery = `
      UPDATE purchase_orders
      SET status = $1
      WHERE id = $2
      RETURNING id, po_code, supplier_name, linked_sales_order_id, status
    `;
    const poResult = await client.query(updatePoQuery, [status, id]);

    if (poResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: "Purchase order not found" });
    }

    const updatedPo = poResult.rows[0];

    // Side effect check: if status becomes 'received'
    if (status === 'received' && updatedPo.linked_sales_order_id) {
      const checkPendingQuery = `
        SELECT COUNT(*)::int AS pending_count
        FROM purchase_orders
        WHERE linked_sales_order_id = $1 AND status = 'pending'
      `;
      const pendingResult = await client.query(checkPendingQuery, [updatedPo.linked_sales_order_id]);
      const pendingCount = pendingResult.rows[0]?.pending_count || 0;

      // If no other pending POs remain for this sales order, advance stage to 'production'
      if (pendingCount === 0) {
        await client.query(
          `UPDATE sales_orders SET stage = 'production' WHERE id = $1`,
          [updatedPo.linked_sales_order_id]
        );
      }
    }

    await client.query('COMMIT');

    return res.status(200).json({
      id: updatedPo.id,
      status: updatedPo.status
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating purchase order status:', err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

module.exports = router;
