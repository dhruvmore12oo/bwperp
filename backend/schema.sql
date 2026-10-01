-- Drop tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS manufacturing_jobs CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- 1. Roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 2. Permissions
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    CONSTRAINT unique_module_action UNIQUE (module, action)
);

-- 3. Role Permissions
CREATE TABLE role_permissions (
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Inventory Items
CREATE TABLE inventory_items (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    reorder_point INT NOT NULL DEFAULT 0,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Sales Orders
CREATE TABLE sales_orders (
    id SERIAL PRIMARY KEY,
    order_code VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(150) NOT NULL,
    total_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stage VARCHAR(50) NOT NULL DEFAULT 'demand' CHECK (stage IN ('demand', 'procurement', 'production', 'qc', 'delivered', 'cancelled')),
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Sales Order Items
CREATE TABLE sales_order_items (
    id SERIAL PRIMARY KEY,
    sales_order_id INT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    item_id INT NOT NULL REFERENCES inventory_items(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) DEFAULT 0.00
);

-- 8. Purchase Orders
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    po_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_name VARCHAR(150) NOT NULL,
    linked_sales_order_id INT REFERENCES sales_orders(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
    created_by INT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Manufacturing Jobs
CREATE TABLE manufacturing_jobs (
    id SERIAL PRIMARY KEY,
    sales_order_id INT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'qc', 'done', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
