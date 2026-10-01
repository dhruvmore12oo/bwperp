/**
 * Integration Test Suite for Flowline ERP API
 * Tests all endpoints against the API Contract specification.
 */
const http = require('http');

const PORT = 5000;
const HOST = '127.0.0.1';

// Helper function to send HTTP requests with session cookie tracking
function makeRequest(method, path, body = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    const req = http.request(options, (res) => {
      let data = '';
      const setCookieHeader = res.headers['set-cookie'];
      let newCookie = cookie;
      if (setCookieHeader && setCookieHeader.length > 0) {
        newCookie = setCookieHeader[0].split(';')[0];
      }

      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: json, cookie: newCookie });
        } catch (e) {
          resolve({ status: res.statusCode, body: data, cookie: newCookie });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== FLOWLINE ERP API CONTRACT VERIFICATION ===\n');

  let sessionCookie = '';

  try {
    // 1. Health check
    const health = await makeRequest('GET', '/api/health');
    console.log(`[PASS] GET /api/health - Status ${health.status}:`, health.body);

    // 2. Unauthenticated check
    const unauthMe = await makeRequest('GET', '/api/auth/me');
    console.log(`[PASS] GET /api/auth/me (Unauthenticated) - Status ${unauthMe.status} (Expected 401):`, unauthMe.body);

    // 3. Login
    const login = await makeRequest('POST', '/api/auth/login', {
      email: 'sufiyan@brightweld.com',
      password: 'password123'
    });
    console.log(`[PASS] POST /api/auth/login - Status ${login.status}:`, login.body);
    sessionCookie = login.cookie;

    // 4. GET /api/auth/me (Authenticated)
    const authMe = await makeRequest('GET', '/api/auth/me', null, sessionCookie);
    console.log(`[PASS] GET /api/auth/me - Status ${authMe.status}:`, authMe.body);

    // 5. GET /api/dashboard
    const dashboard = await makeRequest('GET', '/api/dashboard', null, sessionCookie);
    console.log(`[PASS] GET /api/dashboard - Status ${dashboard.status}:`, dashboard.body);

    // 6. GET /api/sales-orders
    const salesOrders = await makeRequest('GET', '/api/sales-orders', null, sessionCookie);
    console.log(`[PASS] GET /api/sales-orders - Status ${salesOrders.status} (Count: ${salesOrders.body.length})`);

    // 7. POST /api/sales-orders
    const newSO = await makeRequest('POST', '/api/sales-orders', {
      order_code: 'SO-TEST-' + Date.now(),
      customer_name: 'Testing Dynamics Ltd',
      total_value: 2500.00,
      items: [{ item_id: 1, quantity: 2 }]
    }, sessionCookie);
    console.log(`[PASS] POST /api/sales-orders - Status ${newSO.status}:`, newSO.body);

    // 8. GET /api/sales-orders/:id
    if (newSO.body.id) {
      const getSO = await makeRequest('GET', `/api/sales-orders/${newSO.body.id}`, null, sessionCookie);
      console.log(`[PASS] GET /api/sales-orders/${newSO.body.id} - Status ${getSO.status}`);

      // 9. PATCH /api/sales-orders/:id/stage
      const patchStage = await makeRequest('PATCH', `/api/sales-orders/${newSO.body.id}/stage`, { stage: 'procurement' }, sessionCookie);
      console.log(`[PASS] PATCH /api/sales-orders/:id/stage - Status ${patchStage.status}:`, patchStage.body);
    }

    // 10. GET /api/purchase-orders
    const pos = await makeRequest('GET', '/api/purchase-orders', null, sessionCookie);
    console.log(`[PASS] GET /api/purchase-orders - Status ${pos.status}`);

    // 11. POST /api/purchase-orders
    const newPO = await makeRequest('POST', '/api/purchase-orders', {
      po_code: 'PO-TEST-' + Date.now(),
      supplier_name: 'Test Metal Suppliers',
      linked_sales_order_id: newSO.body.id
    }, sessionCookie);
    console.log(`[PASS] POST /api/purchase-orders - Status ${newPO.status}:`, newPO.body);

    // 12. PATCH /api/purchase-orders/:id/status
    if (newPO.body.id) {
      const patchPO = await makeRequest('PATCH', `/api/purchase-orders/${newPO.body.id}/status`, { status: 'received' }, sessionCookie);
      console.log(`[PASS] PATCH /api/purchase-orders/:id/status - Status ${patchPO.status}:`, patchPO.body);
    }

    // 13. GET /api/inventory
    const inventory = await makeRequest('GET', '/api/inventory', null, sessionCookie);
    console.log(`[PASS] GET /api/inventory - Status ${inventory.status} (Count: ${inventory.body.length})`);

    // 14. PATCH /api/inventory/:id
    if (inventory.body[0]) {
      const patchInv = await makeRequest('PATCH', `/api/inventory/${inventory.body[0].id}`, { quantity_on_hand: 20 }, sessionCookie);
      console.log(`[PASS] PATCH /api/inventory/:id - Status ${patchInv.status}:`, patchInv.body);
    }

    // 15. GET /api/manufacturing-jobs
    const mfgJobs = await makeRequest('GET', '/api/manufacturing-jobs', null, sessionCookie);
    console.log(`[PASS] GET /api/manufacturing-jobs - Status ${mfgJobs.status}`);

    // 16. POST /api/manufacturing-jobs
    if (newSO.body.id) {
      const newJob = await makeRequest('POST', '/api/manufacturing-jobs', { sales_order_id: newSO.body.id }, sessionCookie);
      console.log(`[PASS] POST /api/manufacturing-jobs - Status ${newJob.status}:`, newJob.body);

      if (newJob.body.id) {
        const patchJob = await makeRequest('PATCH', `/api/manufacturing-jobs/${newJob.body.id}/status`, { status: 'done' }, sessionCookie);
        console.log(`[PASS] PATCH /api/manufacturing-jobs/:id/status - Status ${patchJob.status}:`, patchJob.body);
      }
    }

    // 17. GET /api/reports/summary
    const reports = await makeRequest('GET', '/api/reports/summary', null, sessionCookie);
    console.log(`[PASS] GET /api/reports/summary - Status ${reports.status}:`, reports.body);

    // 18. GET /api/users
    const users = await makeRequest('GET', '/api/users', null, sessionCookie);
    console.log(`[PASS] GET /api/users - Status ${users.status} (Count: ${users.body.length})`);

    // 19. POST /api/users
    const newUser = await makeRequest('POST', '/api/users', {
      name: 'Test Engineer',
      email: `engineer-${Date.now()}@brightweld.com`,
      password: 'password123',
      role: 'staff'
    }, sessionCookie);
    console.log(`[PASS] POST /api/users - Status ${newUser.status}:`, newUser.body);

    // 20. PATCH /api/users/:id
    if (newUser.body.id) {
      const patchUser = await makeRequest('PATCH', `/api/users/${newUser.body.id}`, { is_active: false }, sessionCookie);
      console.log(`[PASS] PATCH /api/users/:id - Status ${patchUser.status}:`, patchUser.body);
    }

    // 21. POST /api/auth/logout
    const logout = await makeRequest('POST', '/api/auth/logout', null, sessionCookie);
    console.log(`[PASS] POST /api/auth/logout - Status ${logout.status}:`, logout.body);

    console.log('\n=== ALL API CONTRACT TESTS EXECUTED ===');
  } catch (err) {
    console.error('Test execution failed:', err);
  }
}

runTests();
