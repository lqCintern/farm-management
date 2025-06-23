import axios from "axios";
import { getToken } from "./storage";

// Instance chính có thêm token cho các endpoint cần xác thực
const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/controllers/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Instance riêng cho các endpoints không cần xác thực
export const publicAxiosInstance = axios.create({
  baseURL: "http://localhost:3000/controllers/api/v1",
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
