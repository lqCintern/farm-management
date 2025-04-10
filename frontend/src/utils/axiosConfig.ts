import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3000/api/v1", // Cập nhật baseURL để trỏ đến namespace api/v1
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm interceptor để tự động thêm token vào header Authorization
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Lấy token từ localStorage
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
