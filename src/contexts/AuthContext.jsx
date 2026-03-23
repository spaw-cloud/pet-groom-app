import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// ✅ Use ONE env variable everywhere
const API_URL = import.meta.env.VITE_API_URL;

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================= CHECK AUTH =================
  const checkAuth = async () => {
    try {
      const savedToken = localStorage.getItem('session_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      });

      setUser(response.data);
      setToken(savedToken);

    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem('session_token');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // ================= SEND OTP =================
  const sendOTP = async (email) => {
    try {
      await axios.post(`${API_URL}/api/auth/send-otp`, { email });
    } catch (error) {
      console.error("SEND OTP ERROR:", error);
      throw error;
    }
  };

  // ================= VERIFY OTP =================
  const verifyOTP = async (email, otp) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/verify-otp`,
        {
          email,
          otp,
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

      setUser(userData);
      setToken(sessionToken);

      return response.data;

    } catch (error) {
      console.error("OTP VERIFY ERROR:", error);
      throw error;
    }
  };

  // ================= RESEND OTP =================
  const resendOTP = async (email) => {
    try {
      await axios.post(`${API_URL}/api/auth/resend-otp`, { email });
    } catch (error) {
      console.error("RESEND OTP ERROR:", error);
      throw error;
    }
  };

  // ================= LOGOUT =================
  const logout = async () => {
    try {
      const t = localStorage.getItem('session_token');

      if (t) {
        await axios.post(
          `${API_URL}/api/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${t}` } }
        );
      }

    } catch (error) {
      console.error("LOGOUT ERROR:", error);
    }

    localStorage.removeItem('session_token');
    setUser(null);
    setToken(null);
  };

  // ================= REFRESH =================
  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        sendOTP,
        verifyOTP,
        resendOTP,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ================= HOOK =================
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
