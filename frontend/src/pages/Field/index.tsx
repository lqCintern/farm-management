import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
	MapPin, 
	Leaf, 
	BarChart3, 
	Calendar, 
	TrendingUp, 
	Users, 
	Clock,
	Plus,
	Search,
	Filter,
	Grid3X3,
	List,
	Eye,
	Edit,
	Trash2,
	Activity,
	Wheat,
	Crop,
	Map,
	Layers
} from "lucide-react";
import Breadcrumb from "@/components/common/Breadcrumb";
import fieldService, { Field } from "@/services/farming/fieldService";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FieldDetailModal from "@/components/Field/FieldDetailModal";
import FieldMap from "@/components/Field/components/map/FieldMap";
import FieldListContainer from "@/components/Field/components/list/FieldListContainer";
import { getRandomColor, filterFields, sortFields } from "@/components/Field/utils/fieldUtils";
import "./field.css";

interface FieldStats {
	total_fields: number;
	total_area: number;
	crops_by_field: Record<string, number>;
	activities_by_field: Record<string, number>;
	harvests_by_field: Record<string, number>;
}

interface FieldWithStats extends Field {
	stats?: {
		cropCount: number;
		activityCount: number;
		harvestCount: number;
		harvestQuantity: number;
	};
}

const FieldDashboard: React.FC = () => {
	const [fields, setFields] = useState<FieldWithStats[]>([]);
	const [filteredFields, setFilteredFields] = useState<FieldWithStats[]>([]);
	const [stats, setStats] = useState<FieldStats | null>(null);
	const [selectedField, setSelectedField] = useState<FieldWithStats | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [viewMode, setViewMode] = useState<"dashboard" | "map">("dashboard");
	const [sortBy, setSortBy] = useState<string>("name");
	const [loading, setLoading] = useState(true);
	const [showDetailModal, setShowDetailModal] = useState(false);

	const breadcrumbItems = [
		{ label: "Trang chủ", path: "/" },
		{ label: "Quản lý cánh đồng" }
	];

	// Fetch data
	useEffect(() => {
		const fetchData = async () => {
			try {
				setLoading(true);
				const [fieldsResponse, statsResponse] = await Promise.all([
					fieldService.getFields(),
					fieldService.getFieldStats()
				]);

				const fieldsWithStats = fieldsResponse.data.map((field: Field) => ({
					...field,
					color: getRandomColor(),
					stats: {
						cropCount: field.id ? statsResponse.data.crops_by_field[field.id] || 0 : 0,
						activityCount: field.id ? statsResponse.data.activities_by_field[field.id] || 0 : 0,
						harvestCount: field.id ? statsResponse.data.harvests_by_field[field.id] || 0 : 0,
						harvestQuantity: 0
					}
				}));

				setFields(fieldsWithStats);
				setFilteredFields(fieldsWithStats);
				setStats(statsResponse.data);
			} catch (error) {
				console.error("Error fetching field data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	// Filter and sort fields
	useEffect(() => {
		let result = filterFields(fields, searchTerm);
		result = sortFields(result, sortBy);
		setFilteredFields(result);
	}, [fields, searchTerm, sortBy]);

	// Handle field selection
	const handleFieldClick = (field: FieldWithStats): void => {
		setSelectedField(field);
	};

	// Format area
	const formatArea = (area: number | string) => {
		const numArea = typeof area === 'string' ? parseFloat(area) : area;
		if (numArea >= 10000) {
			return `${(numArea / 10000).toFixed(2)} ha`;
		}
		return `${numArea.toFixed(2)} m²`;
	};

	// Get status color
	const getStatusColor = (field: FieldWithStats) => {
		if (field.currentCrop) {
			return "bg-green-100 text-green-800";
		}
		return "bg-gray-100 text-gray-800";
	};

	// Get status text
	const getStatusText = (field: FieldWithStats) => {
		if (field.currentCrop) {
			return "Đang trồng";
		}
		return "Trống";
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Đang tải dữ liệu cánh đồng...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
			{/* Header */}
			<div className="bg-white shadow-sm border-b border-green-100">
				<div className="container mx-auto px-4 py-6">
					<Breadcrumb items={breadcrumbItems} />
					
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
						<div>
							<h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
								Quản lý cánh đồng
							</h1>
							<p className="text-gray-600 mt-1">
								Theo dõi và quản lý tất cả cánh đồng của bạn
							</p>
						</div>
						
						<div className="flex gap-3">
							<Button
								variant={viewMode === "dashboard" ? "default" : "outline"}
								onClick={() => setViewMode("dashboard")}
								className="flex items-center gap-2"
							>
								<BarChart3 className="w-4 h-4" />
								Dashboard
							</Button>
							<Button
								variant={viewMode === "map" ? "default" : "outline"}
								onClick={() => setViewMode("map")}
								className="flex items-center gap-2"
							>
								<Map className="w-4 h-4" />
								Bản đồ
							</Button>
							<Link to="/fields/new">
								<Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
									<Plus className="w-4 h-4" />
									Thêm cánh đồng
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</div>

			<div className="container mx-auto px-4 py-6">
				{/* Search and Filter */}
				<div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-green-100">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
							<input
								type="text"
								placeholder="Tìm kiếm cánh đồng..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
							/>
						</div>
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
						>
							<option value="name">Sắp xếp theo tên</option>
							<option value="area">Sắp xếp theo diện tích</option>
							<option value="date">Sắp xếp theo ngày tạo</option>
						</select>
					</div>
				</div>

				{viewMode === "dashboard" ? (
					<>
						{/* Stats Overview */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
							<Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg stats-card hover-lift">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-green-100 text-sm font-medium">Tổng cánh đồng</p>
											<p className="text-3xl font-bold">{stats?.total_fields || 0}</p>
										</div>
										<Layers className="w-8 h-8 text-green-200 floating-icon" />
									</div>
								</CardContent>
							</Card>

							<Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg stats-card hover-lift">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-blue-100 text-sm font-medium">Tổng diện tích</p>
											<p className="text-3xl font-bold">{formatArea(stats?.total_area || 0)}</p>
										</div>
										<MapPin className="w-8 h-8 text-blue-200 floating-icon" />
									</div>
								</CardContent>
							</Card>

							<Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg stats-card hover-lift">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-orange-100 text-sm font-medium">Đang trồng</p>
											<p className="text-3xl font-bold">
												{fields.filter(f => f.currentCrop).length}
											</p>
										</div>
										<Crop className="w-8 h-8 text-orange-200 floating-icon" />
									</div>
								</CardContent>
							</Card>

							<Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg stats-card hover-lift">
								<CardContent className="p-6">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-purple-100 text-sm font-medium">Hoạt động</p>
											<p className="text-3xl font-bold">
												{fields.reduce((sum, f) => sum + (f.stats?.activityCount || 0), 0)}
											</p>
										</div>
										<Activity className="w-8 h-8 text-purple-200 floating-icon" />
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Fields Grid */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredFields.map((field) => (
								<Card 
									key={field.id} 
									className={`group hover:shadow-xl transition-all duration-300 border-green-100 hover:border-green-300 transform hover:-translate-y-1 card-hover field-card ${
										selectedField?.id === field.id ? 'ring-2 ring-green-500 shadow-lg' : ''
									}`}
								>
									<CardContent className="p-6">
										<div className="flex items-start justify-between mb-4">
											<div className="flex-1">
												<h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
													{field.name}
												</h3>
												<p className="text-sm text-gray-500 mt-1">
													{field.location || "Chưa có vị trí"}
												</p>
											</div>
											<Badge className={`${getStatusColor(field)} status-badge transition-all duration-200`}>
												{getStatusText(field)}
											</Badge>
										</div>

										<div className="space-y-3">
											<div className="flex items-center justify-between text-sm">
												<span className="text-gray-600">Diện tích:</span>
												<span className="font-medium">{formatArea(field.area || 0)}</span>
											</div>

											<div className="flex items-center justify-between text-sm">
												<span className="text-gray-600">Cây trồng:</span>
												<span className="font-medium">{field.stats?.cropCount || 0}</span>
											</div>

											<div className="flex items-center justify-between text-sm">
												<span className="text-gray-600">Hoạt động:</span>
												<span className="font-medium">{field.stats?.activityCount || 0}</span>
											</div>

											<div className="flex items-center justify-between text-sm">
												<span className="text-gray-600">Thu hoạch:</span>
												<span className="font-medium">{field.stats?.harvestCount || 0}</span>
											</div>
										</div>

										<div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
											<Button 
												size="sm" 
												variant="outline" 
												className="flex-1 hover:bg-green-50 hover:border-green-300 transition-all duration-200 view-btn action-btn"
												onClick={() => {
													setSelectedField(field);
													setShowDetailModal(true);
												}}
											>
												<Eye className="w-4 h-4 mr-1" />
												Xem
											</Button>
											<Button 
												size="sm" 
												variant="outline" 
												className="flex-1 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 edit-btn action-btn"
												onClick={() => {
													// Navigate to edit page
													window.location.href = `/fields/${field.id}/edit`;
												}}
											>
												<Edit className="w-4 h-4 mr-1" />
												Sửa
											</Button>
											<Button 
												size="sm" 
												variant="outline" 
												className="text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 delete-btn action-btn"
											>
												<Trash2 className="w-4 h-4 mr-1" />
												Xóa
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						{/* Empty State */}
						{filteredFields.length === 0 && (
							<div className="text-center py-12">
								<MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									{searchTerm ? "Không tìm thấy cánh đồng" : "Chưa có cánh đồng nào"}
								</h3>
								<p className="text-gray-500 mb-6">
									{searchTerm 
										? "Thử tìm kiếm với từ khóa khác" 
										: "Bắt đầu bằng cách tạo cánh đồng đầu tiên của bạn"
									}
								</p>
								{!searchTerm && (
									<Link to="/fields/new">
										<Button className="bg-green-600 hover:bg-green-700">
											<Plus className="w-4 h-4 mr-2" />
											Tạo cánh đồng đầu tiên
										</Button>
									</Link>
								)}
							</div>
						)}
					</>
				) : (
					/* Map View */
					<div className="flex flex-col lg:flex-row gap-6">
						{/* Map Section */}
						<div className="lg:w-2/3 bg-white rounded-xl shadow-sm p-4 border border-green-100">
							<div className="mb-4">
								<h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
									<Map className="w-5 h-5 text-green-600" />
									Bản đồ cánh đồng
								</h2>
								<p className="text-sm text-gray-600">Click vào cánh đồng để xem chi tiết</p>
							</div>
							<FieldMap
								fields={filteredFields as any}
								selectedField={selectedField as any}
								onFieldClick={handleFieldClick as any}
								labelOpacity={0.8}
							/>
						</div>

						{/* Fields List */}
						<div className="lg:w-1/3">
							<FieldListContainer
								fields={filteredFields as any}
								selectedField={selectedField as any}
								onFieldSelect={handleFieldClick as any}
							/>
						</div>
					</div>
				)}
			</div>

			{/* Detail Modal */}
			{showDetailModal && selectedField && (
				<FieldDetailModal
					field={selectedField}
					isOpen={showDetailModal}
					onClose={() => setShowDetailModal(false)}
				/>
			)}
		</div>
	);
};

export default FieldDashboard;
