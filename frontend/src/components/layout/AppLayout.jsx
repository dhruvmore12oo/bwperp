import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  DashboardIcon,
  SalesIcon,
  PurchaseIcon,
  InventoryIcon,
  ManufacturingIcon,
  ReportsIcon,
  UsersIcon,
  LogoutIcon,
} from '../common/Icons';

export function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Derive human-readable page title from current path
  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/sales-orders')) return 'Sales Orders';
    if (pathname.startsWith('/purchase-orders')) return 'Purchase Orders';
    if (pathname.startsWith('/inventory')) return 'Inventory Management';
    if (pathname.startsWith('/manufacturing')) return 'Manufacturing Workflows';
    if (pathname.startsWith('/reports')) return 'Reports & Analytics';
    if (pathname.startsWith('/users')) return 'Users & Role Management';
    return 'Executive Dashboard';
  };

  // User initials for avatar
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'BW';

  return (
    <div className="app-container">
      {/* Fixed Left Sidebar Nav (Dark Ink Background) */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">F</div>
          <div className="brand-title">
            <span className="brand-name">FLOWLINE</span>
            <span className="brand-subtitle">Brightweld ERP</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Core Operations</div>

          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon"><DashboardIcon /></span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/sales-orders"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon"><SalesIcon /></span>
            <span>Sales Orders</span>
          </NavLink>

          <NavLink
            to="/purchase-orders"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon"><PurchaseIcon /></span>
            <span>Purchase Orders</span>
          </NavLink>

          <NavLink
            to="/inventory"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon"><InventoryIcon /></span>
            <span>Inventory</span>
          </NavLink>

          <NavLink
            to="/manufacturing"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon"><ManufacturingIcon /></span>
            <span>Manufacturing</span>
          </NavLink>

          <div className="nav-section-label" style={{ marginTop: '0.75rem' }}>
            Intelligence & Admin
          </div>

          <NavLink
            to="/reports"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon"><ReportsIcon /></span>
            <span>Reports</span>
          </NavLink>

          {/* User & Roles: Admin only — hidden entirely for non-admins */}
          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon"><UsersIcon /></span>
              <span>Users & Roles</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-company-meta">
            <strong>Brightweld Industries</strong>
            <span>Plant #04 • Pune Facility</span>
          </div>
        </div>
      </aside>

      {/* Main App Content Area */}
      <div className="main-wrapper">
        {/* Top Bar with Facility Info & User Meta */}
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-page-title">{getPageTitle(location.pathname)}</h1>
            <span className="topbar-facility-tag">PROD-ENV // V1.0</span>
          </div>

          <div className="topbar-right">
            <div className="user-badge-container">
              <div className="user-avatar" title={user?.email || 'User'}>
                {initials}
              </div>
              <div className="user-meta">
                <span className="user-name">{user?.name || 'Operator'}</span>
                <span className="user-role-tag">{user?.role || 'staff'}</span>
              </div>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
              title="Terminate session and logout"
            >
              <LogoutIcon />
              <span>Log out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Nested Route Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
