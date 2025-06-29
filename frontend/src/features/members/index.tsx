import { Star, Quote } from "lucide-react";

const testimonials = [
	{
		id: 1,
		name: "Nguyễn Văn An",
		position: "Chủ nông trại",
		location: "Đồng Tháp",
		image: "/img/member/jenny.png",
		quote: "Hệ thống này đã giúp tôi quản lý nông trại hiệu quả hơn rất nhiều. Từ việc theo dõi nhân công đến lập kế hoạch canh tác đều trở nên dễ dàng.",
		rating: 5,
		achievement: "Tăng năng suất 30%"
	},
	{
		id: 2,
		name: "Trần Thị Bình",
		position: "Quản lý nông trại",
		location: "Tiền Giang",
		image: "/img/member/jane.png",
		quote: "Các tính năng thống kê và báo cáo rất chi tiết, giúp tôi đưa ra quyết định kinh doanh chính xác hơn.",
		rating: 5,
		achievement: "Tiết kiệm 25% chi phí"
	},
	{
		id: 3,
		name: "Lê Văn Cường",
		position: "Nông dân",
		location: "Long An",
		image: "/img/member/cody.png",
		quote: "Giao diện dễ sử dụng, phù hợp với nông dân chúng tôi. Hỗ trợ kỹ thuật cũng rất nhiệt tình.",
		rating: 4,
		achievement: "Quản lý 15ha"
	},
	{
		id: 4,
		name: "Phạm Thị Dung",
		position: "Chủ trang trại",
		location: "Bến Tre",
		image: "/img/member/fox.png",
		quote: "Từ khi sử dụng hệ thống này, việc quản lý nhân công và lập lịch trình canh tác trở nên khoa học hơn.",
		rating: 5,
		achievement: "Tăng doanh thu 40%"
	},
];

export default function FarmTestimonials() {
	return (
		<div className="mt-[91px]">
			<div className="text-center mb-12">
				<h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
					Khách hàng nói gì về chúng tôi
				</h2>
				<p className="text-gray-600 text-lg max-w-2xl mx-auto">
					Những phản hồi chân thực từ các nông dân đã tin tưởng sử dụng hệ thống quản lý nông trại
				</p>
			</div>
			
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{testimonials.map((testimonial) => (
					<div
						key={testimonial.id}
						className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl hover:border-green-300 transition-all duration-300 transform hover:-translate-y-2"
					>
						{/* Quote icon */}
						<div className="flex justify-center mb-4">
							<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
								<Quote className="w-6 h-6 text-green-600" />
							</div>
						</div>
						
						{/* Rating */}
						<div className="flex justify-center mb-4">
							{Array.from({ length: testimonial.rating }).map((_, index) => (
								<Star key={index} className="w-5 h-5 text-yellow-400 fill-current" />
							))}
						</div>
						
						{/* Quote */}
						<p className="text-gray-600 text-sm leading-relaxed mb-6 text-center italic">
							"{testimonial.quote}"
						</p>
						
						{/* Achievement */}
						<div className="bg-green-50 rounded-lg p-3 mb-4 text-center">
							<p className="text-green-700 font-semibold text-sm">
								{testimonial.achievement}
							</p>
						</div>
						
						{/* Author */}
						<div className="flex items-center justify-center">
							<img
								src={testimonial.image}
								alt={testimonial.name}
								className="w-12 h-12 rounded-full object-cover mr-3"
							/>
							<div className="text-center">
								<p className="font-semibold text-gray-800 text-sm">
									{testimonial.name}
								</p>
								<p className="text-gray-500 text-xs">
									{testimonial.position}
								</p>
								<p className="text-green-600 text-xs font-medium">
									{testimonial.location}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
			
			{/* Stats */}
			<div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
				<div className="text-center">
					<div className="text-3xl font-bold text-green-600 mb-2">500+</div>
					<div className="text-gray-600 text-sm">Nông dân tin tưởng</div>
				</div>
				<div className="text-center">
					<div className="text-3xl font-bold text-green-600 mb-2">1000+</div>
					<div className="text-gray-600 text-sm">Ha được quản lý</div>
				</div>
				<div className="text-center">
					<div className="text-3xl font-bold text-green-600 mb-2">98%</div>
					<div className="text-gray-600 text-sm">Khách hàng hài lòng</div>
				</div>
				<div className="text-center">
					<div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
					<div className="text-gray-600 text-sm">Hỗ trợ khách hàng</div>
				</div>
			</div>
		</div>
	);
}
