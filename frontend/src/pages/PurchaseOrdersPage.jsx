import React, { useState, useEffect } from 'react';
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  getSalesOrders,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { PlusIcon, RefreshIcon } from '../components/common/Icons';

const PO_STATUSES = ['pending', 'received', 'cancelled'];

export function PurchaseOrdersPage() {
  const { isStaff } = useAuth();
  const { showToast } = useToast();

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [poCode, setPoCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [linkedSalesOrderId, setLinkedSalesOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const pos = await getPurchaseOrders();
      setPurchaseOrders(Array.isArray(pos) ? pos : []);
    } catch (err) {
      showToast(err.message || 'Failed to fetch purchase orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesOrdersList = async () => {
    try {
      const sos = await getSalesOrders();
      if (Array.isArray(sos)) setSalesOrders(sos);
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSalesOrdersList();
  }, []);

  const handleStatusChange = async (poId, newStatus) => {
    try {
      await updatePurchaseOrderStatus(poId, newStatus);
      showToast(`Purchase order updated to ${newStatus.toUpperCase()}`, 'success');
      setPurchaseOrders((prev) =>
        prev.map((po) => (po.id === poId ? { ...po, status: newStatus } : po))
      );
    } catch (err) {
      showToast(err.message || 'Failed to update PO status', 'error');
    }
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();

    if (!poCode.trim() || !supplierName.trim()) {
      showToast('PO code and supplier name are mandatory', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createPurchaseOrder({
        po_code: poCode.trim(),
        supplier_name: supplierName.trim(),
        linked_sales_order_id: linkedSalesOrderId ? Number(linkedSalesOrderId) || linkedSalesOrderId : null,
      });

      showToast('Purchase Order issued successfully!', 'success');
      setShowCreateModal(false);
      setPoCode('');
      setSupplierName('');
      setLinkedSalesOrderId('');
      fetchOrders();
    } catch (err) {
      showToast(err.message || 'Failed to create purchase order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
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
          <h2>Purchase Orders</h2>
          <p style={{ color: 'var(--slate)', fontSize: '0.88rem' }}>
            Supplier procurement requisitions tied to downstream manufacturing orders.
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
            <span>Issue Purchase Order</span>
          </button>
        </div>
      </div>

      {/* PO List Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Procurement Log</h3>
            <p className="card-description">
              Total purchase commitments: <span className="font-mono">{purchaseOrders.length}</span>
            </p>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <span>Loading purchase order registry...</span>
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No Purchase Orders Issued</div>
              <p className="empty-state-text">
                No raw material purchase orders are active. Click "Issue Purchase Order" to begin procurement.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PO Code</th>
                    <th>Supplier Name</th>
                    <th>Linked Sales Order</th>
                    <th>Status</th>
                    <th>Issued Date</th>
                    <th style={{ textAlign: 'right' }}>Status Action</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((po) => {
                    const linkedSo = salesOrders.find(
                      (so) => String(so.id) === String(po.linked_sales_order_id)
                    );
                    return (
                      <tr key={po.id}>
                        <td>
                          <span className="data-code">{po.po_code}</span>
                        </td>
                        <td>
                          <strong>{po.supplier_name}</strong>
                        </td>
                        <td>
                          {po.linked_sales_order_id ? (
                            <span className="badge badge-procurement">
                              SO #{linkedSo?.order_code || po.linked_sales_order_id}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--slate)', fontSize: '0.8rem' }}>Unlinked</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={po.status} />
                        </td>
                        <td>
                          <span className="data-timestamp">{formatDate(po.created_at)}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isStaff ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>
                              Read Only
                            </span>
                          ) : (
                            <select
                              className="form-select font-mono"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto', display: 'inline-block' }}
                              value={po.status || 'pending'}
                              onChange={(e) => handleStatusChange(po.id, e.target.value)}
                            >
                              {PO_STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  {st.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE PO MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Issue Procurement Purchase Order</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePO}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label form-label-required">Purchase Order Code</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    placeholder="PO-2026-901"
                    value={poCode}
                    onChange={(e) => setPoCode(e.target.value)}
                    required
                  />
                  <span className="form-help">Unique supplier PO code</span>
                </div>

                <div className="form-group">
                  <label className="form-label form-label-required">Supplier / Vendor Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Precision Alloys & Steel Ltd."
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Linked Sales Order (Requirement)</label>
                  <select
                    className="form-select font-mono"
                    value={linkedSalesOrderId}
                    onChange={(e) => setLinkedSalesOrderId(e.target.value)}
                  >
                    <option value="">-- Select Linked Sales Order (Optional) --</option>
                    {salesOrders.map((so) => (
                      <option key={so.id} value={so.id}>
                        {so.order_code} — {so.customer_name} ({so.stage?.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <span className="form-help">
                    Associates raw material delivery directly with customer order demand.
                  </span>
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
                  {submitting ? 'Issuing...' : 'Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
