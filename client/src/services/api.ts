import axios from "axios";
const API_URL = process.env.VITE_API_URL || process.env.API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Intercepteur : attache le JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pixelwar-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur réponse : redirige vers login si 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("pixelwar-token");
      localStorage.removeItem("pixelwar-user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;