import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { PlusIcon, RefreshIcon } from '../components/common/Icons';

const AVAILABLE_ROLES = ['admin', 'manager', 'staff'];

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsersList = async () => {
    setLoading(true);
    setForbidden(false);
    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.status === 403) {
        setForbidden(true);
        showToast('Forbidden: You do not possess administrator rights to access user management.', 'error');
      } else {
        showToast(err.message || 'Failed to fetch user directory', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  const handleToggleActive = async (user) => {
    const nextStatus = !user.is_active;
    try {
      await updateUser(user.id, { is_active: nextStatus });
      showToast(`User ${user.name} is now ${nextStatus ? 'ACTIVE' : 'DEACTIVATED'}`, 'success');
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: nextStatus } : u))
      );
    } catch (err) {
      showToast(err.message || 'Failed to update user status', 'error');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUser(userId, { role: newRole });
      showToast('User role updated successfully', 'success');
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      showToast(err.message || 'Failed to change user role', 'error');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      showToast('All fields are required to provision a user account', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });

      showToast(`User ${name} provisioned successfully!`, 'success');
      setShowCreateModal(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('staff');
      fetchUsersList();
    } catch (err) {
      showToast(err.message || 'Failed to provision user', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (forbidden) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ color: 'var(--danger)' }}>
            403 Forbidden Access
          </h3>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--slate)', marginBottom: '1rem' }}>
            The backend server rejected the request. Only users with the <code>admin</code> role are allowed to view and manage accounts.
          </p>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/'}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h2>User & Role Management</h2>
          <p style={{ color: 'var(--slate)', fontSize: '0.88rem' }}>
            System-wide authorization, credentials provisioning, and security tiers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchUsersList}
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
            <span>Provision New User</span>
          </button>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Authorized Personnel Directory</h3>
            <p className="card-description">
              Total active profiles: <span className="font-mono">{users.length}</span>
            </p>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="spinner-container">
              <div className="spinner"></div>
              <span>Querying user directory...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No User Records Returned</div>
              <p className="empty-state-text">No additional operator accounts found in directory.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Assigned Role</th>
                    <th>Account Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = currentUser && currentUser.id === u.id;

                    return (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.name}</strong>
                          {isSelf && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--teal)', marginLeft: '0.5rem', fontWeight: 600 }}>
                              (You)
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="font-mono" style={{ fontSize: '0.82rem' }}>{u.email}</span>
                        </td>
                        <td>
                          <select
                            className="form-select font-mono"
                            style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
                            value={u.role || 'staff'}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            disabled={isSelf} // Prevent demoting own current account
                          >
                            {AVAILABLE_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <StatusBadge
                            status={u.is_active ? 'active' : 'inactive'}
                            label={u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className={`btn btn-sm ${u.is_active ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => handleToggleActive(u)}
                            disabled={isSelf}
                            title={isSelf ? 'Cannot deactivate active logged-in user' : 'Toggle account status'}
                          >
                            {u.is_active ? 'Deactivate' : 'Reactivate'}
                          </button>
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

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Provision New Flowline User</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label form-label-required">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Rachel Adams"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label form-label-required">Email Address</label>
                  <input
                    type="email"
                    className="form-input font-mono"
                    placeholder="rachel.adams@brightweld.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid-cols-2">
                  <div className="form-group">
                    <label className="form-label form-label-required">Initial Password</label>
                    <input
                      type="password"
                      className="form-input font-mono"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label form-label-required">System Role</label>
                    <select
                      className="form-select font-mono"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="staff">STAFF (Shopfloor / View Only)</option>
                      <option value="manager">MANAGER (Fulfillment / Orders)</option>
                      <option value="admin">ADMIN (Full Security & Role Access)</option>
                    </select>
                  </div>
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
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
