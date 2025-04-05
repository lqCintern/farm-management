import React, { useState } from "react";
import { loginUser } from "../services/authService"; // Import hàm loginUser

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await loginUser({ email: username, password }); // Gọi hàm loginUser
      console.log("Login successful:", response.data);

      // Lưu token vào localStorage
      localStorage.setItem("token", response.data.token);

      // Hiển thị thông báo
      alert("Đăng nhập thành công!");

      // Chuyển hướng đến trang khác (ví dụ: Dashboard)
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login failed:", error);
      alert("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    }
  };

  return (
    <div>
      <h2>Đăng nhập</h2>
      <input
        type="text"
        placeholder="Tên đăng nhập"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Mật khẩu"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Đăng nhập</button>
    </div>
  );
};

export default LoginPage;