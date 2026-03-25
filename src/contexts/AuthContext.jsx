import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

// ✅ API URL
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://pet-groom-app.onrender.com";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // ================= SEND OTP =================
  const sendOTP = async (email) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/send-otp`, {
        email: email
      });

      console.log("OTP SENT:", res.data);
      return res.data;

    } catch (error) {
      console.error("SEND OTP ERROR:", error.response?.data || error);
      throw error;
    }
  };

  // ================= VERIFY OTP =================
  const verifyOTP = async (email, otp) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email: email,
        otp: otp
      });

      console.log("OTP VERIFIED:", res.data);

      // ✅ since backend doesn't return token, just mark user as logged in
      setUser({ email });

      return res.data;

    } catch (error) {
      console.error("VERIFY OTP ERROR:", error.response?.data || error);
      throw error;
    }
  };

  // ================= LOGOUT =================
  const logout = () => {
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
