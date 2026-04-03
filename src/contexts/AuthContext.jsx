import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { API_BASE_URL } from "../lib/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export function AuthProvider({ children }) {
  const [sessionToken, setSessionToken] = useState(() =>
    localStorage.getItem("session_token")
  );
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user_profile");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const persistSession = useCallback((token, profile) => {
    if (token) localStorage.setItem("session_token", token);
    else localStorage.removeItem("session_token");
    setSessionToken(token || null);
    if (profile) {
      localStorage.setItem("user_profile", JSON.stringify(profile));
      setUser(profile);
    } else {
      localStorage.removeItem("user_profile");
      setUser(null);
    }
  }, []);

  const sendOtp = useCallback(async (phone) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: String(phone) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "Failed to send OTP");
    return data;
  }, []);

  const verifyOtp = useCallback(async (phone, otp) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: String(phone), otp: String(otp) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "OTP verification failed");
    const token = data.session_token;
    const profile = data.user || {
      name: "Pet Parent",
      phone: data.phone || phone,
      email: "",
    };
    persistSession(token, profile);
    localStorage.setItem("clientToken", "1");
    return data;
  }, [persistSession]);

  const logout = useCallback(async () => {
    persistSession(null, null);
    localStorage.removeItem("clientToken");
  }, [persistSession]);

  const value = useMemo(
    () => ({
      user,
      token: sessionToken,
      sessionToken,
      sendOtp,
      verifyOtp,
      logout,
      persistSession,
    }),
    [user, sessionToken, sendOtp, verifyOtp, logout, persistSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
