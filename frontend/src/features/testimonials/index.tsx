import { Star, TrendingUp, Users, Award } from "lucide-react";

const successStories = [
	{
		id: 1,
		title: "Nông trại Đồng Tháp Mười",
		owner: "Ông Nguyễn Văn Thành",
		location: "Đồng Tháp",
		image: "/img/member/jenny.png",
		story: "Từ một nông trại nhỏ 5ha, giờ đây chúng tôi đã mở rộng lên 25ha với hệ thống quản lý hiện đại. Năng suất tăng 40% và chi phí giảm 25%.",
		achievements: [
			"Tăng diện tích từ 5ha lên 25ha",
			"Năng suất tăng 40%",
			"Chi phí giảm 25%",
			"Thu nhập tăng 60%"
		],
		rating: 5,
		year: "2023"
	},
	{
		id: 2,
		title: "Trang trại rau sạch Tiền Giang",
		owner: "Bà Trần Thị Mai",
		location: "Tiền Giang",
		image: "/img/member/jane.png",
		story: "Nhờ hệ thống quản lý thông minh, chúng tôi đã xây dựng được chuỗi cung ứng rau sạch cho các siêu thị lớn tại TP.HCM.",
		achievements: [
			"Xuất khẩu rau sạch",
			"Chuỗi cung ứng ổn định",
			"Chứng nhận VietGAP",
			"Doanh thu tăng 80%"
		],
		rating: 5,
		year: "2023"
	},
	{
		id: 3,
		title: "Nông trại cây ăn quả Long An",
		owner: "Anh Lê Văn Dũng",
		location: "Long An",
		image: "/img/member/cody.png",
		story: "Từ việc quản lý thủ công, giờ đây mọi thứ đều được số hóa. Việc theo dõi nhân công và lập kế hoạch canh tác trở nên dễ dàng hơn bao giờ hết.",
		achievements: [
			"Quản lý 15ha cây ăn quả",
			"Tiết kiệm 30% thời gian",
			"Tăng chất lượng sản phẩm",
			"Xuất khẩu đi 5 nước"
		],
		rating: 4,
		year: "2023"
	}
];

const stats = [
	{
		icon: TrendingUp,
		value: "500+",
		label: "Nông trại thành công",
		color: "text-green-600"
	},
	{
		icon: Users,
		value: "2000+",
		label: "Nông dân hài lòng",
		color: "text-blue-600"
	},
	{
		icon: Award,
		value: "15+",
		label: "Giải thưởng nhận được",
		color: "text-purple-600"
	}
];

export default function SuccessStories() {
	return (
		<div className="mt-[91px]">
			<div className="text-center mb-12">
				<h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
					Câu chuyện thành công
				</h2>
				<p className="text-gray-600 text-lg max-w-2xl mx-auto">
					Những nông dân đã thay đổi cách quản lý nông trại và đạt được thành công vượt bậc
				</p>
			</div>
			
			{/* Success Stories */}
			<div className="space-y-8">
				{successStories.map((story, index) => (
					<div
						key={story.id}
						className={`bg-white border border-gray-200 rounded-xl p-6 md:p-8 hover:shadow-xl transition-all duration-300 ${
							index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
						} flex flex-col md:flex-row gap-6 md:gap-8`}
					>
						{/* Image */}
						<div className="md:w-1/3">
							<div className="relative">
								<img
									src={story.image}
									alt={story.owner}
									className="w-full h-48 md:h-64 object-cover rounded-lg"
								/>
								<div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
									{story.year}
								</div>
							</div>
						</div>
						
						{/* Content */}
						<div className="md:w-2/3">
							<div className="flex items-center gap-2 mb-3">
								<h3 className="text-xl font-bold text-gray-800">{story.title}</h3>
								<div className="flex">
									{Array.from({ length: story.rating }).map((_, i) => (
										<Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
									))}
								</div>
							</div>
							
							<div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
								<span className="font-medium">{story.owner}</span>
								<span>•</span>
								<span>{story.location}</span>
							</div>
							
							<p className="text-gray-700 mb-6 leading-relaxed italic">
								"{story.story}"
							</p>
							
							{/* Achievements */}
							<div className="grid grid-cols-2 gap-3">
								{story.achievements.map((achievement, i) => (
									<div key={i} className="flex items-center gap-2">
										<div className="w-2 h-2 bg-green-500 rounded-full"></div>
										<span className="text-sm text-gray-700">{achievement}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				))}
			</div>
			
			{/* Stats */}
			<div className="mt-16 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
				<div className="text-center mb-8">
					<h3 className="text-2xl font-bold text-gray-800 mb-2">
						Thành tựu của chúng tôi
					</h3>
					<p className="text-gray-600">
						Những con số ấn tượng từ hàng nghìn nông dân đã tin tưởng
					</p>
				</div>
				
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					{stats.map((stat, index) => (
						<div key={index} className="text-center">
							<div className="flex justify-center mb-4">
								<div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
									<stat.icon className={`w-8 h-8 ${stat.color}`} />
								</div>
							</div>
							<div className={`text-3xl font-bold mb-2 ${stat.color}`}>
								{stat.value}
							</div>
							<div className="text-gray-600 font-medium">
								{stat.label}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
