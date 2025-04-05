import axiosInstance from "../utils/axiosConfig";

// Hàm gọi API đăng ký
export const registerUser = async (userData: any) => {
  return axiosInstance.post("/register", userData);
};

// Hàm gọi API đăng nhập
export const loginUser = async (credentials: any) => {
  return axiosInstance.post("/login", credentials);
};