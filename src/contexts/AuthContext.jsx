import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// ✅ HARD FIX (no env issues)
const API_URL = "https://pet-groom-app.onrender.com";

console.log("API_URL:", API_URL);

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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

    } catch (error) {
      console.error("CHECK AUTH ERROR:", error);
      localStorage.removeItem('session_token');
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
      const res = await axios.post(`${API_URL}/api/auth/send-otp`, {
        email
      });

      console.log("OTP SENT:", res.data);
      return res.data;

    } catch (error) {
      console.error("SEND OTP ERROR:", error?.response?.data || error);
      throw error;
    }
  };

  // ================= VERIFY OTP =================
  const verifyOTP = async (email, otp) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/verify-otp`,
        { email, otp }
      );

      console.log("VERIFY RESPONSE:", res.data);

      // ✅ TEMP FIX (since backend doesn't return token yet)
      setUser({ email });

      return res.data;

    } catch (error) {
      console.error("OTP VERIFY ERROR:", error?.response?.data || error);
      throw error;
    }
  };

  // ================= LOGOUT =================
  const logout = () => {
    localStorage.removeItem('session_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sendOTP,
        verifyOTP,
        logout
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
