import axios from "axios";

// ✅ Use correct ENV (Vercel) or fallback to Render backend
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://pet-groom-app.onrender.com";

// ✅ Create axios instance
const API = axios.create({
  baseURL: BASE_URL,
});

// ✅ Debug logs (VERY helpful)
console.log("API URL:", BASE_URL);

// ✅ Optional: handle errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "API ERROR:",
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export default API;
