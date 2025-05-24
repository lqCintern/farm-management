import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FaArrowLeft, FaEdit, FaTrash, FaLeaf, FaCalendarAlt, 
  FaChartLine, FaArrowRight, FaList, FaCheck, FaExclamationTriangle, FaPlus
} from 'react-icons/fa';
import * as pineappleCropService from '@/services/farming/pineappleCropService';
import * as farmService from '@/services/farming/farmService';
import { PineappleCrop, FarmActivity } from '@/types';
import Modal from '@/components/common/Modal';

const STAGE_COLORS = {
  preparation: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Chuẩn bị' },
  planting: { bg: 'bg-green-100', text: 'text-green-800', label: 'Trồng' },
  growing: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sinh trưởng' },
  flowering: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Ra hoa' },
  fruiting: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Ra quả' },
  harvesting: { bg: 'bg-red-100', text: 'text-red-800', label: 'Thu hoạch' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Hoàn thành' }
};

const STATUS_COLORS = {
  planning: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Lên kế hoạch' },
  in_progress: { bg: 'bg-green-100', text: 'text-green-800', label: 'Đang tiến hành' },
  completed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Hoàn thành' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Đã hủy' }
};

const PineappleCropDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [crop, setCrop] = useState<PineappleCrop | null>(null);
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activitiesLoading, setActivitiesLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showAdvanceModal, setShowAdvanceModal] = useState<boolean>(false);
  const [showHarvestModal, setShowHarvestModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [harvestQuantity, setHarvestQuantity] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    fetchCropData();
    fetchActivities();
  }, [id]);

  const fetchCropData = async () => {
    try {
      setLoading(true);
      const response = await pineappleCropService.getPineappleCropById(Number(id));
      setCrop((response as { data: PineappleCrop }).data);
    } catch (error) {
      console.error('Error fetching pineapple crop:', error);
      setError('Không thể tải dữ liệu vụ trồng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setActivitiesLoading(true);
      // Lấy tất cả hoạt động, lọc theo crop_animal_id phía client
      const response = await farmService.getFarmActivities();
      const activities = (response?.farm_activities || []).filter(
        (activity: FarmActivity) => activity.crop_animal_id === Number(id)
      );
      setActivities(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleAdvanceStage = async () => {
    try {
      const response = await pineappleCropService.advanceStage(Number(id));
      setCrop((response as { data: PineappleCrop }).data);
      setShowAdvanceModal(false);
      setError('');
    } catch (error) {
      console.error('Error advancing stage:', error);
      setError('Không thể chuyển giai đoạn. Vui lòng thử lại.');
    }
  };

  const handleRecordHarvest = async () => {
    try {
      const quantity = parseFloat(harvestQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        setError('Vui lòng nhập số lượng thu hoạch hợp lệ.');
        return;
      }
      
      const response = await pineappleCropService.recordHarvest(Number(id), quantity);
      setCrop((response as { data: PineappleCrop }).data);
      setShowHarvestModal(false);
      setHarvestQuantity('');
      setError('');
    } catch (error) {
      console.error('Error recording harvest:', error);
      setError('Không thể ghi nhận thu hoạch. Vui lòng thử lại.');
    }
  };

  const handleDeleteCrop = async () => {
    try {
      await pineappleCropService.deletePineappleCrop(Number(id));
      navigate('/pineapple_crops', { state: { message: 'Đã xóa vụ trồng thành công' } });
    } catch (error) {
      console.error('Error deleting pineapple crop:', error);
      setError('Không thể xóa vụ trồng. Vui lòng thử lại.');
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu vụ trồng dứa...</p>
        </div>
      </div>
    );
  }

  if (!crop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg text-center">
          <p className="text-red-600 font-medium mb-4">Không tìm thấy vụ trồng dứa</p>
          <button
            onClick={() => navigate('/pineapple_crops')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const stageStyle = STAGE_COLORS[crop.current_stage as keyof typeof STAGE_COLORS] || STAGE_COLORS.preparation;
  const statusStyle = STATUS_COLORS[crop.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.planning;

  // Tính các giai đoạn và trạng thái tiếp theo
  const getNextStage = () => {
    const stages = ['preparation', 'planting', 'growing', 'flowering', 'fruiting', 'harvesting', 'completed'];
    const currentIndex = stages.indexOf(crop.current_stage);
    return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
  };

  const nextStage = getNextStage();
  const nextStageStyle = nextStage ? STAGE_COLORS[nextStage as keyof typeof STAGE_COLORS] : null;

  // Lọc các hoạt động theo trạng thái
  const pendingActivities = activities.filter(activity => activity.status === 'pending' || activity.status === 'in_progress');
  const completedActivities = activities.filter(activity => activity.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header with back button */}
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/pineapple')}
                className="text-gray-600 hover:text-gray-900 mr-4 flex items-center"
              >
                <FaArrowLeft className="mr-2" />
                <span>Quay lại</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-800">{crop.name}</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/pineapple/${id}/edit`)}
                className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-gray-700 flex items-center hover:bg-gray-50"
              >
                <FaEdit className="mr-2" />
                Chỉnh sửa
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-red-600 flex items-center hover:bg-gray-50"
              >
                <FaTrash className="mr-2" />
                Xóa
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tổng quan
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activities'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Lịch chăm sóc
              </button>
              <button
                onClick={() => setActiveTab('harvests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'harvests'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Thu hoạch
              </button>
            </nav>
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Thông tin cơ bản */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Thông tin vụ trồng</h2>
                
                {/* Trạng thái và giai đoạn */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${stageStyle.bg} ${stageStyle.text}`}>
                    {stageStyle.label}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusStyle.label}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Loại mùa vụ:</span>
                    <span className="font-medium">{crop.season_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày trồng:</span>
                    <span className="font-medium">
                      {new Date(crop.planting_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Diện tích:</span>
                    <span className="font-medium">{crop.field_area} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mật độ trồng:</span>
                    <span className="font-medium">{crop.planting_density} cây/ha</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giống dứa:</span>
                    <span className="font-medium">{crop.variety || 'Không có'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nguồn cây giống:</span>
                    <span className="font-medium">{crop.source || 'Không có'}</span>
                  </div>
                </div>

                {crop.description && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Mô tả</h3>
                    <p className="text-gray-800">{crop.description}</p>
                  </div>
                )}
              </div>

              {/* Tiến độ vụ trồng */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Tiến độ vụ trồng</h2>
                
                {/* Progress bar */}
                <div className="relative pt-1 mb-6">
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: getStageProgressPercent(crop) }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Chuẩn bị</span>
                    <span>Trồng</span>
                    <span>Sinh trưởng</span>
                    <span>Ra hoa</span>
                    <span>Ra quả</span>
                    <span>Thu hoạch</span>
                  </div>
                </div>

                {/* Thống kê tiến độ */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giai đoạn hiện tại:</span>
                    <span className={`font-medium ${stageStyle.text}`}>{stageStyle.label}</span>
                  </div>
                  {nextStage && nextStageStyle && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giai đoạn tiếp theo:</span>
                      <span className={`font-medium ${nextStageStyle.text}`}>{nextStageStyle.label}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Công việc chờ xử lý:</span>
                    <span className="font-medium">{pendingActivities.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Công việc đã hoàn thành:</span>
                    <span className="font-medium">{completedActivities.length}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  {nextStage && crop.status !== 'completed' && (
                    <button
                      onClick={() => setShowAdvanceModal(true)}
                      className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                    >
                      <FaArrowRight className="mr-2" />
                      Chuyển sang giai đoạn tiếp theo
                    </button>
                  )}
                  
                  {crop.current_stage === 'harvesting' && (
                    <button
                      onClick={() => setShowHarvestModal(true)}
                      className="w-full py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center"
                    >
                      <FaLeaf className="mr-2" />
                      Ghi nhận thu hoạch
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate(`/farm_activities?crop_animal_id=${id}`)}
                    className="w-full py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                  >
                    <FaCalendarAlt className="mr-2" />
                    Xem tất cả công việc
                  </button>
                </div>
              </div>

              {/* Thông tin bổ sung */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Hoạt động sắp tới</h2>
                
                {activitiesLoading ? (
                  <div className="py-8 text-center text-gray-500">
                    <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p>Đang tải hoạt động...</p>
                  </div>
                ) : pendingActivities.length > 0 ? (
                  <div className="space-y-4">
                    {pendingActivities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="border-l-4 border-yellow-400 pl-3 py-2">
                        <div className="font-medium">{activity.description}</div>
                        <div className="text-sm text-gray-600 flex justify-between mt-1">
                          <span>
                            {new Date(activity.start_date).toLocaleDateString('vi-VN')} →{' '}
                            {new Date(activity.end_date).toLocaleDateString('vi-VN')}
                          </span>
                          <Link
                            to={`/farm_activities/${activity.id}`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Chi tiết
                          </Link>
                        </div>
                      </div>
                    ))}
                    
                    {pendingActivities.length > 5 && (
                      <div className="text-center pt-2">
                        <Link
                          to={`/farm_activities?crop_animal_id=${id}&status=pending`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Xem tất cả {pendingActivities.length} công việc →
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <FaCheck className="mx-auto text-green-500 text-3xl mb-2" />
                    <p>Không có hoạt động đang chờ xử lý</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Lịch chăm sóc</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate(`/farm_activities/new?crop_animal_id=${id}`)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <FaPlus className="mr-2" />
                    Thêm công việc
                  </button>
                </div>
              </div>

              {activitiesLoading ? (
                <div className="py-8 text-center text-gray-500">
                  <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>Đang tải hoạt động...</p>
                </div>
              ) : activities.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Công việc
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ngày thực hiện
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Trạng thái
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{activity.description}</div>
                            <div className="text-sm text-gray-500">{activity.activity_type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(activity.start_date).toLocaleDateString('vi-VN')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {activity.end_date &&
                                activity.end_date !== activity.start_date &&
                                `đến ${new Date(activity.end_date).toLocaleDateString('vi-VN')}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${activity.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                activity.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                                'bg-yellow-100 text-yellow-800'}`}
                            >
                              {activity.status === 'completed' ? 'Hoàn thành' : 
                                activity.status === 'in_progress' ? 'Đang thực hiện' : 'Chờ xử lý'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link 
                              to={`/farm_activities/${activity.id}`} 
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Chi tiết
                            </Link>
                            <Link 
                              to={`/farm_activities/${activity.id}/edit`} 
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Chỉnh sửa
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <FaList className="mx-auto text-gray-400 text-3xl mb-2" />
                  <p>Chưa có hoạt động nào được tạo</p>
                  <button
                    onClick={() => navigate(`/farm_activities/new?crop_animal_id=${id}`)}
                    className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Thêm công việc mới
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'harvests' && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Thông tin thu hoạch</h2>
                {crop.current_stage === 'harvesting' && (
                  <button
                    onClick={() => setShowHarvestModal(true)}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center"
                  >
                    <FaPlus className="mr-2" />
                    Ghi nhận thu hoạch
                  </button>
                )}
              </div>

              {/* Kiểm tra xem thuộc tính harvests có tồn tại không và có phần tử nào không */}
              {crop.harvests && crop.harvests.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ngày thu hoạch
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Số lượng (kg)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ghi chú
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {crop.harvests.map((harvest, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(harvest.date).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {harvest.quantity}
                          </td>
                          <td className="px-6 py-4">
                            {harvest.notes || '-'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-medium">
                        <td className="px-6 py-4 whitespace-nowrap">
                          Tổng cộng
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {crop.harvests.reduce((sum, item) => sum + item.quantity, 0)} kg
                        </td>
                        <td className="px-6 py-4"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <FaLeaf className="mx-auto text-gray-400 text-3xl mb-2" />
                  <p>Chưa có thông tin thu hoạch</p>
                  {crop.current_stage === 'harvesting' ? (
                    <button
                      onClick={() => setShowHarvestModal(true)}
                      className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      Ghi nhận thu hoạch đầu tiên
                    </button>
                  ) : (
                    <p className="mt-3 text-sm">
                      Bạn có thể ghi nhận thu hoạch khi vụ trồng đến giai đoạn thu hoạch
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Advance Stage Modal */}
      <Modal
        isOpen={showAdvanceModal}
        onClose={() => setShowAdvanceModal(false)}
        title="Chuyển sang giai đoạn tiếp theo"
      >
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              Bạn đang chuyển vụ trồng từ giai đoạn:
            </p>
            <div className="flex items-center space-x-2 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${stageStyle.bg} ${stageStyle.text}`}>
                {stageStyle.label}
              </span>
              <FaArrowRight className="text-gray-400" />
              {nextStageStyle && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${nextStageStyle.bg} ${nextStageStyle.text}`}>
                  {nextStageStyle.label}
                </span>
              )}
            </div>
            <p className="text-gray-600 mt-4">
              Hành động này sẽ cập nhật trạng thái và có thể tạo các hoạt động mới cho giai đoạn tiếp theo.
            </p>
            
            {pendingActivities.length > 0 && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                <div className="flex">
                  <FaExclamationTriangle className="flex-shrink-0 h-5 w-5 text-yellow-400 mr-2" />
                  <div>
                    <p className="font-medium">Lưu ý:</p>
                    <p>Còn {pendingActivities.length} công việc chưa hoàn thành trong giai đoạn hiện tại.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowAdvanceModal(false)}
              className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={handleAdvanceStage}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Xác nhận chuyển giai đoạn
            </button>
          </div>
        </div>
      </Modal>

      {/* Harvest Modal */}
      <Modal
        isOpen={showHarvestModal}
        onClose={() => setShowHarvestModal(false)}
        title="Ghi nhận thu hoạch"
      >
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng thu hoạch (kg)
            </label>
            <input
              type="number"
              value={harvestQuantity}
              onChange={(e) => setHarvestQuantity(e.target.value)}
              min="0"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowHarvestModal(false)}
              className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={handleRecordHarvest}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Ghi nhận
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa vụ trồng"
      >
        <div className="p-6">
          <div className="mb-4">
            <div className="flex items-start">
              <FaExclamationTriangle className="flex-shrink-0 h-6 w-6 text-red-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 mb-2">
                  Bạn chắc chắn muốn xóa vụ trồng này?
                </p>
                <p className="text-gray-600">
                  Hành động này sẽ xóa vĩnh viễn vụ trồng và tất cả hoạt động liên quan. Dữ liệu đã xóa không thể khôi phục.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 bg-white rounded-lg text-gray-700"
            >
              Hủy
            </button>
            <button
              onClick={handleDeleteCrop}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Xác nhận xóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Helper function để tính phần trăm tiến độ giai đoạn
function getStageProgressPercent(crop: any) {
    const stages = ['preparation', 'planting', 'growing', 'flowering', 'fruiting', 'harvesting', 'completed'];
    const currentStageIndex = stages.indexOf(crop.current_stage);
    return `${Math.min(100, (currentStageIndex / (stages.length - 1)) * 100)}%`;
  }

export default PineappleCropDetailPage;