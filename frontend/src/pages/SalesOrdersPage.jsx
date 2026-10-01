import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getSalesOrders,
  createSalesOrder,
  getSalesOrderById,
  updateSalesOrderStage,
  getInventory,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { PlusIcon, RefreshIcon } from '../components/common/Icons';

const ORDER_STAGES = [
  'demand',
  'procurement',
  'production',
  'qc',
  'delivered',
  'on_hold',
];

export function SalesOrdersPage() {
  const { isStaff } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Create Form State
  const [orderCode, setOrderCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [items, setItems] = useState([{ item_id: '', quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch sales orders and inventory for item selection
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getSalesOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message || 'Failed to load sales orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const inv = await getInventory();
      if (Array.isArray(inv)) setInventoryList(inv);
    } catch {
      // Non-blocking if inventory fails
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchInventory();
  }, []);

  // Handle URL query ?viewId=...
  useEffect(() => {
    const viewId = searchParams.get('viewId');
    if (viewId) {
      handleViewDetails(viewId);
    }
  }, [searchParams]);

  const handleViewDetails = async (id) => {
    setLoadingDetail(true);
    try {
      const detail = await getSalesOrderById(id);
      setSelectedOrder(detail);
    } catch (err) {
      showToast(err.message || 'Failed to fetch sales order details', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedOrder(null);
    if (searchParams.has('viewId')) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('viewId');
      setSearchParams(nextParams);
    }
  };

  // Stage change handler
  const handleStageChange = async (orderId, newStage) => {
    try {
      await updateSalesOrderStage(orderId, newStage);
      showToast(`Order status updated to ${newStage.toUpperCase()}`, 'success');
      
      // Update local state immediately
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, stage: newStage } : o))
      );
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, stage: newStage }));
      }
    } catch (err) {
      showToast(err.message || 'Failed to update order stage', 'error');
    }
  };

  // Dynamic Line Item handlers
  const handleAddItemRow = () => {
    setItems((prev) => [...prev, { item_id: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Submit new Sales Order
  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (!orderCode.trim() || !customerName.trim()) {
      showToast('Order code and customer name are required', 'error');
      return;
    }

    const parsedValue = parseFloat(totalValue) || 0;
    const formattedItems = items
      .filter((it) => it.item_id)
      .map((it) => ({
        item_id: Number(it.item_id) || it.item_id,
        quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
      }));

    setSubmitting(true);
    try {
      await createSalesOrder({
        order_code: orderCode.trim(),
        customer_name: customerName.trim(),
        total_value: parsedValue,
        items: formattedItems,
      });

      showToast('Sales order created successfully!', 'success');
      setShowCreateModal(false);
      // Reset form
      setOrderCode('');
      setCustomerName('');
      setTotalValue('');
      setItems([{ item_id: '', quantity: 1 }]);
      // Refresh list
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Failed to create sales order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h2>Sales Orders</h2>
          <p style={{ color: 'var(--slate)', fontSize: '0.88rem' }}>
            Customer contracts and demand pipeline across manufacturing stages.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchOrders}
            disabled={loading}
          >
            <RefreshIcon />
            <span>Refresh</span>
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon />
            <span>Create Sales Order</span>
          </button>
        </div>
      </div>

      {/* Orders List Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">All Customer Demand Orders</h3>
            <p className="card-description">
              Total registered orders: <span className="font-mono">{orders.length}</span>
            </p>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <span>Fetching sales orders from database...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No Sales Orders</div>
              <p className="empty-state-text">
                No customer orders have been initiated. Click "Create Sales Order" to record the first one.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order Code</th>
                    <th>Customer Name</th>
                    <th>Fulfillment Stage</th>
                    <th style={{ textAlign: 'right' }}>Total Value</th>
                    <th>Created At</th>
                    <th style={{ textAlign: 'center' }}>Stage Transition</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <span className="data-code">{order.order_code}</span>
                      </td>
                      <td>
                        <strong>{order.customer_name}</strong>
                      </td>
                      <td>
                        <StatusBadge status={order.stage} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="data-amount">{formatCurrency(order.total_value)}</span>
                      </td>
                      <td>
                        <span className="data-timestamp">{formatDate(order.created_at)}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isStaff ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>
                            Read Only
                          </span>
                        ) : (
                          <select
                            className="form-select font-mono"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                            value={order.stage || 'demand'}
                            onChange={(e) => handleStageChange(order.id, e.target.value)}
                          >
                            {ORDER_STAGES.map((stg) => (
                              <option key={stg} value={stg}>
                                {stg.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewDetails(order.id)}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE ORDER MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Sales Order Entry</h3>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateOrder}>
              <div className="modal-body">
                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label form-label-required">Order Code</label>
                    <input
                      type="text"
                      className="form-input font-mono"
                      placeholder="SO-2026-001"
                      value={orderCode}
                      onChange={(e) => setOrderCode(e.target.value)}
                      required
                    />
                    <span className="form-help">Unique manufacturing identifier</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label form-label-required">Customer Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Apex Industrial Fabrications"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label form-label-required">Total Contract Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input font-mono"
                    placeholder="25000"
                    value={totalValue}
                    onChange={(e) => setTotalValue(e.target.value)}
                    required
                  />
                </div>

                {/* Bill of Materials / Items Selection */}
                <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>
                      Included Inventory Parts / Items
                    </label>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAddItemRow}
                    >
                      + Add Item Row
                    </button>
                  </div>

                  {items.map((row, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 100px 40px',
                        gap: '0.5rem',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <select
                        className="form-select font-mono"
                        value={row.item_id}
                        onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                      >
                        <option value="">Select Inventory SKU</option>
                        {inventoryList.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.sku} — {item.name} ({item.quantity_on_hand} {item.unit} in stock)
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        className="form-input font-mono"
                        placeholder="Qty"
                        value={row.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />

                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--danger)' }}
                        disabled={items.length === 1}
                        onClick={() => handleRemoveItemRow(index)}
                        title="Remove row"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Registering...' : 'Submit Sales Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL VIEW MODAL (GET /api/sales-orders/:id) */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={handleCloseDetail}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title font-mono">{selectedOrder.order_code}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>
                  Customer: {selectedOrder.customer_name}
                </span>
              </div>
              <button className="modal-close" onClick={handleCloseDetail}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              {loadingDetail ? (
                <div className="spinner-container">
                  <div className="spinner"></div>
                  <span>Loading full contract details...</span>
                </div>
              ) : (
                <div>
                  <div className="grid-cols-2" style={{ marginBottom: '1.25rem' }}>
                    <div style={{ background: 'var(--surface-alt)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--slate)', display: 'block' }}>
                        Current Fulfillment Stage
                      </span>
                      <div style={{ marginTop: '0.25rem' }}>
                        <StatusBadge status={selectedOrder.stage} />
                      </div>
                    </div>

                    <div style={{ background: 'var(--surface-alt)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--slate)', display: 'block' }}>
                        Order Valuation
                      </span>
                      <strong className="data-amount" style={{ fontSize: '1.1rem', color: 'var(--teal)' }}>
                        {formatCurrency(selectedOrder.total_value)}
                      </strong>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                    Line Items & Specifications
                  </h4>

                  {!selectedOrder.items || selectedOrder.items.length === 0 ? (
                    <p style={{ color: 'var(--slate)', fontSize: '0.85rem' }}>
                      No individual line items registered under this sales order.
                    </p>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Item / SKU</th>
                          <th>Part Name</th>
                          <th style={{ textAlign: 'right' }}>Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((line, idx) => (
                          <tr key={idx}>
                            <td>
                              <span className="data-sku">{line.sku || line.item_id || `#${idx + 1}`}</span>
                            </td>
                            <td>{line.name || line.item_name || 'Standard Production Assembly'}</td>
                            <td style={{ textAlign: 'right' }}>
                              <span className="font-mono">{line.quantity}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseDetail}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
