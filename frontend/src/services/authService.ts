import axiosInstance from "@/utils/axiosConfig"; // Ensure the file exists at this path or adjust the path accordingly

// Hàm gọi API đăng ký
export const registerUser = async (userData: any) => {
  return axiosInstance.post("/register", userData);
};

// Hàm gọi API đăng nhập
export const loginUser = async (credentials: any) => {
  return axiosInstance.post("/login", credentials);
};

export const sendForgotPasswordEmail = async (email: string) => {
    return axios.post("/auth/forgot_password", { email });
};

export const resetPassword = async (token: string | null, password: string) => {
    return axios.post("/auth/reset_password", { token, password });
};
