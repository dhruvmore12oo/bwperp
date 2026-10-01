/**
 * Flowline ERP — API Client Module
 * Brightweld Industries Academic Project
 * 
 * Centralized API service communicating with the backend API.
 * - Uses process env VITE_API_BASE_URL
 * - Cookie/Session-based auth: all requests include `credentials: 'include'`.
 * - Consistent JSON parsing and error handling ({ error: "message" }).
 * - Dispatches 'flowline:unauthorized' on 401 (unless on login page) to trigger session expiration.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

/**
 * Core HTTP request handler
 * @param {string} endpoint - API path, e.g. '/auth/login'
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<any>}
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // Crucial: sends session cookie automatically
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (netError) {
    console.error(`[API Network Error] ${options.method || 'GET'} ${url}:`, netError);
    throw new Error('Unable to connect to Flowline server (http://localhost:4000). Ensure the backend is running.');
  }

  // Handle HTTP 401 Unauthorized (Session Expired / Invalid)
  if (response.status === 401) {
    if (!endpoint.includes('/auth/login')) {
      window.dispatchEvent(new CustomEvent('flowline:unauthorized'));
    }
  }

  // Parse JSON response body
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  // Handle HTTP error responses
  if (!response.ok) {
    const errorMessage = (data && data.error) ? data.error : `Request failed with status ${response.status}`;
    const err = new Error(errorMessage);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

/* =====================================================================
   AUTH ENDPOINTS
   ===================================================================== */

export function login(email, password) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function logout() {
  return apiRequest('/auth/logout', {
    method: 'POST',
  });
}

export function getCurrentUser() {
  return apiRequest('/auth/me', {
    method: 'GET',
  });
}

/* =====================================================================
   DASHBOARD ENDPOINTS
   ===================================================================== */

export function getDashboard() {
  return apiRequest('/dashboard', {
    method: 'GET',
  });
}

/* =====================================================================
   SALES ORDERS ENDPOINTS
   ===================================================================== */

export function getSalesOrders() {
  return apiRequest('/sales-orders', {
    method: 'GET',
  });
}

export function createSalesOrder(orderData) {
  return apiRequest('/sales-orders', {
    method: 'POST',
    body: orderData,
  });
}

export function getSalesOrderById(id) {
  return apiRequest(`/sales-orders/${id}`, {
    method: 'GET',
  });
}

export function updateSalesOrderStage(id, stage) {
  return apiRequest(`/sales-orders/${id}/stage`, {
    method: 'PATCH',
    body: { stage },
  });
}

/* =====================================================================
   PURCHASE ORDERS ENDPOINTS
   ===================================================================== */

export function getPurchaseOrders() {
  return apiRequest('/purchase-orders', {
    method: 'GET',
  });
}

export function createPurchaseOrder(poData) {
  return apiRequest('/purchase-orders', {
    method: 'POST',
    body: poData,
  });
}

export function updatePurchaseOrderStatus(id, status) {
  return apiRequest(`/purchase-orders/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

/* =====================================================================
   INVENTORY ENDPOINTS
   ===================================================================== */

export function getInventory() {
  return apiRequest('/inventory', {
    method: 'GET',
  });
}

export function updateInventoryQuantity(id, quantity_on_hand) {
  return apiRequest(`/inventory/${id}`, {
    method: 'PATCH',
    body: { quantity_on_hand: Number(quantity_on_hand) },
  });
}

/* =====================================================================
   MANUFACTURING ENDPOINTS
   ===================================================================== */

export function getManufacturingJobs() {
  return apiRequest('/manufacturing-jobs', {
    method: 'GET',
  });
}

export function createManufacturingJob(jobData) {
  return apiRequest('/manufacturing-jobs', {
    method: 'POST',
    body: jobData,
  });
}

export function updateManufacturingJobStatus(id, status) {
  return apiRequest(`/manufacturing-jobs/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

/* =====================================================================
   REPORTS ENDPOINTS
   ===================================================================== */

export function getReportsSummary() {
  return apiRequest('/reports/summary', {
    method: 'GET',
  });
}

/* =====================================================================
   USERS & ROLES ENDPOINTS (ADMIN ONLY)
   ===================================================================== */

export function getUsers() {
  return apiRequest('/users', {
    method: 'GET',
  });
}

export function createUser(userData) {
  return apiRequest('/users', {
    method: 'POST',
    body: userData,
  });
}

export function updateUser(id, updateData) {
  return apiRequest(`/users/${id}`, {
    method: 'PATCH',
    body: updateData,
  });
}
