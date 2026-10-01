import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Module Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SalesOrdersPage } from './pages/SalesOrdersPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { InventoryPage } from './pages/InventoryPage';
import { ManufacturingPage } from './pages/ManufacturingPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Application Shell */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="sales-orders" element={<SalesOrdersPage />} />
              <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="manufacturing" element={<ManufacturingPage />} />
              <Route path="reports" element={<ReportsPage />} />

              {/* Admin Only Route Guard */}
              <Route
                path="users"
                element={
                  <ProtectedRoute requireAdmin={true}>
                    <UsersPage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
