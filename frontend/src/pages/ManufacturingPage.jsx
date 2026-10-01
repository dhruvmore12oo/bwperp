import React, { useState, useEffect } from 'react';
import {
  getManufacturingJobs,
  createManufacturingJob,
  updateManufacturingJobStatus,
  getSalesOrders,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { PlusIcon, RefreshIcon } from '../components/common/Icons';

const KANBAN_COLUMNS = [
  { id: 'queued', label: 'Queued', accent: 'var(--slate)' },
  { id: 'in_progress', label: 'In Progress', accent: 'var(--teal)' },
  { id: 'qc', label: 'Quality Control', accent: '#5E3EA1' },
  { id: 'done', label: 'Completed', accent: 'var(--success)' },
];

export function ManufacturingPage() {
  const { isStaff } = useAuth();
  const { showToast } = useToast();

  const [jobs, setJobs] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSalesOrderId, setSelectedSalesOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await getManufacturingJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(err.message || 'Failed to fetch manufacturing shopfloor jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesOrdersList = async () => {
    try {
      const orders = await getSalesOrders();
      if (Array.isArray(orders)) setSalesOrders(orders);
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchSalesOrdersList();
  }, []);

  const handleStatusChange = async (jobId, newStatus) => {
    try {
      await updateManufacturingJobStatus(jobId, newStatus);
      showToast(`Job transitioned to ${newStatus.toUpperCase()}`, 'success');
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      );
    } catch (err) {
      showToast(err.message || 'Failed to update job status', 'error');
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!selectedSalesOrderId) {
      showToast('Please select a valid Sales Order to queue production', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createManufacturingJob({
        sales_order_id: Number(selectedSalesOrderId) || selectedSalesOrderId,
      });

      showToast('Manufacturing job launched into production queue!', 'success');
      setShowCreateModal(false);
      setSelectedSalesOrderId('');
      fetchJobs();
    } catch (err) {
      showToast(err.message || 'Failed to initialize manufacturing job', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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
          <h2>Manufacturing Floor</h2>
          <p style={{ color: 'var(--slate)', fontSize: '0.88rem' }}>
            Shop floor Kanban control tracking jobs from scheduling through quality inspection.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchJobs}
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
            <span>New Production Job</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="spinner-container">
          <div className="spinner"></div>
          <span>Loading shopfloor assembly board...</span>
        </div>
      ) : (
        /* KANBAN BOARD */
        <div className="kanban-board">
          {KANBAN_COLUMNS.map((column) => {
            const columnJobs = jobs.filter(
              (job) => (job.status || 'queued') === column.id
            );

            return (
              <div key={column.id} className="kanban-column">
                <div
                  className="kanban-column-header"
                  style={{ borderBottomColor: column.accent }}
                >
                  <div className="kanban-column-title" style={{ color: column.accent }}>
                    <span>{column.label}</span>
                  </div>
                  <span className="kanban-count-pill">{columnJobs.length}</span>
                </div>

                <div className="kanban-cards-container">
                  {columnJobs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--slate)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                      No active jobs
                    </div>
                  ) : (
                    columnJobs.map((job) => {
                      const currentIndex = KANBAN_COLUMNS.findIndex((c) => c.id === job.status);
                      const prevColumn = currentIndex > 0 ? KANBAN_COLUMNS[currentIndex - 1] : null;
                      const nextColumn = currentIndex < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[currentIndex + 1] : null;

                      return (
                        <div key={job.id} className="kanban-card">
                          <div className="kanban-card-header">
                            <span className="data-code">
                              {job.order_code || `SO-#${job.sales_order_id}`}
                            </span>
                            <StatusBadge status={job.status} />
                          </div>

                          <div className="kanban-card-customer">
                            {job.customer_name || 'Standard Client Order'}
                          </div>

                          <div className="kanban-card-meta">
                            <span>Job #{job.id}</span>
                            <span>{formatTimestamp(job.updated_at)}</span>
                          </div>

                          {/* Quick Workflow Shifters */}
                          <div className="kanban-card-actions">
                            {prevColumn && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ flex: 1, fontSize: '0.72rem', padding: '0.2rem' }}
                                onClick={() => handleStatusChange(job.id, prevColumn.id)}
                                title={`Move back to ${prevColumn.label}`}
                              >
                                &larr; {prevColumn.label.split(' ')[0]}
                              </button>
                            )}

                            {nextColumn && (
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ flex: 1, fontSize: '0.72rem', padding: '0.2rem' }}
                                onClick={() => handleStatusChange(job.id, nextColumn.id)}
                                title={`Advance to ${nextColumn.label}`}
                              >
                                {nextColumn.label.split(' ')[0]} &rarr;
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE JOB MODAL (POST /api/manufacturing-jobs) */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Release Job to Manufacturing</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateJob}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label form-label-required">
                    Select Sales Order Demand
                  </label>
                  <select
                    className="form-select font-mono"
                    value={selectedSalesOrderId}
                    onChange={(e) => setSelectedSalesOrderId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Sales Order to Manufacture --</option>
                    {salesOrders.map((so) => (
                      <option key={so.id} value={so.id}>
                        {so.order_code} — {so.customer_name} (Stage: {so.stage})
                      </option>
                    ))}
                  </select>
                  <span className="form-help">
                    Creating a job will place the order in the 'Queued' status on the production floor.
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
                  {submitting ? 'Dispatching...' : 'Dispatch Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
