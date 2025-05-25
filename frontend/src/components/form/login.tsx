import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, FormEvent } from "react";
import { loginUser } from "@/services/users/authService";
import { saveToken } from "@/utils/storage";

const LoginForm = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });

  // Cập nhật interface để bao gồm thông tin người dùng
  interface LoginResponse {
    token: string;
    user: {
      user_id: number;
      fullname: string;
      email: string;
      role?: string;
    };
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({ email: "", password: "", general: "" });

    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }

    if (!password) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
      return;
    }

    try {
      const response = await loginUser({ email, password });
      const data = response.data as LoginResponse;
      console.log("Login successful:", data);

      // Lưu token
      saveToken(data.token);

      // Lưu thông tin người dùng
      if (data.user) {
        localStorage.setItem("userInfo", JSON.stringify(data.user));
      } else {
        // Nếu API không trả về user info trực tiếp, thử giải mã từ token JWT
        try {
          const base64Url = data.token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const payload = JSON.parse(window.atob(base64));

          localStorage.setItem(
            "userInfo",
            JSON.stringify({
              user_id: payload.user_id || payload.sub || payload.id,
              fullname: payload.name || payload.fullname,
              email: payload.email,
              role: payload.role,
            })
          );

          console.log("Extracted user info from token:", payload);
        } catch (e) {
          console.error("Error extracting user info from token:", e);
        }
      }

      // Xóa bỏ ID xác nhận cũ nếu có
      localStorage.removeItem("confirmedUserId");

      navigate("/");
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        general: error.message || "Login failed. Please try again.",
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Cùng trồng dứa thôi !!!
          </CardTitle>
          <CardDescription className="text-center">
            Nhập email và mật khẩu để đăng nhập
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errors.general && (
            <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
              {errors.general}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="remember-me" className="ml-2">
                  Ghi nhớ đăng nhập
                </Label>
              </div>
              <Button
                variant="link"
                className="text-sm"
                onClick={() => navigate("/forgot-password")}
              >
                Quên mật khẩu?
              </Button>
            </div>
            <Button type="submit" className="w-full bg-[#00B207] text-white">
              Đăng nhập
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-center text-sm text-gray-600">
            Bạn chưa có tài khoản?{" "}
            <Button
              variant="link"
              className="p-0"
              onClick={() => navigate("/register")}
            >
              Đăng ký
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginForm;
