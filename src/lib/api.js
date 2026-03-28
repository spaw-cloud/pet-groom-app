const API_BASE = "https://pet-groom-app.onrender.com";

export const sendOtp = (data) => {
  return axios.post(`${API_BASE}/api/auth/send-otp`, data);
};
