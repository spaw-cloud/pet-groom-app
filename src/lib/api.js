import axios from "axios";

// ✅ LIVE BACKEND URL (Render)
export const API_BASE_URL = "https://pet-groom-app.onrender.com";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;