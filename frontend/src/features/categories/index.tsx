import { useNavigate } from "react-router-dom";
import "./categories.css";

const farmCategories = [
	{
		id: 1,
		name: "Cây ăn quả",
		description: "Cam, quýt, bưởi, xoài...",
		image: "/img/categories/fresh_fruit.svg",
		count: 12,
		color: "from-orange-400 to-red-500",
		route: "/farming/fruits"
	},
	{
		id: 2,
		name: "Rau màu",
		description: "Cải, rau muống, rau dền...",
		image: "/img/categories/fresh_veg.svg",
		count: 8,
		color: "from-green-400 to-emerald-500",
		route: "/farming/vegetables"
	},
	{
		id: 3,
		name: "Cây công nghiệp",
		description: "Cà phê, tiêu, điều...",
		image: "/img/categories/meat_fish.svg",
		count: 6,
		color: "from-amber-400 to-orange-500",
		route: "/farming/industrial"
	},
	{
		id: 4,
		name: "Chăn nuôi",
		description: "Heo, gà, bò, dê...",
		image: "/img/categories/snacks.svg",
		count: 10,
		color: "from-pink-400 to-rose-500",
		route: "/farming/livestock"
	},
	{
		id: 5,
		name: "Thủy sản",
		description: "Cá, tôm, cua...",
		image: "/img/categories/fresh_fruit.svg",
		count: 7,
		color: "from-blue-400 to-cyan-500",
		route: "/farming/aquaculture"
	},
	{
		id: 6,
		name: "Lúa gạo",
		description: "Lúa nước, lúa cạn...",
		image: "/img/categories/fresh_veg.svg",
		count: 4,
		color: "from-yellow-400 to-amber-500",
		route: "/farming/rice"
	},
];

export default function Categories() {
	const navigate = useNavigate();

	return (
		<div className="mt-[60px]">
			<div className="flex justify-between items-center mb-8">
				<div>
					<p className="font-bold text-xl md:text-2xl text-gray-800">
						Danh mục nông nghiệp
					</p>
					<p className="text-gray-600 mt-2">
						Quản lý đa dạng các loại cây trồng và vật nuôi
					</p>
				</div>
				<p className="text-green-500 cursor-pointer arrow text-sm md:text-base font-medium hover:text-green-600 transition-colors">
					Xem tất cả →
				</p>
			</div>
			
			<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
				{farmCategories.map((category) => (
					<div
						key={category.id}
						onClick={() => navigate(category.route)}
						className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-green-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
					>
						{/* Background gradient */}
						<div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-5 rounded-xl group-hover:opacity-10 transition-opacity duration-300`}></div>
						
						<div className="relative z-10">
							<div className="flex justify-center mb-3">
								<div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
									<img
										src={category.image}
										alt={category.name}
										className="w-8 h-8 filter brightness-0 invert"
									/>
								</div>
							</div>

							<div className="text-center">
								<p className="font-bold text-sm md:text-base text-gray-800 group-hover:text-green-600 transition-colors">
									{category.name}
								</p>
								<p className="text-gray-500 text-xs mt-1">
									{category.description}
								</p>
								<div className="mt-2 inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
									{category.count} loại
								</div>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
