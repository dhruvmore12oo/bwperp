import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, login as apiLogin, logout as apiLogout, register as apiRegister } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, name, email, role }
  const [loading, setLoading] = useState(true);

  // Check existing session on application initialization
  const checkAuth = useCallback(async () => {
    try {
      const response = await getCurrentUser();
      if (response && response.user) {
        setUser(response.user);
      } else {
        setUser(null);
      }
    } catch {
      // 401 or network error -> session does not exist
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Global listener for 401 response emitted by apiRequest
    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('flowline:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('flowline:unauthorized', handleUnauthorized);
    };
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    const response = await apiLogin(email, password);
    if (response && response.user) {
      setUser(response.user);
      return response.user;
    }
    throw new Error('Invalid response structure from login endpoint');
  };

  // Register / Sign-up handler
  const register = async (userData) => {
    const response = await apiRegister(userData);
    if (response && response.pendingApproval) {
      // Pending Admin Verification: account created with is_active: false
      setUser(null);
      return response;
    }
    if (response && response.user) {
      setUser(response.user);
      return response.user;
    }
    throw new Error('Invalid response structure from registration endpoint');
  };

  // Logout handler
  const logout = async () => {
    try {
      await apiLogout();
    } catch (err) {
      console.warn('Logout API warning:', err);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager' || user?.role === 'admin',
    isStaff: user?.role === 'staff',
    login,
    register,
    logout,
    refreshUser: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
