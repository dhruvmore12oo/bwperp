import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const SEED_USERS = [
  { role: 'admin', label: 'ADMIN (Sufiyan)', email: 'sufiyan@brightweld.com', password: 'password123' },
  { role: 'manager', label: 'MANAGER (Dhruv)', email: 'dhruv@brightweld.com', password: 'password123' },
  { role: 'staff', label: 'STAFF (Twisha)', email: 'twisha@brightweld.com', password: 'password123' },
];

export function LoginPage() {
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect away
  if (user) {
    const destination = location.state?.from?.pathname || '/';
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      showToast('Authentication successful. Welcome to Flowline.', 'success');
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectSeedUser = (seedUser) => {
    setEmail(seedUser.email);
    setPassword(seedUser.password);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-badge">F</div>
          <h1 className="login-title">Brightweld Flowline</h1>
          <p className="login-subtitle">Manufacturing ERP & Shopfloor Control</p>
        </div>

        <div className="login-body">
          {/* Quick Demo Credentials Selector */}
          <div style={{ marginBottom: '1.25rem', padding: '0.85rem', background: 'var(--surface-alt)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--teal)', display: 'block', marginBottom: '0.5rem' }}>
              ⚡ Quick Fill Seed Accounts
            </span>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {SEED_USERS.map((seed) => (
                <button
                  key={seed.email}
                  type="button"
                  className="btn btn-secondary btn-sm font-mono"
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
                  onClick={() => handleSelectSeedUser(seed)}
                >
                  {seed.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="email">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                className="form-input font-mono"
                placeholder="sufiyan@brightweld.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={submitting}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label-required" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-input font-mono"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
              disabled={submitting}
            >
              {submitting ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Academic Prototype Notice with Credentials Info */}
          <div style={{ marginTop: '1.5rem', padding: '0.85rem', background: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--slate)', display: 'block', marginBottom: '0.35rem' }}>
              Database Seed Credentials (Password: <code>password123</code>)
            </span>
            <div style={{ fontSize: '0.78rem', color: 'var(--slate)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div><strong>Admin:</strong> <code>sufiyan@brightweld.com</code></div>
              <div><strong>Manager:</strong> <code>dhruv@brightweld.com</code></div>
              <div><strong>Staff:</strong> <code>twisha@brightweld.com</code></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
