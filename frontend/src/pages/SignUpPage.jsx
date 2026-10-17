import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function SignUpPage() {
  const { user, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Redirect if user is already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Wizard Step: 1 (Credentials), 2 (Role & Questions), 3 (Review & Confirmation)
  const [step, setStep] = useState(1);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('staff'); // 'admin' | 'manager' | 'staff'

  // Role-Specific Profile Questionnaire Answers
  const [adminEmployeeCount, setAdminEmployeeCount] = useState('26-100');
  const [adminDepartment, setAdminDepartment] = useState('Plant Operations & Systems');

  const [managerDomain, setManagerDomain] = useState('Shopfloor Fabrication & Kanban');
  const [managerSector, setManagerSector] = useState('Sector A: MIG/TIG Machines & Welding Torches');

  const [staffWorkstation, setStaffWorkstation] = useState('Bay 01 — Welding & Assembly Line');
  const [staffShift, setStaffShift] = useState('Morning Shift (06:00 - 14:00)');

  const [submitting, setSubmitting] = useState(false);

  // Step 1 validation
  const handleProceedToStep2 = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Please enter your full name.', 'error');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      showToast('Please enter a valid work email address.', 'error');
      return;
    }

    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match. Please verify.', 'error');
      return;
    }

    setStep(2);
  };

  // Step 2 validation
  const handleProceedToStep3 = (e) => {
    e.preventDefault();
    setStep(3);
  };

  // Final submission to backend
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      showToast(`Welcome to Flowline, ${name.trim()}! Account provisioned.`, 'success');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.message || 'Registration failed. Please check your details.';
      showToast(msg, 'error');
      // If error (e.g. duplicate email), step back to step 1
      if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('email')) {
        setStep(1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container" style={{ padding: '2rem 1rem' }}>
      <div className="login-card" style={{ maxWidth: '580px' }}>
        {/* Card Header */}
        <div className="login-header">
          <div className="login-logo-badge">F</div>
          <h1 className="login-title">Brightweld Flowline</h1>
          <p className="login-subtitle">Personnel Onboarding & Access Provisioning</p>

          {/* Stepper Progress Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: step >= 1 ? '#FFFFFF' : '#6C7D95',
                fontWeight: step === 1 ? '700' : '500',
              }}
            >
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: step >= 1 ? 'var(--teal)' : 'rgba(255,255,255,0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                }}
              >
                1
              </span>
              <span>Credentials</span>
            </div>

            <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: step >= 2 ? '#FFFFFF' : '#6C7D95',
                fontWeight: step === 2 ? '700' : '500',
              }}
            >
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: step >= 2 ? 'var(--teal)' : 'rgba(255,255,255,0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                }}
              >
                2
              </span>
              <span>Role Profile</span>
            </div>

            <div style={{ width: '24px', height: '1px', background: 'rgba(255,255,255,0.2)' }} />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: step === 3 ? '#FFFFFF' : '#6C7D95',
                fontWeight: step === 3 ? '700' : '500',
              }}
            >
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: step === 3 ? 'var(--teal)' : 'rgba(255,255,255,0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                }}
              >
                3
              </span>
              <span>Confirm</span>
            </div>
          </div>
        </div>

        <div className="login-body">
          {/* ============================================================== */}
          {/* STEP 1: CREDENTIALS & BASIC INFORMATION                        */}
          {/* ============================================================== */}
          {step === 1 && (
            <form onSubmit={handleProceedToStep2}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Create Operator Account</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>
                  Enter your professional credentials for the Brightweld Pune plant.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="reg-name">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dev Patel"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="reg-email">
                  Work / Corporate Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  className="form-input font-mono"
                  placeholder="dev.patel@brightweld.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <span className="form-help">Must be a unique enterprise email address.</span>
              </div>

              <div className="grid-cols-2">
                <div className="form-group">
                  <label className="form-label form-label-required" htmlFor="reg-password">
                    Password
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    className="form-input font-mono"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span className="form-help">At least 6 characters.</span>
                </div>

                <div className="form-group">
                  <label className="form-label form-label-required" htmlFor="reg-confirm-password">
                    Confirm Password
                  </label>
                  <input
                    id="reg-confirm-password"
                    type="password"
                    className="form-input font-mono"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
              >
                Proceed to Role & Station Setup &rarr;
              </button>

              <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.84rem' }}>
                <span style={{ color: 'var(--slate)' }}>Already have an existing profile? </span>
                <Link to="/login" style={{ color: 'var(--teal)', fontWeight: '600', textDecoration: 'none' }}>
                  Sign In here
                </Link>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* STEP 2: ROLE SELECTION & ROLE-SPECIFIC QUESTIONNAIRE           */}
          {/* ============================================================== */}
          {step === 2 && (
            <form onSubmit={handleProceedToStep3}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Select Role & Operational Profile</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>
                  Configure your security tier and answer role-specific setup questions.
                </p>
              </div>

              {/* Role Radio Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                {/* Admin Card */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${role === 'admin' ? 'var(--teal)' : 'var(--border)'}`,
                    backgroundColor: role === 'admin' ? 'var(--surface-alt)' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="role-selection"
                    value="admin"
                    checked={role === 'admin'}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ marginTop: '0.25rem' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.92rem' }}>System & Plant Administrator</strong>
                      <span className="badge badge-demand" style={{ background: 'var(--ink)', color: '#FFFFFF', fontSize: '0.68rem' }}>
                        ADMIN
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--slate)', marginTop: '0.2rem', lineHeight: '1.3' }}>
                      Full facility governance, user account provisioning, role adjustments, and complete security oversight.
                    </p>
                  </div>
                </label>

                {/* Manager Card */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${role === 'manager' ? 'var(--teal)' : 'var(--border)'}`,
                    backgroundColor: role === 'manager' ? 'var(--surface-alt)' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="role-selection"
                    value="manager"
                    checked={role === 'manager'}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ marginTop: '0.25rem' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.92rem' }}>Operations & Production Manager</strong>
                      <span className="badge badge-procurement" style={{ fontSize: '0.68rem' }}>
                        MANAGER
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--slate)', marginTop: '0.2rem', lineHeight: '1.3' }}>
                      Fulfillment pipeline control, procurement approvals, shopfloor Kanban dispatching, and financial reports.
                    </p>
                  </div>
                </label>

                {/* Staff Card */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${role === 'staff' ? 'var(--teal)' : 'var(--border)'}`,
                    backgroundColor: role === 'staff' ? 'var(--surface-alt)' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="role-selection"
                    value="staff"
                    checked={role === 'staff'}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ marginTop: '0.25rem' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.92rem' }}>Shopfloor Operator & Assembly Staff</strong>
                      <span className="badge badge-production" style={{ fontSize: '0.68rem' }}>
                        STAFF
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--slate)', marginTop: '0.2rem', lineHeight: '1.3' }}>
                      Shopfloor order logging, inventory parts verification, assembly task progression, and defect flagging.
                    </p>
                  </div>
                </label>
              </div>

              {/* Dynamic Questionnaire Box based on Role Selection */}
              <div style={{ background: 'var(--surface-alt)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--teal)', display: 'block', marginBottom: '0.75rem' }}>
                  📋 Role Profile Questionnaire: {role.toUpperCase()}
                </span>

                {/* ADMIN Questionnaire */}
                {role === 'admin' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">
                        Approximate Plant Workforce / Personnel to Manage
                      </label>
                      <select
                        className="form-select font-mono"
                        value={adminEmployeeCount}
                        onChange={(e) => setAdminEmployeeCount(e.target.value)}
                      >
                        <option value="1-25">1–25 Operators (Pilot Plant / Fabrication Unit)</option>
                        <option value="26-100">26–100 Operators (Standard Assembly Plant)</option>
                        <option value="101-500">101–500 Operators (Heavy Industrial Facility)</option>
                        <option value="500+">500+ Operators (Multi-Plant Enterprise)</option>
                      </select>
                      <span className="form-help">Calibrates system security tiers and license allocation.</span>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        Primary Governance Scope
                      </label>
                      <select
                        className="form-select"
                        value={adminDepartment}
                        onChange={(e) => setAdminDepartment(e.target.value)}
                      >
                        <option value="Plant Operations & Systems">Plant Operations & Systems Governance</option>
                        <option value="Executive Management & Audit">Executive Management & Financial Audit</option>
                        <option value="Plant IT & Infrastructure">Plant IT & Database Administration</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* MANAGER Questionnaire */}
                {role === 'manager' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">
                        Primary Operational Responsibility
                      </label>
                      <select
                        className="form-select"
                        value={managerDomain}
                        onChange={(e) => setManagerDomain(e.target.value)}
                      >
                        <option value="Shopfloor Fabrication & Kanban">Shopfloor Fabrication & Kanban Assembly</option>
                        <option value="Supply Chain & Procurement">Supply Chain & Supplier Requisitions</option>
                        <option value="Sales Demand & Order Fulfillment">Sales Demand & Customer Fulfillment</option>
                        <option value="Quality Assurance & Compliance">Quality Assurance & Inspection Control</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        Assigned Manufacturing Sector
                      </label>
                      <select
                        className="form-select"
                        value={managerSector}
                        onChange={(e) => setManagerSector(e.target.value)}
                      >
                        <option value="Sector A: MIG/TIG Machines & Welding Torches">Sector A: MIG/TIG Machines & Welding Torches</option>
                        <option value="Sector B: Argon Cylinders & Shielding Gases">Sector B: Argon Cylinders & Shielding Gases</option>
                        <option value="Sector C: High-Pressure Flanges & Fittings">Sector C: High-Pressure Flanges & Fittings</option>
                        <option value="Sector D: Heavy Structural Steel Fabrication">Sector D: Heavy Structural Steel Fabrication</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* STAFF Questionnaire */}
                {role === 'staff' && (
                  <div>
                    <div className="form-group">
                      <label className="form-label">
                        Assigned Workstation Bay
                      </label>
                      <select
                        className="form-select font-mono"
                        value={staffWorkstation}
                        onChange={(e) => setStaffWorkstation(e.target.value)}
                      >
                        <option value="Bay 01 — Welding & Assembly Line">Bay 01 — Welding & Assembly Line</option>
                        <option value="Bay 02 — Raw Material Staging Bins">Bay 02 — Raw Material Staging Bins</option>
                        <option value="Bay 03 — Final QC & Quality Inspection">Bay 03 — Final QC & Quality Inspection</option>
                        <option value="Bay 04 — Packaging & Dispatch Dock">Bay 04 — Packaging & Dispatch Dock</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">
                        Scheduled Working Shift
                      </label>
                      <select
                        className="form-select"
                        value={staffShift}
                        onChange={(e) => setStaffShift(e.target.value)}
                      >
                        <option value="Morning Shift (06:00 - 14:00)">Morning Shift (06:00 – 14:00)</option>
                        <option value="General Day Shift (09:00 - 17:00)">General Day Shift (09:00 – 17:00)</option>
                        <option value="Night Shift (22:00 - 06:00)">Night Shift (22:00 – 06:00)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setStep(1)}
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                >
                  Review & Confirm &rarr;
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* STEP 3: REVIEW & CONFIRMATION                                  */}
          {/* ============================================================== */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Confirm Account Provisioning</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>
                  Verify your profile details before initializing your workspace session.
                </p>
              </div>

              {/* Summary Card */}
              <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>Operator Name</span>
                  <strong>{name}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>Work Email</span>
                  <span className="font-mono" style={{ fontSize: '0.85rem' }}>{email}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--slate)' }}>Security Tier</span>
                  <span
                    className={`badge ${
                      role === 'admin'
                        ? 'badge-demand'
                        : role === 'manager'
                        ? 'badge-procurement'
                        : 'badge-production'
                    }`}
                    style={role === 'admin' ? { background: 'var(--ink)', color: '#fff' } : {}}
                  >
                    {role.toUpperCase()}
                  </span>
                </div>

                {/* Role Specific Details */}
                {role === 'admin' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>Personnel Scope</span>
                      <span className="font-mono" style={{ fontSize: '0.8rem' }}>{adminEmployeeCount} Operators</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>Governance</span>
                      <span style={{ fontSize: '0.8rem' }}>{adminDepartment}</span>
                    </div>
                  </>
                )}

                {role === 'manager' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>Primary Focus</span>
                      <span style={{ fontSize: '0.8rem' }}>{managerDomain}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>Assigned Line</span>
                      <span style={{ fontSize: '0.8rem' }}>{managerSector}</span>
                    </div>
                  </>
                )}

                {role === 'staff' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>Workstation Bay</span>
                      <span style={{ fontSize: '0.8rem' }}>{staffWorkstation}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--slate)' }}>Shift</span>
                      <span style={{ fontSize: '0.8rem' }}>{staffShift}</span>
                    </div>
                  </>
                )}
              </div>

              <div style={{ background: 'var(--surface-muted)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.78rem', color: 'var(--slate)' }}>
                <strong>Session Security Notice:</strong> Account will be persisted in PostgreSQL and authenticated with an HTTP-only session cookie.
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setStep(2)}
                  disabled={submitting}
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={submitting}
                >
                  {submitting ? 'Provisioning Account...' : 'Create Account & Sign In'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
