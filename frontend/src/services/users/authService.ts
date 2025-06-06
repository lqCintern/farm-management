import axiosInstance, { publicAxiosInstance } from "@/utils/axiosConfig";

// Sử dụng publicAxiosInstance cho các endpoints không cần xác thực
export const registerUser = async (userData: any) => {
  return publicAxiosInstance.post("/users/register", userData);
};

export const loginUser = async (credentials: any) => {
  return publicAxiosInstance.post("/users/login", credentials);
};

export const sendForgotPasswordEmail = async (email: string) => {
  return publicAxiosInstance.post("/users/auth/forgot_password", { email });
};

export const resetPassword = async (token: string | null, password: string) => {
  return publicAxiosInstance.post("/users/auth/reset_password", { token, password });
};

// Các endpoints cần xác thực vẫn sử dụng axiosInstance với token
export const getUserProfile = async () => {
  try {
    const response = await axiosInstance.get("/users/auth/profile");
    return response.data; // Trả về thông tin người dùng
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};
