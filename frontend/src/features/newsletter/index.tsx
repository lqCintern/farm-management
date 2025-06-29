import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Clock, Leaf, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ContactCTA() {
	const navigate = useNavigate();

	const contactInfo = [
		{
			icon: Phone,
			title: "Hỗ trợ kỹ thuật",
			description: "1900-1234",
			subtitle: "Hỗ trợ 24/7"
		},
		{
			icon: Mail,
			title: "Email liên hệ",
			description: "support@viefarm.com",
			subtitle: "Phản hồi trong 2h"
		},
		{
			icon: MapPin,
			title: "Văn phòng",
			description: "TP.HCM, Việt Nam",
			subtitle: "Trụ sở chính"
		},
		{
			icon: Clock,
			title: "Giờ làm việc",
			description: "8:00 - 18:00",
			subtitle: "Thứ 2 - Thứ 6"
		}
	];

	const quickStats = [
		{
			icon: Leaf,
			value: "1000+",
			label: "Nông trại được quản lý"
		},
		{
			icon: Users,
			value: "5000+",
			label: "Nông dân tin tưởng"
		},
		{
			icon: TrendingUp,
			value: "95%",
			label: "Tăng năng suất trung bình"
		}
	];

	return (
		<div className="mt-[91px]">
			{/* Main CTA Section */}
			<div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-8 md:p-12 text-white relative overflow-hidden">
				{/* Background decoration */}
				<div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
				<div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
				
				<div className="relative z-10 text-center">
					<h2 className="text-3xl md:text-4xl font-bold mb-4">
						Sẵn sàng chuyển đổi số nông nghiệp?
					</h2>
					<p className="text-lg md:text-xl mb-8 text-green-100 max-w-2xl mx-auto">
						Tham gia cùng hàng nghìn nông dân đã tin tưởng sử dụng hệ thống quản lý nông trại thông minh
					</p>
					
					<div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
						<Button 
							onClick={() => navigate('/register')}
							className="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 text-lg font-medium"
						>
							Đăng ký miễn phí
						</Button>
						<Button 
							onClick={() => navigate('/farming')}
							variant="outline"
							className="border-white text-white hover:bg-white hover:text-green-600 px-8 py-3 text-lg font-medium"
						>
							Xem demo
						</Button>
					</div>
					
					{/* Quick Stats */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
						{quickStats.map((stat, index) => (
							<div key={index} className="text-center">
								<div className="flex justify-center mb-2">
									<stat.icon className="w-8 h-8 text-green-200" />
								</div>
								<div className="text-2xl font-bold mb-1">{stat.value}</div>
								<div className="text-green-100 text-sm">{stat.label}</div>
							</div>
						))}
					</div>
				</div>
			</div>
			
			{/* Contact Information */}
			<div className="mt-12">
				<div className="text-center mb-8">
					<h3 className="text-2xl font-bold text-gray-800 mb-2">
						Liên hệ với chúng tôi
					</h3>
					<p className="text-gray-600">
						Đội ngũ chuyên gia sẵn sàng hỗ trợ bạn 24/7
					</p>
				</div>
				
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{contactInfo.map((info, index) => (
						<div key={index} className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg hover:border-green-300 transition-all duration-300">
							<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
								<info.icon className="w-6 h-6 text-green-600" />
							</div>
							<h4 className="font-semibold text-gray-800 mb-2">{info.title}</h4>
							<p className="text-green-600 font-medium mb-1">{info.description}</p>
							<p className="text-gray-500 text-sm">{info.subtitle}</p>
						</div>
					))}
				</div>
			</div>
			
			{/* Newsletter Signup */}
			<div className="mt-12 bg-gray-50 rounded-xl p-8">
				<div className="text-center">
					<h3 className="text-2xl font-bold text-gray-800 mb-4">
						Nhận thông tin mới nhất
					</h3>
					<p className="text-gray-600 mb-6 max-w-md mx-auto">
						Đăng ký nhận tin tức về nông nghiệp, cập nhật tính năng mới và khuyến mãi đặc biệt
					</p>
					
					<div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
						<input
							type="email"
							placeholder="Nhập email của bạn"
							className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
						/>
						<Button className="bg-green-600 hover:bg-green-700 px-6 py-3">
							Đăng ký
						</Button>
					</div>
					
					<p className="text-gray-500 text-sm mt-4">
						Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn
					</p>
				</div>
			</div>
		</div>
	);
}
