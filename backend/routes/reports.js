const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requirePermission = require('../middleware/requirePermission');

/**
 * GET /api/reports/summary
 * requirePermission('reports', 'view')
 * 200: {
 *   ordersByStage: { demand: n, procurement: n, production: n, qc: n, delivered: n, cancelled: n },
 *   totalRevenue: number,
 *   topCustomers: [{ customer_name, total_value }]
 * }
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
    
    // Convert array to object map per API contract spec
    const ordersByStage = {
      demand: 0,
      procurement: 0,
      production: 0,
      qc: 0,
      delivered: 0,
      on_hold: 0,
      cancelled: 0,
    };
    ordersByStageResult.rows.forEach((row) => {
      ordersByStage[row.stage] = parseInt(row.count, 10);
    });

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
      SELECT customer_name, SUM(total_value)::numeric AS total_value
      FROM sales_orders
      GROUP BY customer_name
      ORDER BY total_value DESC
      LIMIT 5
    `;
    const topCustomersResult = await db.query(topCustomersQuery);
    const topCustomers = topCustomersResult.rows.map(row => ({
      customer_name: row.customer_name,
      total_value: parseFloat(row.total_value || 0)
    }));

    return res.status(200).json({
      ordersByStage,
      totalRevenue,
      topCustomers
    });
  } catch (err) {
    console.error('Error fetching reports summary:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
