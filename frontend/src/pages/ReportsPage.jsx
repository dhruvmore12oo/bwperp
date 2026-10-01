import React, { useState, useEffect } from 'react';
import { getReportsSummary } from '../services/api';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { RefreshIcon, ReportsIcon } from '../components/common/Icons';

export function ReportsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const summary = await getReportsSummary();
      setData(summary);
    } catch (err) {
      showToast(err.message || 'Failed to fetch business reports summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Stage order calculation for chart
  const stages = [
    { key: 'demand', label: 'Demand Initiation', color: 'var(--slate)' },
    { key: 'procurement', label: 'Procurement', color: 'var(--amber)' },
    { key: 'production', label: 'In Production', color: 'var(--teal)' },
    { key: 'qc', label: 'Quality Control', color: '#5E3EA1' },
    { key: 'delivered', label: 'Delivered / Completed', color: 'var(--success)' },
    { key: 'on_hold', label: 'On Hold', color: 'var(--danger)' },
  ];

  const ordersByStage = data?.ordersByStage || {};
  const totalOrdersAcrossStages = Object.values(ordersByStage).reduce((acc, curr) => acc + (Number(curr) || 0), 0);

  // Top customers
  const topCustomers = Array.isArray(data?.topCustomers) ? data.topCustomers : [];
  const maxCustomerVal = topCustomers.reduce((max, c) => Math.max(max, c.total_value || 0), 0) || 1;

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h2>Operational Analytics & Reports</h2>
          <p style={{ color: 'var(--slate)', fontSize: '0.88rem' }}>
            High-level metrics on throughput, financial realization, and key customer accounts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchSummary}
            disabled={loading}
          >
            <RefreshIcon />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <span>Computing manufacturing intelligence data...</span>
        </div>
      ) : (
        <>
          {/* Revenue & Overview Metrics */}
          <div className="grid-cols-2" style={{ marginBottom: '1.75rem' }}>
            <div className="kpi-card">
              <div>
                <div className="kpi-title">Gross Realized Revenue</div>
                <div className="kpi-value" style={{ color: 'var(--teal)', fontSize: '2.2rem' }}>
                  {formatCurrency(data?.totalRevenue)}
                </div>
                <div className="kpi-meta">Aggregated revenue from customer sales fulfillment</div>
              </div>
              <div className="kpi-icon-container" style={{ color: 'var(--teal)' }}>
                <ReportsIcon size={24} />
              </div>
            </div>

            <div className="kpi-card kpi-slate">
              <div>
                <div className="kpi-title">Total Active Orders In Pipeline</div>
                <div className="kpi-value">
                  {totalOrdersAcrossStages}
                </div>
                <div className="kpi-meta">Sum of orders categorized across all operational stages</div>
              </div>
              <div className="kpi-icon-container">
                <span className="font-mono" style={{ fontWeight: 700, fontSize: '1.1rem' }}>SO</span>
              </div>
            </div>
          </div>

          {/* Charts & Breakdown Section */}
          <div className="grid-cols-2">
            {/* Orders by Stage Visualizer */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Order Distribution by Stage</h3>
                  <p className="card-description">Fulfillment velocity across manufacturing phases</p>
                </div>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {stages.map((stg) => {
                    const count = ordersByStage[stg.key] || 0;
                    const percent = totalOrdersAcrossStages > 0
                      ? Math.round((count / totalOrdersAcrossStages) * 100)
                      : 0;

                    return (
                      <div key={stg.key}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {stg.label}
                          </span>
                          <span className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>
                            <strong>{count}</strong> orders ({percent}%)
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--surface-muted)', borderRadius: '5px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${percent}%`,
                              height: '100%',
                              backgroundColor: stg.color,
                              transition: 'width 0.4s ease',
                              borderRadius: '5px',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Customers Breakdown */}
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Top Customer Accounts</h3>
                  <p className="card-description">Key manufacturing partners by order value</p>
                </div>
              </div>
              <div className="card-body p-0">
                {topCustomers.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-title">No Customer Data</div>
                    <p className="empty-state-text">Customer revenue metrics will appear as orders are fulfilled.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Client Enterprise</th>
                          <th style={{ textAlign: 'right' }}>Cumulative Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCustomers.map((cust, idx) => {
                          const widthPct = Math.max(5, Math.round((cust.total_value / maxCustomerVal) * 100));
                          return (
                            <tr key={idx}>
                              <td>
                                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--slate)' }}>
                                  #{idx + 1}
                                </span>
                              </td>
                              <td>
                                <div>
                                  <strong>{cust.customer_name}</strong>
                                  <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--surface-muted)', borderRadius: '2px', marginTop: '0.35rem' }}>
                                    <div
                                      style={{
                                        width: `${widthPct}%`,
                                        height: '100%',
                                        backgroundColor: 'var(--teal)',
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span className="data-amount" style={{ color: 'var(--teal)' }}>
                                  {formatCurrency(cust.total_value)}
                                </span>
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
          </div>
        </>
      )}
    </div>
  );
}
