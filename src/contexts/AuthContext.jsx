import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const savedToken = localStorage.getItem('session_token');
      if (!savedToken) { setLoading(false); return; }
      const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      setUser(response.data);
      setToken(savedToken);
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem('session_token');
      } else {
        const savedToken = localStorage.getItem('session_token');
        if (savedToken) setToken(savedToken);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkAuth(); }, []);

  const sendOTP = async (email) => {
  try {
    await axios.post(`${BACKEND_URL}/api/auth/send-otp`, { email });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    throw error;
  }
};
  
  const verifyOTP = async (email, otp) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/auth/verify-otp`,
      {
        email: email,
        otp: otp,
      }
    );

    const sessionToken = response.data.session_token;

    if (!sessionToken) {
      throw new Error("No session token received");
    }

    // ✅ Store session
    localStorage.setItem("session_token", sessionToken);

    // ✅ Extract user data
    const { session_token, ...userData } = response.data;

    // ✅ Set state
    setUser(userData);
    setToken(sessionToken);

    return response.data;

  } catch (error) {
    console.error("OTP VERIFY ERROR:", error);
    throw error;
  }
};

  const logout = async () => {
    try {
      const t = localStorage.getItem('session_token');
      if (t) {
        await axios.post(`${BACKEND_URL}/api/auth/logout`, {}, { headers: { Authorization: `Bearer ${t}` } });
      }
    } catch {}
    localStorage.removeItem('session_token');
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => { await checkAuth(); };

  const resendOTP = async (email) => {
    await axios.post(`${BACKEND_URL}/api/auth/resend-otp`, { email });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, sendOTP, verifyOTP, resendOTP, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
