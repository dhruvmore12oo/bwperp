import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../services/api';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { SalesIcon, InventoryIcon, RefreshIcon } from '../components/common/Icons';

export function DashboardPage() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await getDashboard();
      setData(res);
    } catch (err) {
      showToast(err.message || 'Failed to fetch dashboard metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h2>Executive Overview</h2>
          <p style={{ color: 'var(--slate)', fontSize: '0.88rem' }}>
            Live status of shop floor throughput, open fulfillment pipeline, and inventory alerts.
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={fetchDashboardData}
          disabled={loading}
          title="Refresh metrics from server"
        >
          <RefreshIcon />
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-cols-3" style={{ marginBottom: '2rem' }}>
        <div className="kpi-card">
          <div>
            <div className="kpi-title">Open Sales Orders</div>
            <div className="kpi-value">
              {loading ? '...' : (data?.openOrders ?? 0)}
            </div>
            <div className="kpi-meta">Orders awaiting completion or delivery</div>
          </div>
          <div className="kpi-icon-container" style={{ color: 'var(--teal)' }}>
            <SalesIcon size={22} />
          </div>
        </div>

        <div className="kpi-card kpi-danger">
          <div>
            <div className="kpi-title">Low Stock Items</div>
            <div className="kpi-value" style={{ color: 'var(--danger)' }}>
              {loading ? '...' : (data?.lowStockCount ?? 0)}
            </div>
            <div className="kpi-meta">SKUs below safety threshold level</div>
          </div>
          <div className="kpi-icon-container" style={{ color: 'var(--danger)', backgroundColor: 'var(--danger-light)' }}>
            <InventoryIcon size={22} />
          </div>
        </div>

        <div className="kpi-card kpi-amber">
          <div>
            <div className="kpi-title">Active Orders in View</div>
            <div className="kpi-value">
              {loading ? '...' : (data?.recentOrders?.length ?? 0)}
            </div>
            <div className="kpi-meta">Fulfillment pipeline tracking queue</div>
          </div>
          <div className="kpi-icon-container" style={{ color: 'var(--amber)' }}>
            <SalesIcon size={22} />
          </div>
        </div>
      </div>

      {/* Recent Orders Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Recent Sales Orders</h3>
            <p className="card-description">Latest manufacturing demands entered into Flowline</p>
          </div>
          <Link to="/sales-orders" className="btn btn-secondary btn-sm">
            View All Sales Orders
          </Link>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <span>Loading recent order activity...</span>
            </div>
          ) : !data?.recentOrders || data.recentOrders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No Recent Orders Found</div>
              <p className="empty-state-text">
                There are no recent sales orders registered in the system yet.
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
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
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
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/sales-orders?viewId=${order.id}`}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--teal)', fontWeight: 600 }}
                        >
                          View Details &rarr;
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
