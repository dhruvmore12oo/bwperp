const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requirePermission = require('../middleware/requirePermission');

const VALID_STAGES = ['demand', 'procurement', 'production', 'qc', 'delivered', 'cancelled'];

/**
 * GET /api/sales-orders
 * requirePermission('sales_orders', 'view')
 * 200: array of sales_orders rows
 */
router.get('/', requireAuth, requirePermission('sales_orders', 'view'), async (req, res) => {
  try {
    const query = `
      SELECT id, order_code, customer_name, total_value, stage, created_by, created_at
      FROM sales_orders
      ORDER BY created_at DESC, id DESC
    `;
    const result = await db.query(query);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching sales orders:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * POST /api/sales-orders
 * requirePermission('sales_orders', 'create')
 * Body: { order_code, customer_name, total_value, items: [{item_id, quantity}] }
 * Inserts into sales_orders (created_by = req.session.user.id, stage='demand')
 * then inserts each item into sales_order_items.
 * 201: created order
 */
router.post('/', requireAuth, requirePermission('sales_orders', 'create'), async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { order_code, customer_name, total_value, items } = req.body;

    // Body validation
    if (!order_code || !customer_name || total_value === undefined) {
      return res.status(400).json({ error: "order_code, customer_name, and total_value are required" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one order item is required" });
    }

    for (const item of items) {
      if (!item.item_id || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: "Each item must have a valid item_id and positive quantity" });
      }
    }

    const created_by = req.session.user.id;

    await client.query('BEGIN');

    // Insert sales_orders row
    const insertOrderQuery = `
      INSERT INTO sales_orders (order_code, customer_name, total_value, stage, created_by)
      VALUES ($1, $2, $3, 'demand', $4)
      RETURNING id, order_code, customer_name, total_value, stage, created_by, created_at
    `;
    const orderResult = await client.query(insertOrderQuery, [
      order_code.trim(),
      customer_name.trim(),
      total_value,
      created_by
    ]);

    const createdOrder = orderResult.rows[0];

    // Insert sales_order_items
    const createdItems = [];
    for (const item of items) {
      // Optional: fetch unit_price from inventory_items
      const itemPriceRes = await client.query(
        `SELECT unit_price FROM inventory_items WHERE id = $1`,
        [item.item_id]
      );
      const unit_price = itemPriceRes.rows[0]?.unit_price || 0.00;

      const insertItemQuery = `
        INSERT INTO sales_order_items (sales_order_id, item_id, quantity, unit_price)
        VALUES ($1, $2, $3, $4)
        RETURNING id, sales_order_id, item_id, quantity, unit_price
      `;
      const itemRes = await client.query(insertItemQuery, [
        createdOrder.id,
        item.item_id,
        item.quantity,
        unit_price
      ]);
      createdItems.push(itemRes.rows[0]);
    }

    await client.query('COMMIT');

    return res.status(201).json({
      ...createdOrder,
      items: createdItems
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating sales order:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: "Order code already exists" });
    }
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

/**
 * GET /api/sales-orders/:id
 * requirePermission('sales_orders', 'view')
 * 200: order + its sales_order_items joined with inventory_items for names
 */
router.get('/:id', requireAuth, requirePermission('sales_orders', 'view'), async (req, res) => {
  try {
    const { id } = req.params;

    const orderQuery = `
      SELECT id, order_code, customer_name, total_value, stage, created_by, created_at
      FROM sales_orders
      WHERE id = $1
    `;
    const orderResult = await db.query(orderQuery, [id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: "Sales order not found" });
    }

    const order = orderResult.rows[0];

    const itemsQuery = `
      SELECT 
        soi.id,
        soi.sales_order_id,
        soi.item_id,
        soi.quantity,
        soi.unit_price,
        ii.name AS item_name,
        ii.sku
      FROM sales_order_items soi
      JOIN inventory_items ii ON soi.item_id = ii.id
      WHERE soi.sales_order_id = $1
    `;
    const itemsResult = await db.query(itemsQuery, [id]);

    return res.status(200).json({
      ...order,
      items: itemsResult.rows
    });
  } catch (err) {
    console.error('Error fetching sales order by ID:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/sales-orders/:id/stage
 * requirePermission('sales_orders', 'approve')
 * Body: { stage } — validate against the CHECK constraint values
 * 200: { id, stage }
 */
router.patch('/:id/stage', requireAuth, requirePermission('sales_orders', 'approve'), async (req, res) => {
  try {
    const { id } = req.params;
    const { stage } = req.body;

    if (!stage || !VALID_STAGES.includes(stage)) {
      return res.status(400).json({ error: `Invalid stage. Allowed values: ${VALID_STAGES.join(', ')}` });
    }

    const updateQuery = `
      UPDATE sales_orders
      SET stage = $1
      WHERE id = $2
      RETURNING id, stage
    `;
    const result = await db.query(updateQuery, [stage, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Sales order not found" });
    }

    return res.status(200).json({
      id: result.rows[0].id,
      stage: result.rows[0].stage
    });
  } catch (err) {
    console.error('Error updating sales order stage:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
