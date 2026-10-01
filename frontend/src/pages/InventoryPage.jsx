import React, { useState, useEffect } from 'react';
import { getInventory, updateInventoryQuantity } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AlertTriangleIcon, RefreshIcon } from '../components/common/Icons';

export function InventoryPage() {
  const { isStaff } = useAuth();
  const { showToast } = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Edit stock modal state
  const [editItem, setEditItem] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await getInventory();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message || 'Failed to fetch inventory catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenEdit = (item) => {
    setEditItem(item);
    setEditQuantity(String(item.quantity_on_hand));
  };

  const handleSaveQuantity = async (e) => {
    e.preventDefault();
    if (!editItem) return;

    const parsed = parseFloat(editQuantity);
    if (isNaN(parsed) || parsed < 0) {
      showToast('Please enter a valid non-negative quantity', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateInventoryQuantity(editItem.id, parsed);
      showToast(`Stock updated for SKU ${editItem.sku}`, 'success');

      // Update in local state
      setItems((prev) =>
        prev.map((it) => {
          if (it.id === editItem.id) {
            const low = parsed <= it.reorder_point;
            return { ...it, quantity_on_hand: parsed, low_stock: low };
          }
          return it;
        })
      );
      setEditItem(null);
    } catch (err) {
      showToast(err.message || 'Failed to update stock quantity', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      (item.sku && item.sku.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.name && item.name.toLowerCase().includes(filterText.toLowerCase()));
    const isLow = item.low_stock || item.quantity_on_hand <= item.reorder_point;
    if (showLowStockOnly) {
      return matchesSearch && isLow;
    }
    return matchesSearch;
  });

  const lowStockCount = items.filter(
    (it) => it.low_stock || it.quantity_on_hand <= it.reorder_point
  ).length;

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h2>Inventory Catalog</h2>
          <p style={{ color: 'var(--slate)', fontSize: '0.88rem' }}>
            Raw materials, components, and finished goods stock levels.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchItems}
            disabled={loading}
          >
            <RefreshIcon />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid-cols-3" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card">
          <div>
            <div className="kpi-title">Total Tracked SKUs</div>
            <div className="kpi-value">{loading ? '...' : items.length}</div>
            <div className="kpi-meta">Catalog items under active replenishment</div>
          </div>
        </div>

        <div className="kpi-card kpi-danger">
          <div>
            <div className="kpi-title">Critical Shortage SKUs</div>
            <div className="kpi-value" style={{ color: 'var(--danger)' }}>
              {loading ? '...' : lowStockCount}
            </div>
            <div className="kpi-meta">Items below configured reorder point</div>
          </div>
        </div>

        <div className="kpi-card kpi-slate">
          <div>
            <div className="kpi-title">Stock Filter</div>
            <div style={{ marginTop: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showLowStockOnly}
                  onChange={(e) => setShowLowStockOnly(e.target.checked)}
                />
                <strong>Show Low Stock Items Only</strong>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Stock Valuation & Safety Levels</h3>
            <p className="card-description">Physical counts per manufacturing bin</p>
          </div>
          <div>
            <input
              type="text"
              placeholder="Search by SKU or Item Name..."
              className="form-input font-mono"
              style={{ width: '260px', padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <span>Scanning inventory balances...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No Items Matching Filters</div>
              <p className="empty-state-text">
                No items match your criteria. Try adjusting the search query or toggle off low stock filter.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>SKU Code</th>
                    <th>Part / Item Description</th>
                    <th style={{ textAlign: 'right' }}>On Hand</th>
                    <th style={{ textAlign: 'right' }}>Reorder Point</th>
                    <th>Unit</th>
                    <th>Stock Status</th>
                    <th style={{ textAlign: 'right' }}>Adjustment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const isLow =
                      item.low_stock || item.quantity_on_hand <= item.reorder_point;
                    return (
                      <tr key={item.id} className={isLow ? 'row-alert' : ''}>
                        <td>
                          <span className="data-sku">{item.sku}</span>
                        </td>
                        <td>
                          <strong>{item.name}</strong>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            className="font-mono"
                            style={{
                              fontWeight: 700,
                              color: isLow ? 'var(--danger)' : 'var(--ink)',
                            }}
                          >
                            {item.quantity_on_hand}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="font-mono" style={{ color: 'var(--slate)' }}>
                            {item.reorder_point}
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-queued">{item.unit || 'units'}</span>
                        </td>
                        <td>
                          {isLow ? (
                            <span className="low-stock-flag">
                              <AlertTriangleIcon size={12} />
                              LOW STOCK
                            </span>
                          ) : (
                            <span className="badge badge-delivered">HEALTHY</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isStaff ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>
                              View Only
                            </span>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEdit(item)}
                            >
                              Adjust Qty
                            </button>
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

      {/* ADJUST QUANTITY MODAL (PATCH /api/inventory/:id) */}
      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Adjust Physical Inventory</h3>
              <button className="modal-close" onClick={() => setEditItem(null)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveQuantity}>
              <div className="modal-body">
                <div style={{ marginBottom: '1rem', background: 'var(--surface-alt)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--slate)' }}>SKU</div>
                  <strong className="data-sku" style={{ fontSize: '0.95rem' }}>{editItem.sku}</strong>
                  <div style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>{editItem.name}</div>
                </div>

                <div className="form-group">
                  <label className="form-label form-label-required">
                    Updated Quantity on Hand ({editItem.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="form-input font-mono"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    required
                    autoFocus
                  />
                  <span className="form-help">
                    Reorder threshold is {editItem.reorder_point} {editItem.unit}.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Updating...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
