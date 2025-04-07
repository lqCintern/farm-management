import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-toastify";
import { sendForgotPasswordEmail } from "@/services/authService";

const ForgotPasswordForm = () => {
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await sendForgotPasswordEmail(email);
            toast.success("Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn!");
        } catch (error: any) {
            toast.error(error.response?.data?.error || "Đã xảy ra lỗi, vui lòng thử lại.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <h2 className="text-center text-2xl font-bold">Quên mật khẩu</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Nhập email của bạn"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full bg-[#00B207] text-white">
                        Gửi yêu cầu
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordForm;
