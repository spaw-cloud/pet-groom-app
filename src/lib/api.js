import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://127.0.0.1:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const path = `${config.baseURL || ""}${config.url || ""}`;
  const isAdminPath = path.includes("/api/admin/");
  const adminTok = localStorage.getItem("admin_token");
  const sessionTok = localStorage.getItem("session_token");
  const token = isAdminPath ? adminTok : sessionTok;
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
