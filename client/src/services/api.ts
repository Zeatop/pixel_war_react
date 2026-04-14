import axios from "axios";
import { API_URL } from "../config";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Intercepteur : attache le JWT a chaque requete
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pixelwar-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur reponse : redirige vers login si 401
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