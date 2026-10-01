const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requirePermission = require('../middleware/requirePermission');

/**
 * GET /api/dashboard
 * Protected by requireAuth + requirePermission('dashboard', 'view')
 * Returns open orders count, low stock items count, and latest 5 sales orders.
 */
router.get('/', requireAuth, requirePermission('dashboard', 'view'), async (req, res) => {
  try {
    // 1. Open orders count (stage NOT IN 'delivered')
    const openOrdersQuery = `
      SELECT COUNT(*)::int AS count
      FROM sales_orders
      WHERE stage NOT IN ('delivered')
    `;
    const openOrdersResult = await db.query(openOrdersQuery);
    const openOrders = openOrdersResult.rows[0]?.count || 0;

    // 2. Low stock count (quantity_on_hand <= reorder_point)
    const lowStockQuery = `
      SELECT COUNT(*)::int AS count
      FROM inventory_items
      WHERE quantity_on_hand <= reorder_point
    `;
    const lowStockResult = await db.query(lowStockQuery);
    const lowStockCount = lowStockResult.rows[0]?.count || 0;

    // 3. Recent orders (latest 5 sales_orders, newest first)
    const recentOrdersQuery = `
      SELECT id, order_code, customer_name, total_value, stage, created_by, created_at
      FROM sales_orders
      ORDER BY created_at DESC, id DESC
      LIMIT 5
    `;
    const recentOrdersResult = await db.query(recentOrdersQuery);
    const recentOrders = recentOrdersResult.rows;

    return res.status(200).json({
      openOrders,
      lowStockCount,
      recentOrders
    });
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
