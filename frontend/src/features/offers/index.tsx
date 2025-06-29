import { useNavigate } from "react-router-dom";
import { Leaf, Users, BarChart3, Calendar, MapPin, CloudRain } from "lucide-react";

export default function FarmFeatures() {
	const navigate = useNavigate();
	
	const features = [
		{
			id: 1,
			title: "Quản lý nông trại thông minh",
			description: "Theo dõi và quản lý toàn bộ hoạt động canh tác với công nghệ hiện đại",
			icon: Leaf,
			color: "from-green-400 to-emerald-500",
			route: "/farming",
			stats: "15+ tính năng"
		},
		{
			id: 2,
			title: "Quản lý nhân công hiệu quả",
			description: "Phân công, theo dõi và đánh giá hiệu suất lao động một cách chính xác",
			icon: Users,
			color: "from-blue-400 to-cyan-500",
			route: "/labor",
			stats: "50+ nhân công"
		},
		{
			id: 3,
			title: "Thống kê và báo cáo chi tiết",
			description: "Phân tích dữ liệu sản xuất và đưa ra quyết định kinh doanh thông minh",
			icon: BarChart3,
			color: "from-purple-400 to-pink-500",
			route: "/farmer/statistics",
			stats: "Real-time"
		},
		{
			id: 4,
			title: "Lịch trình canh tác tự động",
			description: "Lập kế hoạch và nhắc nhở các hoạt động nông nghiệp theo mùa vụ",
			icon: Calendar,
			color: "from-orange-400 to-red-500",
			route: "/calendar",
			stats: "24/7"
		},
		{
			id: 5,
			title: "Quản lý đất đai và thửa ruộng",
			description: "Theo dõi diện tích, chất đất và lịch sử canh tác từng khu vực",
			icon: MapPin,
			color: "from-yellow-400 to-amber-500",
			route: "/fields",
			stats: "25.5 ha"
		},
		{
			id: 6,
			title: "Dự báo thời tiết và khí hậu",
			description: "Cập nhật thông tin thời tiết và đưa ra khuyến nghị canh tác phù hợp",
			icon: CloudRain,
			color: "from-indigo-400 to-blue-500",
			route: "/climate",
			stats: "7 ngày"
		},
	];

	return (
		<div className="mt-[91px]">
			<div className="text-center mb-12">
				<h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
					Tính năng nổi bật
				</h2>
				<p className="text-gray-600 text-lg max-w-2xl mx-auto">
					Khám phá các công cụ quản lý nông trại hiện đại giúp tối ưu hóa sản xuất và tăng hiệu quả kinh doanh
				</p>
			</div>
			
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{features.map((feature) => (
					<div
						key={feature.id}
						onClick={() => navigate(feature.route)}
						className="group relative bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-green-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
					>
						{/* Background gradient */}
						<div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-5 rounded-xl group-hover:opacity-10 transition-opacity duration-300`}></div>
						
						<div className="relative z-10">
							{/* Icon */}
							<div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
								<feature.icon className="w-8 h-8 text-white" />
							</div>
							
							{/* Content */}
							<h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-green-600 transition-colors">
								{feature.title}
							</h3>
							<p className="text-gray-600 mb-4 leading-relaxed">
								{feature.description}
							</p>
							
							{/* Stats */}
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium text-gray-500">
									{feature.stats}
								</span>
								<div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
									<svg className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
									</svg>
								</div>
							</div>
						</div>
						
						{/* Hover effect */}
						<div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
					</div>
				))}
			</div>
			
			{/* Call to action */}
			<div className="text-center mt-12">
				<div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
					<h3 className="text-2xl font-bold text-gray-800 mb-4">
						Sẵn sàng bắt đầu?
					</h3>
					<p className="text-gray-600 mb-6 max-w-md mx-auto">
						Tham gia cùng hàng nghìn nông dân đã tin tưởng sử dụng hệ thống quản lý nông trại thông minh
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<button 
							onClick={() => navigate('/farming')}
							className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
						>
							Bắt đầu ngay
						</button>
						<button 
							onClick={() => navigate('/marketplace')}
							className="border border-green-600 text-green-600 hover:bg-green-50 px-8 py-3 rounded-lg font-medium transition-colors"
						>
							Khám phá thị trường
						</button>
					</div>
				</div>
			</div>
		</div>
	);
} 