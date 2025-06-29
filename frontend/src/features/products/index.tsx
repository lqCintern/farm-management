import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "../../components/ui/progress";
import { useNavigate } from "react-router-dom";
import { 
	BarChart3, 
	Calendar, 
	Users, 
	Leaf, 
	TrendingUp, 
	AlertCircle,
	CheckCircle,
	Clock,
	XCircle
} from "lucide-react";

interface FarmActivity {
	id: number;
	title: string;
	status: "completed" | "in-progress" | "pending" | "overdue";
	progress: number;
	dueDate: string;
	category: string;
}

const farmActivities: FarmActivity[] = [
	{ 
		id: 1, 
		title: "Thu hoạch lúa vụ mùa", 
		status: "completed", 
		progress: 100,
		dueDate: "2024-01-15",
		category: "Thu hoạch"
	},
	{ 
		id: 2, 
		title: "Phun thuốc bảo vệ thực vật", 
		status: "in-progress", 
		progress: 65,
		dueDate: "2024-01-20",
		category: "Chăm sóc"
	},
	{ 
		id: 3, 
		title: "Chuẩn bị đất trồng rau", 
		status: "pending", 
		progress: 0,
		dueDate: "2024-01-25",
		category: "Chuẩn bị"
	},
	{ 
		id: 4, 
		title: "Kiểm tra hệ thống tưới tiêu", 
		status: "overdue", 
		progress: 30,
		dueDate: "2024-01-10",
		category: "Bảo trì"
	},
	{ 
		id: 5, 
		title: "Phân công nhân công", 
		status: "in-progress", 
		progress: 80,
		dueDate: "2024-01-18",
		category: "Quản lý"
	},
];

const stats = [
	{
		title: "Tổng diện tích",
		value: "25.5 ha",
		change: "+2.3%",
		icon: Leaf,
		color: "text-green-600",
		bgColor: "bg-green-100"
	},
	{
		title: "Nhân công hiện tại",
		value: "12 người",
		change: "+1",
		icon: Users,
		color: "text-blue-600",
		bgColor: "bg-blue-100"
	},
	{
		title: "Hoạt động tháng",
		value: "8/10",
		change: "+15%",
		icon: Calendar,
		color: "text-purple-600",
		bgColor: "bg-purple-100"
	},
	{
		title: "Doanh thu dự kiến",
		value: "125M VNĐ",
		change: "+8.5%",
		icon: TrendingUp,
		color: "text-orange-600",
		bgColor: "bg-orange-100"
	},
];

export default function FarmDashboard() {
	const [filter, setFilter] = useState<"all" | "completed" | "in-progress" | "pending" | "overdue">("all");
	const navigate = useNavigate();

	const filteredActivities = filter === "all" ? farmActivities : farmActivities.filter((activity) => activity.status === filter);

	const completedActivities = farmActivities.filter((activity) => activity.status === "completed").length;
	const totalActivities = farmActivities.length;
	const overallProgress = (completedActivities / totalActivities) * 100;

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle className="w-5 h-5 text-green-500" />;
			case "in-progress":
				return <Clock className="w-5 h-5 text-blue-500" />;
			case "pending":
				return <AlertCircle className="w-5 h-5 text-yellow-500" />;
			case "overdue":
				return <XCircle className="w-5 h-5 text-red-500" />;
			default:
				return null;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "bg-green-100 border-green-200";
			case "in-progress":
				return "bg-blue-100 border-blue-200";
			case "pending":
				return "bg-yellow-100 border-yellow-200";
			case "overdue":
				return "bg-red-100 border-red-200";
			default:
				return "bg-gray-100 border-gray-200";
		}
	};

	return (
		<div className="mt-[60px] p-6 bg-gray-50 rounded-xl">
			{/* Header */}
			<header className="flex justify-between items-center mb-8">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">Tổng quan nông trại</h1>
					<p className="text-gray-600 mt-1">Theo dõi hoạt động và hiệu suất sản xuất</p>
				</div>
				<Button 
					onClick={() => navigate('/farming')}
					className="bg-green-600 hover:bg-green-700"
				>
					Quản lý chi tiết
				</Button>
			</header>

			{/* Stats Grid */}
			<section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
				{stats.map((stat, index) => (
					<div key={index} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-gray-600 text-sm">{stat.title}</p>
								<p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
								<p className="text-green-600 text-sm mt-1">{stat.change}</p>
							</div>
							<div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
								<stat.icon className={`w-6 h-6 ${stat.color}`} />
							</div>
						</div>
					</div>
				))}
			</section>

			{/* Progress Overview */}
			<section className="bg-white p-6 rounded-xl border border-gray-200 mb-8">
				<h2 className="text-xl font-semibold mb-4 text-gray-800">Tiến độ tổng thể</h2>
				<div className="flex items-center gap-4 mb-4">
					<div className="flex-1">
						<p className="text-gray-600 mb-2">
							Hoàn thành: {completedActivities}/{totalActivities} hoạt động
						</p>
						<Progress value={overallProgress} className="h-3 rounded-lg" />
					</div>
					<div className="text-right">
						<p className="text-2xl font-bold text-green-600">{Math.round(overallProgress)}%</p>
					</div>
				</div>
			</section>

			{/* Activity Filters */}
			<section className="mb-6">
				<div className="flex flex-wrap gap-2 mb-4">
					{["all", "completed", "in-progress", "pending", "overdue"].map((status) => (
						<Button
							key={status}
							onClick={() => setFilter(status as any)}
							variant={filter === status ? "default" : "outline"}
							size="sm"
							className={filter === status ? "bg-green-600" : ""}
						>
							{status === "all" ? "Tất cả" : 
							 status === "completed" ? "Hoàn thành" :
							 status === "in-progress" ? "Đang thực hiện" :
							 status === "pending" ? "Chờ thực hiện" : "Quá hạn"}
						</Button>
					))}
				</div>
			</section>

			{/* Activity List */}
			<section className="space-y-4">
				{filteredActivities.map((activity) => (
					<div
						key={activity.id}
						className={`p-4 rounded-xl border ${getStatusColor(activity.status)} hover:shadow-md transition-shadow cursor-pointer`}
						onClick={() => navigate(`/farming/activities/${activity.id}`)}
					>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								{getStatusIcon(activity.status)}
								<div>
									<p className="font-semibold text-gray-800">{activity.title}</p>
									<div className="flex items-center gap-4 mt-1">
										<span className="text-sm text-gray-600">{activity.category}</span>
										<span className="text-sm text-gray-500">Hạn: {activity.dueDate}</span>
									</div>
								</div>
							</div>
							<div className="text-right">
								<p className="text-sm font-medium text-gray-600">{activity.progress}%</p>
								<div className="w-20 h-2 bg-gray-200 rounded-full mt-1">
									<div 
										className="h-2 bg-green-500 rounded-full transition-all duration-300"
										style={{ width: `${activity.progress}%` }}
									></div>
								</div>
							</div>
						</div>
					</div>
				))}
			</section>
		</div>
	);
} 