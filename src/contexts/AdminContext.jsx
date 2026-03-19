import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;

const AdminContext = createContext(undefined);

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const savedToken = localStorage.getItem('admin_token');
      if (savedToken) {
        try {
          const res = await axios.get(`${BACKEND_URL}/api/admin/me`, {
            headers: { Authorization: `Bearer ${savedToken}` },
          });
          setAdmin(res.data);
          setToken(savedToken);
        } catch {
          localStorage.removeItem('admin_token');
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (phone, password) => {
    const res = await axios.post(`${BACKEND_URL}/api/admin/login`, { phone, password });
    if (res.data.success) {
      localStorage.setItem('admin_token', res.data.token);
      setToken(res.data.token);
      setAdmin(res.data.admin);
    }
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
    setToken(null);
  }, []);

  return (
    <AdminContext.Provider value={{ admin, token, loading, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be inside AdminProvider');
  return ctx;
};
