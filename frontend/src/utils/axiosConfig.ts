import axios from "axios";
import { getToken } from "./storage";

// Lấy API URL từ environment variable hoặc fallback về localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Instance chính có thêm token cho các endpoint cần xác thực
const axiosInstance = axios.create({
  baseURL: `${API_URL}/controllers/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Instance riêng cho các endpoints không cần xác thực
export const publicAxiosInstance = axios.create({
  baseURL: `${API_URL}/controllers/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Chỉ thêm interceptor vào instance chính
axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
