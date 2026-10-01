const express = require('express');
const router = express.Router();
const db = require('../db');
const requireAuth = require('../middleware/requireAuth');
const requirePermission = require('../middleware/requirePermission');

/**
 * GET /api/inventory
 * requirePermission('inventory', 'view')
 * 200: inventory_items rows, each with a computed low_stock: quantity_on_hand <= reorder_point
 */
router.get('/', requireAuth, requirePermission('inventory', 'view'), async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        sku, 
        name, 
        quantity_on_hand, 
        reorder_point, 
        unit_price, 
        'units' AS unit,
        created_at,
        (quantity_on_hand <= reorder_point) AS low_stock
      FROM inventory_items
      ORDER BY name ASC
    `;
    const result = await db.query(query);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error fetching inventory items:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PATCH /api/inventory/:id
 * requirePermission('inventory', 'edit')
 * Body: { quantity_on_hand }
 * 200: updated row
 */
router.patch('/:id', requireAuth, requirePermission('inventory', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity_on_hand } = req.body;

    if (quantity_on_hand === undefined || isNaN(quantity_on_hand) || quantity_on_hand < 0) {
      return res.status(400).json({ error: "Valid non-negative quantity_on_hand is required" });
    }

    const updateQuery = `
      UPDATE inventory_items
      SET quantity_on_hand = $1
      WHERE id = $2
      RETURNING id, sku, name, quantity_on_hand, reorder_point, unit_price, 'units' AS unit, created_at,
                (quantity_on_hand <= reorder_point) AS low_stock
    `;
    const result = await db.query(updateQuery, [quantity_on_hand, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error updating inventory item:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
