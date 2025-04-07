import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resetPassword } from "@/services/authService";
import { toast } from "react-toastify";

const ResetPasswordForm = () => {
    const [password, setPassword] = useState("");
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await resetPassword(token, password);
            toast.success("Mật khẩu của bạn đã được đặt lại thành công!");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Đã xảy ra lỗi, vui lòng thử lại.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <h2 className="text-center text-2xl font-bold">Đặt lại mật khẩu</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            id="password"
                            type="password"
                            placeholder="Nhập mật khẩu mới"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full bg-[#00B207] text-white">
                        Đặt lại mật khẩu
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordForm;
