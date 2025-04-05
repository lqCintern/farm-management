import React, { useState } from "react";
import axios from "axios";

const RegisterPage: React.FC = () => {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");

  const handleRegister = async () => {
    try {
      const response = await axios.post("http://localhost:3000/register", {
        user_name: userName,
        email,
        password,
        phone,
        fullname: fullName,
        address,
        user_type: 1,
      });
      console.log("Register successful:", response.data);

      // Hiển thị thông báo
      alert("Đăng ký thành công! Vui lòng đăng nhập.");

      // Chuyển hướng đến trang đăng nhập
      window.location.href = "/login";
    } catch (error) {
      console.error("Register failed:", error);
      alert("Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.");
    }
  };

  return (
    <div>
      <h2>Đăng ký</h2>
      <input
        type="text"
        placeholder="Tên đăng nhập"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Mật khẩu"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="text"
        placeholder="Số điện thoại"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <input
        type="text"
        placeholder="Họ và tên"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Địa chỉ"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <button onClick={handleRegister}>Đăng ký</button>
    </div>
  );
};

export default RegisterPage;