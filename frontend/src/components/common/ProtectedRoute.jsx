import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="login-container">
        <div className="spinner-container">
          <div className="spinner"></div>
          <span>Verifying Flowline session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page and preserve return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="card-header">
          <div className="card-title" style={{ color: 'var(--danger)' }}>
            Access Restricted
          </div>
        </div>
        <div className="card-body">
          <p style={{ color: 'var(--slate)', marginBottom: '1rem' }}>
            This module requires <strong>Administrator</strong> privileges. Your current role is <code>{user.role}</code>.
          </p>
          <a href="/" className="btn btn-secondary">Return to Dashboard</a>
        </div>
      </div>
    );
  }

  return children;
}
