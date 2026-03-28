import axios from "axios";

const api = axios.create({
  baseURL: "https://pet-groom-app.onrender.com",
});

export default api;
