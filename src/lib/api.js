import axios from "axios";

// ✅ Backend URL (Render)
export const API_BASE_URL = "https://pet-groom-app.onrender.com";

// ✅ Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ RESPONSE INTERCEPTOR (better error handling)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error?.response?.data || error.message);

    return Promise.reject(
      error?.response?.data || { message: "Something went wrong" }
    );
  }
);

export default api;