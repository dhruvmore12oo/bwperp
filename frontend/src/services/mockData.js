/**
 * Flowline ERP — In-Memory Mock Service & Sample Data
 * Enables frontend testing while backend is under development.
 */

export const MOCK_ACCOUNTS = [
  {
    id: 1,
    name: 'Alexander Vance',
    email: 'admin@brightweld.com',
    password: 'admin123',
    role: 'admin',
    is_active: true,
  },
  {
    id: 2,
    name: 'Marcus Reynolds',
    email: 'manager@brightweld.com',
    password: 'manager123',
    role: 'manager',
    is_active: true,
  },
  {
    id: 3,
    name: 'Devon Clark',
    email: 'operator@brightweld.com',
    password: 'staff123',
    role: 'staff',
    is_active: true,
  },
];

// Persistent state in memory during session
let currentMockSessionUser = null;

let mockInventory = [
  {
    id: 101,
    sku: 'STL-PLT-10MM',
    name: 'Structural Steel Plate 10mm (Grade A36)',
    quantity_on_hand: 14,
    reorder_point: 25,
    unit: 'sheets',
    low_stock: true,
  },
  {
    id: 102,
    sku: 'WLD-ROD-7018',
    name: 'AWS E7018 Low-Hydrogen Welding Electrodes',
    quantity_on_hand: 120,
    reorder_point: 40,
    unit: 'kg',
    low_stock: false,
  },
  {
    id: 103,
    sku: 'GAS-ARGON-UHP',
    name: 'Ultra High Purity Argon Shielding Gas (Cylinder)',
    quantity_on_hand: 4,
    reorder_point: 10,
    unit: 'cylinders',
    low_stock: true,
  },
  {
    id: 104,
    sku: 'FLG-WN-ANSI150',
    name: 'Weld Neck Flange 4" Class 150 Raised Face',
    quantity_on_hand: 58,
    reorder_point: 20,
    unit: 'pcs',
    low_stock: false,
  },
  {
    id: 105,
    sku: 'PIP-SCH40-CS',
    name: 'Seamless Carbon Steel Pipe 3" Sch 40 (6m)',
    quantity_on_hand: 42,
    reorder_point: 15,
    unit: 'lengths',
    low_stock: false,
  },
];

let mockSalesOrders = [
  {
    id: 1,
    order_code: 'SO-2026-081',
    customer_name: 'Apex Industrial Infrastructure',
    stage: 'production',
    total_value: 48500,
    created_at: '2026-09-24T10:15:00Z',
    items: [
      { item_id: 101, sku: 'STL-PLT-10MM', name: 'Structural Steel Plate 10mm', quantity: 12 },
      { item_id: 102, sku: 'WLD-ROD-7018', name: 'AWS E7018 Welding Electrodes', quantity: 35 },
    ],
  },
  {
    id: 2,
    order_code: 'SO-2026-082',
    customer_name: 'Titan Heavy Machinery Corp',
    stage: 'procurement',
    total_value: 92400,
    created_at: '2026-09-26T14:30:00Z',
    items: [
      { item_id: 104, sku: 'FLG-WN-ANSI150', name: 'Weld Neck Flange 4"', quantity: 40 },
    ],
  },
  {
    id: 3,
    order_code: 'SO-2026-083',
    customer_name: 'Kaveri Petrochemical Works',
    stage: 'qc',
    total_value: 36000,
    created_at: '2026-09-27T09:00:00Z',
    items: [
      { item_id: 105, sku: 'PIP-SCH40-CS', name: 'Seamless CS Pipe 3"', quantity: 25 },
    ],
  },
  {
    id: 4,
    order_code: 'SO-2026-084',
    customer_name: 'Sterling Fabricators Pune',
    stage: 'demand',
    total_value: 17200,
    created_at: '2026-09-29T16:20:00Z',
    items: [
      { item_id: 101, sku: 'STL-PLT-10MM', name: 'Structural Steel Plate 10mm', quantity: 6 },
    ],
  },
  {
    id: 5,
    order_code: 'SO-2026-079',
    customer_name: 'Mahindra Logistics Systems',
    stage: 'delivered',
    total_value: 54000,
    created_at: '2026-09-18T11:45:00Z',
    items: [],
  },
];

let mockPurchaseOrders = [
  {
    id: 1,
    po_code: 'PO-2026-301',
    supplier_name: 'Jindal Steel & Alloys Ltd.',
    linked_sales_order_id: 2,
    status: 'pending',
    created_at: '2026-09-26T15:00:00Z',
  },
  {
    id: 2,
    po_code: 'PO-2026-302',
    supplier_name: 'Linde Industrial Gases India',
    linked_sales_order_id: 1,
    status: 'received',
    created_at: '2026-09-25T11:20:00Z',
  },
  {
    id: 3,
    po_code: 'PO-2026-303',
    supplier_name: 'Precision Flanges & Valves',
    linked_sales_order_id: 4,
    status: 'cancelled',
    created_at: '2026-09-28T09:10:00Z',
  },
];

let mockJobs = [
  {
    id: 201,
    sales_order_id: 4,
    order_code: 'SO-2026-084',
    customer_name: 'Sterling Fabricators Pune',
    status: 'queued',
    updated_at: '2026-09-29T16:25:00Z',
  },
  {
    id: 202,
    sales_order_id: 1,
    order_code: 'SO-2026-081',
    customer_name: 'Apex Industrial Infrastructure',
    status: 'in_progress',
    updated_at: '2026-09-30T10:10:00Z',
  },
  {
    id: 203,
    sales_order_id: 3,
    order_code: 'SO-2026-083',
    customer_name: 'Kaveri Petrochemical Works',
    status: 'qc',
    updated_at: '2026-09-30T14:45:00Z',
  },
  {
    id: 204,
    sales_order_id: 5,
    order_code: 'SO-2026-079',
    customer_name: 'Mahindra Logistics Systems',
    status: 'done',
    updated_at: '2026-09-28T18:00:00Z',
  },
];

let mockUsers = [...MOCK_ACCOUNTS];

export const mockHandler = {
  login: async (email, password) => {
    const acc = mockUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!acc) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }
    if (!acc.is_active) {
      const err = new Error('This account has been deactivated by an administrator.');
      err.status = 403;
      throw err;
    }
    currentMockSessionUser = {
      id: acc.id,
      name: acc.name,
      email: acc.email,
      role: acc.role,
    };
    return { user: currentMockSessionUser };
  },

  logout: async () => {
    currentMockSessionUser = null;
    return { message: 'Logged out successfully' };
  },

  getCurrentUser: async () => {
    if (!currentMockSessionUser) {
      const err = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }
    return { user: currentMockSessionUser };
  },

  getDashboard: async () => {
    const openOrders = mockSalesOrders.filter((o) => o.stage !== 'delivered').length;
    const lowStockCount = mockInventory.filter(
      (i) => i.low_stock || i.quantity_on_hand <= i.reorder_point
    ).length;
    return {
      openOrders,
      lowStockCount,
      recentOrders: mockSalesOrders.slice(0, 5),
    };
  },

  getSalesOrders: async () => {
    return mockSalesOrders;
  },

  createSalesOrder: async (data) => {
    const newId = Date.now();
    const newOrder = {
      id: newId,
      order_code: data.order_code,
      customer_name: data.customer_name,
      stage: 'demand',
      total_value: Number(data.total_value) || 0,
      created_at: new Date().toISOString(),
      items: data.items || [],
    };
    mockSalesOrders = [newOrder, ...mockSalesOrders];
    return newOrder;
  },

  getSalesOrderById: async (id) => {
    const order = mockSalesOrders.find((o) => String(o.id) === String(id));
    if (!order) {
      const err = new Error('Sales order not found');
      err.status = 404;
      throw err;
    }
    return order;
  },

  updateSalesOrderStage: async (id, stage) => {
    mockSalesOrders = mockSalesOrders.map((o) =>
      String(o.id) === String(id) ? { ...o, stage } : o
    );
    return { id, stage };
  },

  getPurchaseOrders: async () => {
    return mockPurchaseOrders;
  },

  createPurchaseOrder: async (data) => {
    const newId = Date.now();
    const newPO = {
      id: newId,
      po_code: data.po_code,
      supplier_name: data.supplier_name,
      linked_sales_order_id: data.linked_sales_order_id,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    mockPurchaseOrders = [newPO, ...mockPurchaseOrders];
    return newPO;
  },

  updatePurchaseOrderStatus: async (id, status) => {
    mockPurchaseOrders = mockPurchaseOrders.map((p) =>
      String(p.id) === String(id) ? { ...p, status } : p
    );
    return { id, status };
  },

  getInventory: async () => {
    return mockInventory;
  },

  updateInventoryQuantity: async (id, qty) => {
    mockInventory = mockInventory.map((i) => {
      if (String(i.id) === String(id)) {
        return {
          ...i,
          quantity_on_hand: qty,
          low_stock: qty <= i.reorder_point,
        };
      }
      return i;
    });
    return { id, quantity_on_hand: qty };
  },

  getManufacturingJobs: async () => {
    return mockJobs;
  },

  createManufacturingJob: async (data) => {
    const so = mockSalesOrders.find((s) => String(s.id) === String(data.sales_order_id));
    const newJob = {
      id: Date.now(),
      sales_order_id: data.sales_order_id,
      order_code: so?.order_code || `SO-#${data.sales_order_id}`,
      customer_name: so?.customer_name || 'Standard Production Job',
      status: 'queued',
      updated_at: new Date().toISOString(),
    };
    mockJobs = [newJob, ...mockJobs];
    return newJob;
  },

  updateManufacturingJobStatus: async (id, status) => {
    mockJobs = mockJobs.map((j) =>
      String(j.id) === String(id)
        ? { ...j, status, updated_at: new Date().toISOString() }
        : j
    );
    return { id, status };
  },

  getReportsSummary: async () => {
    const ordersByStage = mockSalesOrders.reduce((acc, curr) => {
      acc[curr.stage] = (acc[curr.stage] || 0) + 1;
      return acc;
    }, {});

    const totalRevenue = mockSalesOrders.reduce(
      (sum, curr) => sum + (Number(curr.total_value) || 0),
      0
    );

    const customerMap = {};
    mockSalesOrders.forEach((o) => {
      customerMap[o.customer_name] = (customerMap[o.customer_name] || 0) + o.total_value;
    });

    const topCustomers = Object.entries(customerMap)
      .map(([customer_name, total_value]) => ({ customer_name, total_value }))
      .sort((a, b) => b.total_value - a.total_value)
      .slice(0, 5);

    return {
      ordersByStage,
      totalRevenue,
      topCustomers,
    };
  },

  getUsers: async () => {
    if (currentMockSessionUser?.role !== 'admin') {
      const err = new Error('Forbidden: Only administrators can access this resource.');
      err.status = 403;
      throw err;
    }
    return mockUsers.map(({ id, name, email, role, is_active }) => ({
      id,
      name,
      email,
      role,
      is_active,
    }));
  },

  createUser: async (data) => {
    if (currentMockSessionUser?.role !== 'admin') {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    const newUser = {
      id: Date.now(),
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role || 'staff',
      is_active: true,
    };
    mockUsers = [...mockUsers, newUser];
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };
  },

  updateUser: async (id, data) => {
    if (currentMockSessionUser?.role !== 'admin') {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    mockUsers = mockUsers.map((u) => {
      if (String(u.id) === String(id)) {
        return {
          ...u,
          ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
          ...(data.role ? { role: data.role } : {}),
        };
      }
      return u;
    });
    const updated = mockUsers.find((u) => String(u.id) === String(id));
    return updated;
  },
};
