import { Button } from "@/components/ui/button";
import { ArrowBigRightIcon, Leaf, Users, BarChart3, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./hero.css";

const farmServices = [
	{
		id: 1,
		name: "Quản lý nông trại",
		description: "Theo dõi hoạt động canh tác",
		icon: Leaf,
		color: "text-green-600",
		bgColor: "bg-green-100",
	},
	{
		id: 2,
		name: "Quản lý nhân công",
		description: "Phân công và theo dõi lao động",
		icon: Users,
		color: "text-blue-600",
		bgColor: "bg-blue-100",
	},
	{
		id: 3,
		name: "Thống kê sản xuất",
		description: "Báo cáo năng suất và doanh thu",
		icon: BarChart3,
		color: "text-purple-600",
		bgColor: "bg-purple-100",
	},
	{
		id: 4,
		name: "Lịch trình canh tác",
		description: "Lập kế hoạch và nhắc nhở",
		icon: Calendar,
		color: "text-orange-600",
		bgColor: "bg-orange-100",
	},
];

export default function HeroSection() {
	const navigate = useNavigate();

	return (
		<div className="mt-4 md:mt-0">
			<div className="bg-gradient-to-br from-green-50 to-emerald-100 w-full min-h-[400px] md:h-[630px] rounded-xl p-4 md:p-8 flex flex-col md:flex-row justify-between md:py-[120px] relative overflow-hidden">
				{/* Background decoration */}
				<div className="absolute top-0 right-0 w-64 h-64 bg-green-200 rounded-full opacity-20 -translate-y-32 translate-x-32"></div>
				<div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-200 rounded-full opacity-20 translate-y-24 -translate-x-24"></div>
				
				<div className="text-center md:text-left relative z-10">
					<p className="text-green-600 text-sm md:text-base font-medium animate-pulse">
						HỆ THỐNG QUẢN LÝ NÔNG TRẠI THÔNG MINH
					</p>
					<p className="text-[40px] md:text-[80px] font-bold leading-[1.1] md:leading-[80px] mt-4 md:mt-6 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
						Quản lý nông trại <br /> hiệu quả & bền vững
					</p>
					<p className="mt-4 md:mt-8 text-xl md:text-3xl text-gray-700">
						Khám phá ngay{" "}
						<span className="text-orange-500 font-bold">
							15+ tính năng
						</span>{" "}
						quản lý toàn diện
					</p>
					<div className="flex flex-col sm:flex-row gap-4 mt-6 md:mt-10">
						<Button 
							onClick={() => navigate('/farming')}
							className="bg-green-600 hover:bg-green-700 text-white w-[160px] md:w-[200px] h-[45px] md:h-[55px] rounded-3xl text-sm md:text-base transition-all duration-300 hover:scale-105"
						>
							Bắt đầu ngay <ArrowBigRightIcon className="ml-2" />
						</Button>
						<Button 
							onClick={() => navigate('/marketplace')}
							variant="outline"
							className="border-green-600 text-green-600 hover:bg-green-50 w-[160px] md:w-[200px] h-[45px] md:h-[55px] rounded-3xl text-sm md:text-base transition-all duration-300"
						>
							Khám phá thị trường
						</Button>
					</div>
				</div>
				<div className="mt-6 md:mt-0 md:block relative z-10">
					<img
						src="/img/banner.png"
						alt="Farm Management"
						className="image w-full md:w-[650px] object-contain"
					/>
				</div>
			</div>
			
			{/* Services Grid */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
				{farmServices.map((service) => (
					<div
						key={service.id}
						className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-green-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
						onClick={() => navigate(`/${service.name.toLowerCase().replace(/\s+/g, '-')}`)}
					>
						<div className={`w-12 h-12 ${service.bgColor} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
							<service.icon className={`w-6 h-6 ${service.color}`} />
						</div>
						<div>
							<p className="font-bold text-sm md:text-base text-gray-800 group-hover:text-green-600 transition-colors">
								{service.name}
							</p>
							<p className="text-gray-500 text-xs md:text-sm mt-1">
								{service.description}
							</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
