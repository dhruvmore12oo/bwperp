const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requirePermission = require('../middleware/requirePermission');

/**
 * GET /api/reports/summary
 * requirePermission('reports', 'view')
 * 200: { ordersByStage: <GROUP BY stage count>, totalRevenue: <SUM(total_value) WHERE stage='delivered'>, topCustomers: <top 5 by SUM(total_value) GROUP BY customer_name> }
 */
router.get('/summary', requireAuth, requirePermission('reports', 'view'), async (req, res) => {
  try {
    // 1. Orders grouped by stage with count
    const ordersByStageQuery = `
      SELECT stage, COUNT(*)::int AS count
      FROM sales_orders
      GROUP BY stage
      ORDER BY count DESC
    `;
    const ordersByStageResult = await db.query(ordersByStageQuery);

    // 2. Total revenue for delivered orders
    const totalRevenueQuery = `
      SELECT COALESCE(SUM(total_value), 0)::numeric AS total_revenue
      FROM sales_orders
      WHERE stage = 'delivered'
    `;
    const totalRevenueResult = await db.query(totalRevenueQuery);
    const totalRevenue = parseFloat(totalRevenueResult.rows[0]?.total_revenue || 0);

    // 3. Top 5 customers by SUM(total_value)
    const topCustomersQuery = `
      SELECT customer_name, SUM(total_value)::numeric AS total_spent
      FROM sales_orders
      GROUP BY customer_name
      ORDER BY total_spent DESC
      LIMIT 5
    `;
    const topCustomersResult = await db.query(topCustomersQuery);
    const topCustomers = topCustomersResult.rows.map(row => ({
      customer_name: row.customer_name,
      total_spent: parseFloat(row.total_spent || 0)
    }));

    return res.status(200).json({
      ordersByStage: ordersByStageResult.rows,
      totalRevenue,
      topCustomers
    });
  } catch (err) {
    console.error('Error fetching reports summary:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
