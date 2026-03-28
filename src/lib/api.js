import axios from "axios";

const API_BASE = "https://pet-groom-app.onrender.com";

const api = axios.create({
  baseURL: API_BASE,
});

// OTP API
export const sendOtp = (data) => api.post("/api/auth/send-otp", data);

// Services API
export const getServices = () => api.get("/api/services");

export default api;
