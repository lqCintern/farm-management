import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFarmActivityById } from "@/services/farming/farmService";
import { updateFarmActivity } from "@/services/farming/farmService";
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

  const handleCompleteActivity = async () => {
    if (!activity || !activity.id) return;
    
    try {
      await updateFarmActivity(activity.id, { status: "completed" });
      setActivity({ ...activity, status: "completed" });
    } catch (err) {
      console.error("Error updating activity status:", err);
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

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Chi tiết hoạt động nông nghiệp</h1>
        <div className="flex gap-3">
          <Button buttonType="secondary" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
          <Button 
            buttonType="primary" 
            onClick={handleFindWorkers}
            disabled={activity.status === "completed"}
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Tìm người làm
            </span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Thông tin chính */}
        <div className="md:col-span-2">
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {activity.description || "Hoạt động không có mô tả"}
                  </h2>
                  <div className="flex items-center mt-2">
                    <StatusBadge status={activity.status as any || "pending"} />
                    <span className="ml-2 text-sm text-gray-600">
                      {typeof activity.activity_type === "string" && getActivityTypeLabel(activity.activity_type)}
                      {typeof activity.activity_type === "number" && getActivityTypeNumberLabel(activity.activity_type)}
                    </span>
                  </div>
                </div>
                
                {activity.status !== "completed" && (
                  <Button onClick={handleCompleteActivity}>
                    Đánh dấu hoàn thành
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Ngày bắt đầu</p>
                  <p className="font-medium">{formatDate(activity.start_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày kết thúc</p>
                  <p className="font-medium">{formatDate(activity.end_date)}</p>
                </div>
                {activity.frequency && (
                  <div>
                    <p className="text-sm text-gray-600">Tần suất</p>
                    <p className="font-medium">{activity.frequency} ngày</p>
                  </div>
                )}
                {activity.field_id && (
                  <div>
                    <p className="text-sm text-gray-600">Mã ruộng/vườn</p>
                    <p className="font-medium">{activity.field_id}</p>
                  </div>
                )}
                {activity.crop_animal_id && (
                  <div>
                    <p className="text-sm text-gray-600">Cây trồng/Vật nuôi</p>
                    <p className="font-medium">ID: {activity.crop_animal_id}</p>
                  </div>
                )}
              </div>

              {/* Vật tư sử dụng */}
              {activity.materials && Object.keys(activity.materials).length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Vật tư sử dụng</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="divide-y divide-gray-200">
                      {Object.entries(activity.materials).map(([key, value]) => (
                        <li key={key} className="py-2 flex justify-between">
                          <span>{key}</span>
                          <span className="font-medium">{value}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Nếu đã có liên kết với labor request */}
          {activity.labor_requests && activity.labor_requests.length > 0 && (
            <Card className="mt-6">
              <div className="p-6">
                <h3 className="text-lg font-medium mb-3">Yêu cầu đổi công liên quan</h3>
                <div className="space-y-4">
                  {activity.labor_requests.map(request => (
                    <div key={request.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(request.start_date)} - {formatDate(request.end_date)}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <StatusBadge status={request.status as RequestStatus || "unknown"} />
                        <Button 
                          buttonType="text"
                          className="ml-3"
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

        {/* Sidebar với thêm thông tin và hành động */}
        <div>
          <Card>
            <div className="p-4">
              <h3 className="font-medium mb-3">Thao tác nhanh</h3>
              <div className="space-y-2">
                <Button 
                  buttonType="primary" 
                  className="w-full justify-center"
                  onClick={handleFindWorkers}
                  disabled={activity.status === "completed"}
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    Tìm người làm
                  </span>
                </Button>
                <Button 
                  buttonType="secondary" 
                  className="w-full justify-center"
                  onClick={() => navigate(`/farm-activities/${id}/edit`)}
                >
                  Chỉnh sửa hoạt động
                </Button>
                {activity.status !== "completed" && (
                  <Button 
                    className="w-full justify-center"
                    onClick={handleCompleteActivity}
                  >
                    Đánh dấu hoàn thành
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FarmActivityDetail;