import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
baseURL: `${BACKEND_URL}/api`,
});

api.interceptors.request.use((config) => {
const token = localStorage.getItem('session_token');
if (token) {
config.headers.Authorization = `Bearer ${token}`;
}
return config;
});

api.interceptors.response.use(
(response) => response,
(error) => {
if (error.response?.status === 401) {
const url = error.config?.url || '';
if (!url.includes('/auth/')) {
localStorage.removeItem('session_token');
}
}
return Promise.reject(error);
}
);

export default api;
