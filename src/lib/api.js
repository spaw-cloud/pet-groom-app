import axios from "axios";

const api = axios.create({
  baseURL: "https://pet-groom-app.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
