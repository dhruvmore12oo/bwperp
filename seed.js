require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  const client = await db.pool.connect();
  try {
    console.log('--- Starting Database Seeding ---');

    // 1. Run schema.sql
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('✓ Schema applied successfully.');

    // 2. Insert Roles
    const rolesResult = await client.query(`
      INSERT INTO roles (name) VALUES ('admin'), ('manager'), ('staff')
      RETURNING id, name;
    `);
    const rolesMap = {};
    rolesResult.rows.forEach(r => { rolesMap[r.name] = r.id; });
    console.log('✓ Roles seeded:', Object.keys(rolesMap).join(', '));

    // 3. Insert Permissions
    const modules = ['dashboard', 'sales_orders', 'purchase_orders', 'inventory', 'manufacturing', 'reports', 'users'];
    const actions = ['view', 'create', 'edit', 'delete', 'approve'];

    const permissionsMap = [];
    for (const mod of modules) {
      for (const act of actions) {
        const res = await client.query(
          `INSERT INTO permissions (module, action) VALUES ($1, $2) RETURNING id, module, action;`,
          [mod, act]
        );
        permissionsMap.push(res.rows[0]);
      }
    }
    console.log(`✓ ${permissionsMap.length} permissions seeded.`);

    // 4. Assign Permissions to Roles
    // Admin: ALL permissions
    for (const perm of permissionsMap) {
      await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2);`, [rolesMap['admin'], perm.id]);
    }

    // Manager: View/Create/Edit/Approve on operational modules, View on reports
    for (const perm of permissionsMap) {
      if (perm.module !== 'users') {
        if (['view', 'create', 'edit', 'approve'].includes(perm.action)) {
          await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2);`, [rolesMap['manager'], perm.id]);
        }
      }
    }

    // Staff: View on dashboard, sales_orders, purchase_orders, inventory, manufacturing; Create on sales_orders
    for (const perm of permissionsMap) {
      if (perm.action === 'view' && ['dashboard', 'sales_orders', 'purchase_orders', 'inventory', 'manufacturing'].includes(perm.module)) {
        await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2);`, [rolesMap['staff'], perm.id]);
      }
      if (perm.module === 'sales_orders' && perm.action === 'create') {
        await client.query(`INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2);`, [rolesMap['staff'], perm.id]);
      }
    }
    console.log('✓ Role permissions mapped.');

    // 5. Insert Test Users
    const passwordHash = await bcrypt.hash('password123', 10);
    const usersData = [
      { name: 'Sufiyan Admin', email: 'sufiyan@brightweld.com', roleId: rolesMap['admin'] },
      { name: 'Dhruv Manager', email: 'dhruv@brightweld.com', roleId: rolesMap['manager'] },
      { name: 'Twisha Staff', email: 'twisha@brightweld.com', roleId: rolesMap['staff'] }
    ];

    const userMap = {};
    for (const u of usersData) {
      const res = await client.query(
        `INSERT INTO users (name, email, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING id, email;`,
        [u.name, u.email, passwordHash, u.roleId]
      );
      userMap[u.email] = res.rows[0].id;
    }
    console.log('✓ Test users created (Password: "password123").');

    // 6. Insert Inventory Items
    const inventoryData = [
      { sku: 'BW-WELD-01', name: 'MIG Welding Machine 250A', quantity_on_hand: 12, reorder_point: 5, unit_price: 850.00 },
      { sku: 'BW-WELD-02', name: 'TIG Welding Torch Heavy Duty', quantity_on_hand: 4, reorder_point: 10, unit_price: 120.00 }, // Low stock!
      { sku: 'BW-WIRE-01', name: 'ER70S-6 Steel Welding Wire (15kg)', quantity_on_hand: 50, reorder_point: 15, unit_price: 45.00 },
      { sku: 'BW-GAS-01', name: 'Argon Shielding Gas Cylinder 50L', quantity_on_hand: 2, reorder_point: 8, unit_price: 180.00 }, // Low stock!
      { sku: 'BW-HELM-01', name: 'Auto-Darkening Welding Helmet', quantity_on_hand: 25, reorder_point: 10, unit_price: 95.00 }
    ];

    const itemMap = {};
    for (const item of inventoryData) {
      const res = await client.query(
        `INSERT INTO inventory_items (sku, name, quantity_on_hand, reorder_point, unit_price)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, sku;`,
        [item.sku, item.name, item.quantity_on_hand, item.reorder_point, item.unit_price]
      );
      itemMap[item.sku] = res.rows[0].id;
    }
    console.log('✓ Inventory items seeded.');

    // 7. Insert Sales Orders & Sales Order Items
    const order1 = await client.query(
      `INSERT INTO sales_orders (order_code, customer_name, total_value, stage, created_by)
       VALUES ('SO-1001', 'Apex Construction Ltd', 1700.00, 'demand', $1) RETURNING id;`,
      [userMap['dhruv@brightweld.com']]
    );
    await client.query(
      `INSERT INTO sales_order_items (sales_order_id, item_id, quantity, unit_price)
       VALUES ($1, $2, 2, 850.00);`,
      [order1.rows[0].id, itemMap['BW-WELD-01']]
    );

    const order2 = await client.query(
      `INSERT INTO sales_orders (order_code, customer_name, total_value, stage, created_by)
       VALUES ('SO-1002', 'Titanium Fabricators Inc', 360.00, 'procurement', $1) RETURNING id;`,
      [userMap['twisha@brightweld.com']]
    );
    await client.query(
      `INSERT INTO sales_order_items (sales_order_id, item_id, quantity, unit_price)
       VALUES ($1, $2, 3, 120.00);`,
      [order2.rows[0].id, itemMap['BW-WELD-02']]
    );

    const order3 = await client.query(
      `INSERT INTO sales_orders (order_code, customer_name, total_value, stage, created_by)
       VALUES ('SO-1003', 'Metro Infrastructure Corp', 475.00, 'delivered', $1) RETURNING id;`,
      [userMap['sufiyan@brightweld.com']]
    );
    await client.query(
      `INSERT INTO sales_order_items (sales_order_id, item_id, quantity, unit_price)
       VALUES ($1, $2, 5, 95.00);`,
      [order3.rows[0].id, itemMap['BW-HELM-01']]
    );
    console.log('✓ Sales orders seeded.');

    // 8. Insert Purchase Orders
    await client.query(
      `INSERT INTO purchase_orders (po_code, supplier_name, linked_sales_order_id, status, created_by)
       VALUES ('PO-2001', 'Global Metals Corp', $1, 'pending', $2);`,
      [order2.rows[0].id, userMap['dhruv@brightweld.com']]
    );
    console.log('✓ Purchase orders seeded.');

    // 9. Insert Manufacturing Jobs
    await client.query(
      `INSERT INTO manufacturing_jobs (sales_order_id, status)
       VALUES ($1, 'queued');`,
      [order2.rows[0].id]
    );
    console.log('✓ Manufacturing jobs seeded.');

    console.log('--- Database Seeding Completed Successfully ---');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    client.release();
    await db.pool.end();
  }
}

seed();
