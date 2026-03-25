import React, { createContext, useContext, useState } from "react";

const BACKEND_URL = "https://pet-groom-app.onrender.com";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const sendOtp = async (email) => {
    try {
      console.log("API_URL:", BACKEND_URL);

      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to send OTP");
      }

      return data;
    } catch (err) {
      console.error("SEND OTP ERROR:", err);
      throw err;
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "OTP verification failed");
      }

      setUser(data.user || null);

      return data;
    } catch (err) {
      console.error("VERIFY ERROR:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, sendOtp, verifyOtp }}>
      {children}
    </AuthContext.Provider>
  );
}
