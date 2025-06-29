import React, { useEffect, useState } from "react";
import { X, MapPin, Leaf, Activity, Wheat, Calendar, Users, TrendingUp } from "lucide-react";
import { Field } from "@/services/farming/fieldService";
import fieldService from "@/services/farming/fieldService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface FieldDetailModalProps {
	field: Field | null;
	isOpen: boolean;
	onClose: () => void;
}

interface FieldDetail {
	activities: any[];
	harvests: any[];
	crops: any[];
}

const FieldDetailModal: React.FC<FieldDetailModalProps> = ({ field, isOpen, onClose }) => {
	const [details, setDetails] = useState<FieldDetail | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (field && isOpen) {
			fetchFieldDetails();
		}
	}, [field, isOpen]);

	const fetchFieldDetails = async () => {
		if (!field?.id) return;
		
		try {
			setLoading(true);
			const [activitiesRes, harvestsRes, cropsRes] = await Promise.all([
				fieldService.getFieldActivities(field.id),
				fieldService.getFieldHarvests(field.id),
				fieldService.getFieldCrops(field.id)
			]);

			setDetails({
				activities: activitiesRes.data || [],
				harvests: harvestsRes.data || [],
				crops: cropsRes.data || []
			});
		} catch (error) {
			console.error("Error fetching field details:", error);
		} finally {
			setLoading(false);
		}
	};

	const formatArea = (area: number | string) => {
		const numArea = typeof area === 'string' ? parseFloat(area) : area;
		return `${numArea.toFixed(2)} ha`;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('vi-VN');
	};

	if (!isOpen || !field) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b">
					<div>
						<h2 className="text-2xl font-bold text-gray-800">{field.name}</h2>
						<p className="text-gray-600 mt-1">Chi tiết cánh đồng</p>
					</div>
					<Button variant="ghost" size="sm" onClick={onClose}>
						<X className="w-5 h-5" />
					</Button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{loading ? (
						<div className="text-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
							<p className="mt-2 text-gray-600">Đang tải thông tin...</p>
						</div>
					) : (
						<>
							{/* Basic Info */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<MapPin className="w-5 h-5 text-green-600" />
										Thông tin cơ bản
									</CardTitle>
								</CardHeader>
								<CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="text-sm font-medium text-gray-600">Tên cánh đồng</label>
										<p className="text-gray-800">{field.name}</p>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-600">Vị trí</label>
										<p className="text-gray-800">{field.location || "Chưa có"}</p>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-600">Diện tích</label>
										<p className="text-gray-800">{formatArea(field.area || 0)}</p>
									</div>
									<div>
										<label className="text-sm font-medium text-gray-600">Mô tả</label>
										<p className="text-gray-800">{field.description || "Chưa có mô tả"}</p>
									</div>
								</CardContent>
							</Card>

							{/* Statistics */}
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium text-gray-600">Cây trồng</CardTitle>
										<Leaf className="h-4 w-4 text-blue-600" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-gray-800">{details?.crops.length || 0}</div>
										<p className="text-xs text-gray-500 mt-1">Loại cây trồng</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium text-gray-600">Hoạt động</CardTitle>
										<Activity className="h-4 w-4 text-purple-600" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-gray-800">{details?.activities.length || 0}</div>
										<p className="text-xs text-gray-500 mt-1">Hoạt động canh tác</p>
									</CardContent>
								</Card>

								<Card>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<CardTitle className="text-sm font-medium text-gray-600">Thu hoạch</CardTitle>
										<Wheat className="h-4 w-4 text-orange-600" />
									</CardHeader>
									<CardContent>
										<div className="text-2xl font-bold text-gray-800">{details?.harvests.length || 0}</div>
										<p className="text-xs text-gray-500 mt-1">Lần thu hoạch</p>
									</CardContent>
								</Card>
							</div>

							{/* Current Crops */}
							{details?.crops.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Leaf className="w-5 h-5 text-green-600" />
											Cây trồng hiện tại
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											{details.crops.slice(0, 3).map((crop: any, index: number) => (
												<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
													<div>
														<p className="font-medium text-gray-800">{crop.name}</p>
														<p className="text-sm text-gray-600">{crop.variety}</p>
													</div>
													<div className="text-right">
														<Badge className="bg-green-100 text-green-800">
															{crop.current_stage || "Đang phát triển"}
														</Badge>
														<p className="text-sm text-gray-600 mt-1">
															Trồng: {formatDate(crop.planting_date)}
														</p>
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							)}

							{/* Recent Activities */}
							{details?.activities.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Activity className="w-5 h-5 text-purple-600" />
											Hoạt động gần đây
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											{details.activities.slice(0, 5).map((activity: any, index: number) => (
												<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
													<div>
														<p className="font-medium text-gray-800">{activity.activity_type}</p>
														<p className="text-sm text-gray-600">{activity.description}</p>
													</div>
													<div className="text-right">
														<Badge className={
															activity.status === 'completed' ? 'bg-green-100 text-green-800' :
															activity.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
															'bg-yellow-100 text-yellow-800'
														}>
															{activity.status === 'completed' ? 'Hoàn thành' :
															 activity.status === 'in_progress' ? 'Đang thực hiện' : 'Chờ thực hiện'}
														</Badge>
														<p className="text-sm text-gray-600 mt-1">
															{formatDate(activity.start_date)}
														</p>
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							)}

							{/* Recent Harvests */}
							{details?.harvests.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Wheat className="w-5 h-5 text-orange-600" />
											Thu hoạch gần đây
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											{details.harvests.slice(0, 5).map((harvest: any, index: number) => (
												<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
													<div>
														<p className="font-medium text-gray-800">{harvest.type}</p>
														<p className="text-sm text-gray-600">{harvest.description}</p>
													</div>
													<div className="text-right">
														<p className="font-medium text-gray-800">{harvest.quantity} kg</p>
														<p className="text-sm text-gray-600 mt-1">
															{formatDate(harvest.harvest_date)}
														</p>
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							)}
						</>
					)}
				</div>

				{/* Footer */}
				<div className="flex justify-end gap-3 p-6 border-t">
					<Button variant="outline" onClick={onClose}>
						Đóng
					</Button>
					<Button className="bg-green-600 hover:bg-green-700">
						Chỉnh sửa cánh đồng
					</Button>
				</div>
			</div>
		</div>
	);
};

export default FieldDetailModal; 