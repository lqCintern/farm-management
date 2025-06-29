import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFarmActivityById, updateFarmActivity, completeFarmActivity } from "@/services/farming/farmService";
import { FarmActivity } from "@/types/labor/types";
import { RequestStatus } from '@/types/labor/laborRequest.types';
import Card from "@/components/common/Card";
import Button from "@/components/common/Button";
import StatusBadge from "@/components/common/StatusBadge";
import { formatDate } from "@/utils/formatters";

const FarmActivityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<FarmActivity | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Bổ sung phần hiển thị vật tư và xử lý hoàn thành hoạt động

  // Thêm state mới để quản lý vật tư thực tế
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [actualMaterials, setActualMaterials] = useState<Record<string, number>>({});
  const [completingActivity, setCompletingActivity] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [completionDate, setCompletionDate] = useState<string>("");

  useEffect(() => {
    const fetchActivityDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await getFarmActivityById(parseInt(id));
        console.log("Farm activity raw response:", response); // Thêm debug log
        
        // Xử lý cấu trúc dữ liệu đúng
        let activityData;
        if (response.data && typeof response.data === 'object' && 'data' in response.data) {
          // Nếu dữ liệu được lồng trong .data.data
          activityData = response.data.data as FarmActivity;
        } else {
          // Nếu dữ liệu nằm ngay trong .data
          activityData = response.data as FarmActivity;
        }
        
        console.log("Processed activity data:", activityData); // Thêm debug log
        setActivity(activityData);
        setError(null);
      } catch (err) {
        console.error("Error fetching activity details:", err);
        setError("Không thể tải thông tin hoạt động");
      } finally {
        setLoading(false);
      }
    };

    fetchActivityDetails();
  }, [id]);

  // Chuyển sang tìm người làm từ hoạt động này
  const handleFindWorkers = () => {
    // Truyền thông tin hoạt động qua state navigation
    navigate("/labor/requests/create", { 
      state: { 
        fromActivity: activity 
      } 
    });
  };

  // Thêm hàm xử lý hoàn thành với vật tư thực tế
  const handleCompleteActivity = () => {
    // Nếu cần vật tư, hiển thị modal để nhập số lượng thực tế
    if (activity && activity.materials && Object.keys(activity.materials).length > 0) {
      // Khởi tạo actual_materials với giá trị từ planned_materials
      const initialActualMaterials: Record<string, number> = {};
      Object.entries(activity.materials).forEach(([id, material]: [string, any]) => {
        initialActualMaterials[id] = material.planned_quantity || 0;
      });
      setActualMaterials(initialActualMaterials);
      setShowCompleteModal(true);
    } else {
      // Nếu không cần vật tư, xác nhận hoàn thành luôn
      confirmCompleteActivity({});
    }
  };

  // Hàm xác nhận hoàn thành với API
  const confirmCompleteActivity = async (actualMaterialsData: Record<string, number>) => {
    if (!activity || !activity.id) return;
    
    try {
      setCompletingActivity(true);
      // Sử dụng completeFarmActivity thay vì updateFarmActivity
      const result = await completeFarmActivity(activity.id, {
        actual_notes: notes,
        actual_materials: actualMaterialsData
      });
      
      // Cập nhật UI
      setActivity({ 
        ...activity, 
        status: "completed",
        actual_notes: notes,
        materials: Object.entries(activity.materials || {}).map(([id, material]: [string, any]) => ({
          ...material,
          actual_quantity: actualMaterialsData[id] || material.planned_quantity
        }))
      });
      
      setShowCompleteModal(false);
      
      // Hiển thị thông báo thành công
      let successMessage = "Hoạt động đã được hoàn thành thành công";
      
      // Thêm thông báo về việc tự động chuyển giai đoạn nếu có
      if (result.stage_advance_message) {
        successMessage += `\n\n${result.stage_advance_message}`;
      }
      
      // Thêm gợi ý nếu có
      if (result.suggestion) {
        successMessage += `\n\nGợi ý: ${result.suggestion}`;
      }
      
      alert(successMessage);
    } catch (err) {
      console.error("Error updating activity status:", err);
      alert("Có lỗi xảy ra khi hoàn thành hoạt động");
    } finally {
      setCompletingActivity(false);
    }
  };

  const getActivityTypeLabel = (type: string): string => {
    const activityTypes: Record<string, string> = {
      'soil_preparation': 'Làm đất',
      'planting': 'Gieo trồng',
      'fertilizing': 'Bón phân',
      'watering': 'Tưới nước',
      'pesticide': 'Phun thuốc',
      'harvesting': 'Thu hoạch',
    };
    
    return activityTypes[type] || type;
  };

  const getActivityTypeNumberLabel = (type: number): string => {
    switch (type) {
      case 1: return "Tưới nước";
      case 2: return "Bón phân";
      case 3: return "Thu hoạch";
      case 4: return "Phun thuốc";
      case 5: return "Làm đất";
      case 6: return "Gieo trồng";
      default: return `Loại ${type}`;
    }
  };

  // Cập nhật phần xử lý materials để hỗ trợ cả định dạng array và object
  const getMaterialsForDisplay = () => {
    if (!activity || !activity.materials) return [];

    // Map actual_materials theo id
    const actualMap: Record<string, number> = {};
    if (Array.isArray(activity.actual_materials)) {
      activity.actual_materials.forEach((mat: any) => {
        actualMap[mat.id] = mat.quantity;
      });
    }

    if (Array.isArray(activity.materials)) {
      return activity.materials.map(material => ({
        id: material.id,
        name: material.name,
        unit: material.unit,
        planned_quantity: material.quantity || 0, // Sử dụng quantity từ response
        actual_quantity: actualMap[material.id] ?? 0 // Sử dụng từ actual_materials
      }));
    }

    // Nếu materials là object (format cũ)
    return Object.entries(activity.materials).map(([id, matData]: [string, any]) => ({
      id,
      name: matData.name,
      unit: matData.unit,
      planned_quantity: matData.planned_quantity || matData.quantity || 0,
      actual_quantity: actualMap[id] ?? (matData.actual_quantity || matData.planned_quantity || matData.quantity || 0)
    }));
  };

  // Helper để hiển thị thời gian còn lại
  const getDaysRemaining = (date: string): string => {
    const startDate = new Date(date);
    const today = new Date();
    
    // Số ngày còn lại
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return "Đã quá hạn";
    } else if (diffDays === 0) {
      return "Hôm nay";
    } else if (diffDays === 1) {
      return "Ngày mai";
    } else {
      return `Còn ${diffDays} ngày`;
    }
  };

  // Helper để hiển thị tần suất
  const getFrequencyLabel = (frequency: string): string => {
    switch (frequency) {
      case "once": return "Một lần";
      case "daily": return "Hàng ngày";
      case "weekly": return "Hàng tuần";
      case "monthly": return "Hàng tháng";
      default: return frequency;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center">Không tìm thấy hoạt động</div>
      </div>
    );
  }

  function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  function setActualMaterialsFromPlanned(): void {
    if (!activity || !activity.materials) return;

    const updatedMaterials: Record<string, number> = {};
    getMaterialsForDisplay().forEach((material) => {
      updatedMaterials[material.id] = material.planned_quantity || 0;
    });

    setActualMaterials(updatedMaterials);
  }
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header với breadcrumb và actions */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center mb-1">
            <button 
              onClick={() => navigate(-1)}
              className="mr-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-gray-500">Hoạt động nông nghiệp</span>
          </div>
          <h1 className="text-2xl font-bold">{activity.description || "Hoạt động không có mô tả"}</h1>
        </div>

        {/* Action buttons - chỉ hiển thị ở đây, không duplicate ở sidebar */}
        <div className="flex gap-2 self-end sm:self-auto">
          {activity.status !== "completed" && (
            <>
              <Button 
                buttonType="primary" 
                onClick={handleCompleteActivity}
                className="flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Đánh dấu hoàn thành
              </Button>
              <Button 
                buttonType="secondary" 
                onClick={handleFindWorkers}
              >
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Tìm người làm
                </span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6">
              {/* Status bar - hiển thị trạng thái và thời gian */}
              <div className="flex flex-wrap items-center justify-between bg-gray-50 p-3 rounded-lg mb-6">
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                  <StatusBadge status={activity.status as any || "pending"} />
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm">
                    {getActivityTypeLabel(String(activity.activity_type))}
                  </span>
                  
                  {/* Hiển thị thời gian còn lại */}
                  {activity.status === "pending" && (
                    <span className={`px-2 py-1 rounded-md text-sm ${
                      activity.status_details?.starting_soon 
                        ? "bg-yellow-50 text-yellow-700" 
                        : "bg-gray-50 text-gray-700"
                    }`}>
                      {getDaysRemaining(activity.start_date)}
                    </span>
                  )}
                </div>
                {activity.status === "completed" && activity.actual_completion_date && (
                  <span className="text-sm text-green-600 font-medium">
                    Hoàn thành: {formatDate(activity.actual_completion_date)}
                  </span>
                )}
              </div>

              {/* Thông tin thời gian và địa điểm - hợp nhất thành một phần */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Thời gian
                  </h3>
                  
                  <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bắt đầu:</span>
                      <span className="font-medium">{formatDate(activity.start_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kết thúc:</span>
                      <span className="font-medium">{formatDate(activity.end_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tần suất:</span>
                      <span className="font-medium capitalize">{getFrequencyLabel(String(activity.frequency))}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Vị trí
                  </h3>
                  
                  <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ruộng/Vườn:</span>
                      <span className="font-medium">
                        {`Mã ruộng: ${activity.field_id}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cây trồng:</span>
                      <span className="font-medium">
                        {`Mã cây: ${activity.crop_animal_id}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vật tư sử dụng */}
              {activity.materials && (Array.isArray(activity.materials) ? activity.materials.length > 0 : Object.keys(activity.materials).length > 0) && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Vật tư sử dụng
                  </h3>
                  
                  <div className="overflow-x-auto bg-gray-50 p-0 rounded-lg">
                    <table className="min-w-full">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Tên vật tư</th>
                          <th className="text-left py-3 px-4 font-medium text-sm text-gray-700">Đơn vị</th>
                          <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Dự kiến</th>
                          {activity.status === "completed" && (
                            <th className="text-right py-3 px-4 font-medium text-sm text-gray-700">Thực tế</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {getMaterialsForDisplay().map((material, index) => (
                          <tr key={material.id} className={index % 2 ? "bg-gray-50" : "bg-white"}>
                            <td className="py-3 px-4">{material.name}</td>
                            <td className="py-3 px-4">{material.unit}</td>
                            <td className="py-3 px-4 text-right">{material.planned_quantity}</td>
                            {activity.status === "completed" && (
                              <td className="py-3 px-4 text-right">
                                {material.actual_quantity}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Nếu đã có liên kết với labor request */}
          {activity.labor_requests && activity.labor_requests.length > 0 && (
            <Card className="mt-6">
              <div className="p-6">
                <h3 className="font-medium text-gray-700 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Yêu cầu đổi công liên quan
                </h3>
                <div className="space-y-4">
                  {activity.labor_requests.map(request => (
                    <div key={request.id} className="flex flex-col sm:flex-row justify-between gap-2 p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(request.start_date)} - {formatDate(request.end_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto mt-2 sm:mt-0">
                        <StatusBadge status={request.status as RequestStatus || "unknown"} />
                        <Button 
                          buttonType="text"
                          onClick={() => navigate(`/labor/requests/${request.id}`)}
                        >
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar với các thao tác và thông tin khác */}
        <div>
          <Card>
            <div className="p-6">
              <h3 className="font-medium text-gray-700 mb-4">Thao tác</h3>
              <div className="space-y-3">
                {activity.status !== "completed" && (
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      buttonType="secondary" 
                      onClick={() => navigate(`/farm-activities/${id}/edit`)}
                      className="flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Chỉnh sửa
                    </Button>
                    
                    {/* Thêm các nút bổ sung */}
                    <Button 
                      buttonType="danger" 
                      onClick={() => {/* Xử lý xóa */}}
                      className="flex items-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Xóa
                    </Button>
                  </div>
                )}
                
                {activity.status === "completed" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Hoạt động đã hoàn thành</span>
                    </div>
                    {activity.actual_notes && (
                      <p className="mt-2 text-sm">{activity.actual_notes}</p>
                    )}
                  </div>
                )}

                {/* Phần QR code hoặc tính năng chia sẻ (tuỳ chọn) */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h4 className="text-sm uppercase font-medium text-gray-500 mb-3">Chia sẻ</h4>
                  <div className="flex gap-2">
                    <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                    <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Phần tư vấn hoạt động tiếp theo (tùy chọn) */}
          <Card className="mt-6">
            <div className="p-6">
              <h3 className="font-medium text-gray-700 mb-3">Gợi ý tiếp theo</h3>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  Sau hoạt động {getActivityTypeLabel(String(activity.activity_type))}, bạn nên:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Kiểm tra định kỳ sau 3-5 ngày
                  </li>
                  <li className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {activity.activity_type === 'fertilizing' ? 'Tưới nước đầy đủ' : 'Phun thuốc phòng nấm'}
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal xác nhận hoàn thành - giữ nguyên */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Xác nhận hoàn thành hoạt động</h3>
              <button 
                onClick={() => setShowCompleteModal(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Ngày hoàn thành</label>
              <input
                type="date"
                value={completionDate || formatDateForInput(new Date())}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Ghi chú hoàn thành</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border rounded p-2"
                rows={3}
                placeholder="Nhập ghi chú về việc thực hiện hoạt động (nếu có)"
              />
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Vật tư đã sử dụng thực tế</h4>
                <button 
                  onClick={() => setActualMaterialsFromPlanned()}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Đặt bằng số lượng dự kiến
                </button>
              </div>
              
              <div className="bg-gray-50 border rounded-lg">
                {getMaterialsForDisplay().map((material, index) => (
                  <div key={material.id} className={`flex items-center p-3 ${index > 0 ? 'border-t' : ''}`}>
                    <div className="flex-grow">
                      <p className="font-medium">{material.name}</p>
                      <p className="text-sm text-gray-500">Dự kiến: {material.planned_quantity} {material.unit}</p>
                    </div>
                    <div className="w-24 flex items-center">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={actualMaterials[material.id] || 0}
                        onChange={(e) => {
                          const newMaterials = {...actualMaterials};
                          newMaterials[material.id] = parseFloat(e.target.value) || 0;
                          setActualMaterials(newMaterials);
                        }}
                        className="border rounded p-1 w-16 text-right"
                      />
                      <span className="ml-1 text-gray-600">{material.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                buttonType="secondary"
                onClick={() => setShowCompleteModal(false)}
              >
                Hủy
              </Button>
              <Button
                buttonType="primary"
                onClick={() => confirmCompleteActivity(actualMaterials)}
                disabled={completingActivity}
                className="min-w-[120px]"
              >
                {completingActivity ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Đang xử lý
                  </div>
                ) : "Xác nhận"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmActivityDetail;
