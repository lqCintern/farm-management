import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes, FaArrowLeft, FaCalendarAlt, FaEdit, FaCheck } from 'react-icons/fa';
import * as pineappleCropService from '@/services/farming/pineappleCropService';
import fieldService from '@/services/farming/fieldService';
import { PineappleCrop, FarmActivity } from '@/types/labor/types';

const SEASON_TYPES = [
  { value: 'spring_summer', label: 'Xuân-Hè' },
  { value: 'fall_winter', label: 'Thu-Đông' }
];

const VARIETIES = [
  { value: 'Queen', label: 'Queen' },
  { value: 'Smooth Cayenne', label: 'Smooth Cayenne' },
  { value: 'MD2', label: 'MD2 (Gold)' },
  { value: 'Phuket', label: 'Phuket' }
];

interface Field {
  id: number;
  name: string;
  area: number;
}

const PineappleCropFormPage: React.FC = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  const navigate = useNavigate();

  // Form data
  const [name, setName] = useState<string>('');
  const [fieldId, setFieldId] = useState<number | ''>('');
  const [plantingDate, setPlantingDate] = useState<string>('');
  const [fieldArea, setFieldArea] = useState<number | ''>('');
  const [seasonType, setSeasonType] = useState<string>('spring_summer');
  const [plantingDensity, setPlantingDensity] = useState<number | ''>(60000);
  const [currentStage, setCurrentStage] = useState<string>('preparation');
  const [status, setStatus] = useState<string>('planning');
  const [description, setDescription] = useState<string>('');
  const [variety, setVariety] = useState<string>('Queen');
  const [source, setSource] = useState<string>('');

  // Preview and confirmation
  const [fields, setFields] = useState<Field[]>([]);
  const [previewActivities, setPreviewActivities] = useState<FarmActivity[]>([]);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [editedActivities, setEditedActivities] = useState<FarmActivity[]>([]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Additional state for activity detail
  const [selectedActivity, setSelectedActivity] = useState<FarmActivity | null>(null);
  const [showActivityDetail, setShowActivityDetail] = useState<boolean>(false);

  // Fetch field list on component mount
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fieldService.getFields();
        console.log('Fields response:', response); // Debug log
        
        if (response && response.data) {
          setFields(
            response.data.map((field: any) => ({
              id: field.id as number,
              name: field.name as string,
              area: typeof field.area === 'string' ? parseFloat(field.area) : field.area as number
            }))
          );
          console.log('Processed fields:', fields); // Debug log
        }
      } catch (error) {
        console.error('Error fetching fields:', error);
        setError('Không thể tải danh sách cánh đồng. Vui lòng thử lại sau.');
      }
    };

    fetchFields();
  }, []);

  // Fetch pineapple crop data if in edit mode
  useEffect(() => {
    const fetchCropData = async () => {
    if (isEditMode) {
      try {
        const response = await pineappleCropService.getPineappleCropById(Number(id));
        const crop = (response as { data: PineappleCrop }).data;

        setName(crop.name ?? '');
        setFieldId(typeof crop.field_id === 'number' ? crop.field_id : '');
        setPlantingDate(crop.planting_date);
        setFieldArea(typeof crop.field_area === 'number' ? crop.field_area : '');
        setSeasonType(crop.season_type ?? 'spring_summer');
        setPlantingDensity(typeof crop.planting_density === 'number' ? crop.planting_density : '');
        setCurrentStage(crop.current_stage);
        setStatus(crop.status ?? 'planning');
        setDescription(crop.description || '');
        setVariety(crop.variety ?? 'Queen');
        setSource(crop.source || '');
      } catch (error) {
        console.error('Error fetching pineapple crop data:', error);
        setError('Không thể tải dữ liệu vụ trồng. Vui lòng thử lại sau.');
      }
    }
    };

    fetchCropData();
  }, [id, isEditMode]);

  const handleSelectField = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = Number(e.target.value);
    setFieldId(selectedId);
    
    // Auto-fill field area if field is selected
    if (selectedId) {
      const selectedField = fields.find(field => field.id === selectedId);
      if (selectedField) {
        setFieldArea(selectedField.area);
      }
    }
  };
  
  const generatePreview = async () => {
    if (!validateForm()) return;
    
    setIsGeneratingPreview(true);
    setError('');
    
    try {
      const cropData = {
        pineapple_crop: {
          name,
          field_id: Number(fieldId),
          planting_date: plantingDate,
          field_area: Number(fieldArea),
          season_type: seasonType,
          planting_density: Number(plantingDensity),
          current_stage: currentStage,
          status,
          description,
          variety,
          source
        }
      };
      
      const response = await pineappleCropService.previewPlan(cropData);
      // Map lại để đảm bảo mỗi activity có trường stage
      const previewWithStage = response.preview_activities.map((act: any) => ({
        ...act,
        stage: act.stage
      }));
      
      // Debug: Kiểm tra stage từ preview
      console.log('Preview activities with stage:', previewWithStage);
      previewWithStage.forEach((act: any, index: number) => {
        console.log(`Activity ${index}: stage = ${act.stage}, activity_type = ${act.activity_type}`);
      });
      
      setPreviewActivities(previewWithStage);
      setEditedActivities(previewWithStage);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      setError('Không thể tạo xem trước kế hoạch. Vui lòng thử lại.');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleEditActivity = (index: number, updatedActivity: Partial<FarmActivity>) => {
    const newActivities = [...editedActivities];
    newActivities[index] = { ...newActivities[index], ...updatedActivity };
    setEditedActivities(newActivities);
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên vụ trồng dứa.');
      return false;
    }
    
    if (!fieldId) {
      setError('Vui lòng chọn cánh đồng.');
      return false;
    }
    
    if (!plantingDate) {
      setError('Vui lòng chọn ngày trồng.');
      return false;
    }
    
    if (!fieldArea) {
      setError('Vui lòng nhập diện tích.');
      return false;
    }
    
    if (!plantingDensity) {
      setError('Vui lòng nhập mật độ trồng.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const cropData = {
        pineapple_crop: {
          name,
          field_id: Number(fieldId),
          planting_date: plantingDate,
          field_area: Number(fieldArea),
          season_type: seasonType,
          planting_density: Number(plantingDensity),
          current_stage: currentStage,
          status,
          description,
          variety,
          source
        }
      };
      
      if (isEditMode) {
        await pineappleCropService.updatePineappleCrop(Number(id), cropData);
      } else {
        const response = await pineappleCropService.createPineappleCrop(cropData) as { pineapple_crop?: { id: number } };
        console.log('createPineappleCrop response:', response);
        const newCropId = response?.pineapple_crop?.id;
        if (!newCropId) {
          setError('Không thể tạo vụ trồng dứa. Dữ liệu trả về không hợp lệ.');
          setIsSubmitting(false);
          return;
        }
        if (editedActivities.length > 0) {
          // Đảm bảo luôn truyền stage khi xác nhận kế hoạch
          const activitiesWithStage = editedActivities.map((act) => ({
            ...act,
            stage: act.stage
          }));
          
          // Debug: Kiểm tra stage trước khi confirm plan
          console.log('Confirm plan activities with stage:', activitiesWithStage);
          activitiesWithStage.forEach((act: any, index: number) => {
            console.log(`Confirm Activity ${index}: stage = ${act.stage}, activity_type = ${act.activity_type}`);
          });
          
          await pineappleCropService.confirmPlan(newCropId, activitiesWithStage);
        }
      }
      
      navigate('/fields');
    } catch (error) {
      console.error('Error saving pineapple crop:', error);
      setError(`Không thể ${isEditMode ? 'cập nhật' : 'tạo'} vụ trồng dứa. Vui lòng thử lại.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityTypeLabel = (activityType: string | number) => {
    // Convert to string if it's a number
    const typeStr = String(activityType);
    
    // Implement the logic to map activity type to a readable label
    switch (typeStr) {
      case 'preparation':
        return 'Chuẩn bị';
      case 'planting':
        return 'Trồng';
      case 'harvesting':
        return 'Thu hoạch';
      case 'maintenance':
        return 'Bảo trì';
      default:
        return typeStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header with back button */}
          <div className="mb-6 flex items-center">
            <button
              onClick={() => navigate('/pineapple')}
              className="text-gray-600 hover:text-gray-900 mr-4 flex items-center"
            >
              <FaArrowLeft className="mr-2" />
              <span>Quay lại</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Chỉnh sửa vụ trồng dứa' : 'Tạo vụ trồng dứa mới'}
            </h1>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {!showPreview ? (
              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Tên vụ */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên vụ trồng <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập tên vụ trồng dứa"
                        required
                      />
                    </div>

                    {/* Chọn cánh đồng */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cánh đồng <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={fieldId}
                        onChange={handleSelectField}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">Chọn cánh đồng</option>
                        {fields.map((field) => (
                          <option key={field.id} value={field.id}>
                            {field.name} ({field.area.toLocaleString()} m²)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Ngày trồng */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày trồng <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={plantingDate}
                          onChange={(e) => setPlantingDate(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />
                      </div>
                    </div>

                    {/* Diện tích */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Diện tích (m²) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={fieldArea}
                          onChange={(e) => setFieldArea(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nhập diện tích trồng"
                          required
                          min="1"
                        />
                        <span className="absolute right-3 top-2 text-gray-500">m²</span>
                      </div>
                    </div>

                    {/* Mùa vụ */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mùa vụ
                      </label>
                      <select
                        value={seasonType}
                        onChange={(e) => setSeasonType(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {SEASON_TYPES.map((season) => (
                          <option key={season.value} value={season.value}>
                            {season.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Mật độ trồng */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mật độ trồng (cây/ha) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={plantingDensity}
                          onChange={(e) => setPlantingDensity(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nhập mật độ trồng"
                          required
                          min="1"
                        />
                        <span className="absolute right-3 top-2 text-gray-500">cây/ha</span>
                      </div>
                    </div>

                    {/* Giống dứa */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giống dứa
                      </label>
                      <select
                        value={variety}
                        onChange={(e) => setVariety(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {VARIETIES.map((v) => (
                          <option key={v.value} value={v.value}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Nguồn giống */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nguồn giống
                      </label>
                      <input
                        type="text"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập nguồn giống"
                      />
                    </div>
                  </div>

                  {/* Mô tả */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px]"
                      placeholder="Mô tả chi tiết về vụ trồng"
                    />
                  </div>
                </div>

                {/* Footer với các nút hành động */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Quy trình:</span>
                      <span className="ml-2">1. Nhập thông tin vụ dứa</span>
                      <span className="mx-2">→</span>
                      <span>2. Xem trước kế hoạch</span>
                      <span className="mx-2">→</span>
                      <span>3. Xác nhận và lưu vụ dứa</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/pineapple')}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 flex items-center hover:bg-gray-100"
                    >
                      <FaTimes className="mr-2" />
                      Hủy
                    </button>

                    {!isEditMode && (
                      <button
                        type="button"
                        onClick={generatePreview}
                        disabled={isGeneratingPreview}
                        className={`px-6 py-2 rounded-lg text-white flex items-center ${
                          isGeneratingPreview
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isGeneratingPreview ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Đang tạo xem trước...
                          </>
                        ) : (
                          <>
                            <FaEdit className="mr-2" />
                            Xem trước kế hoạch
                          </>
                        )}
                      </button>
                    )}

                    {isEditMode && (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-6 py-2 rounded-lg text-white flex items-center ${
                          isSubmitting
                            ? 'bg-blue-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <FaSave className="mr-2" />
                            Lưu thay đổi
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            ) : (
              <div>
                <div className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Xem trước kế hoạch hoạt động</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Dưới đây là danh sách các hoạt động được đề xuất cho vụ trồng dứa. Bạn có thể chỉnh sửa thông tin nếu cần thiết.
                  </p>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hoạt động
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vật tư
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bắt đầu
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kết thúc
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hành động
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {editedActivities.map((activity, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div>
                                <input
                                  type="text"
                                  value={activity.description}
                                  onChange={(e) =>
                                    handleEditActivity(index, { description: e.target.value })
                                  }
                                  className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1"
                                />
                                <div className="text-xs text-gray-500">
                                  Loại: {getActivityTypeLabel(activity.activity_type)}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {activity.materials && activity.materials.length > 0 ? (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">
                                    {activity.materials.length} vật tư
                                  </div>
                                  <div className="space-y-1">
                                    {activity.materials.slice(0, 2).map((material: any, matIndex: number) => (
                                      <div key={matIndex} className="text-xs bg-blue-50 px-2 py-1 rounded">
                                        <div className="font-medium">{material.name}: {material.quantity} {material.unit}</div>
                                        {material.base_quantity_per_ha && (
                                          <div className="text-gray-600">
                                            Chuẩn: {material.base_quantity_per_ha} {material.unit}/ha
                                          </div>
                                        )}
                                        {material.field_area_ha && (
                                          <div className="text-gray-600">
                                            Diện tích: {material.field_area_ha.toFixed(4)} ha
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {activity.materials.length > 2 && (
                                      <div className="text-xs text-blue-600 cursor-pointer hover:underline">
                                        +{activity.materials.length - 2} vật tư khác
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Không có vật tư</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <input
                                type="date"
                                value={activity.start_date}
                                onChange={(e) =>
                                  handleEditActivity(index, { start_date: e.target.value })
                                }
                                className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <input
                                type="date"
                                value={activity.end_date}
                                onChange={(e) =>
                                  handleEditActivity(index, { end_date: e.target.value })
                                }
                                className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    // Hiển thị modal chi tiết activity
                                    setSelectedActivity(activity);
                                    setShowActivityDetail(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 text-xs"
                                >
                                  Chi tiết
                                </button>
                                <button
                                  onClick={() => {
                                    const newActivities = [...editedActivities];
                                    newActivities.splice(index, 1);
                                    setEditedActivities(newActivities);
                                  }}
                                  className="text-red-600 hover:text-red-900 text-xs"
                                >
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowPreview(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 flex items-center hover:bg-gray-100"
                    >
                      <FaArrowLeft className="mr-2" />
                      Quay lại chỉnh sửa thông tin
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={`px-6 py-2 rounded-lg text-white flex items-center ${
                      isSubmitting
                        ? 'bg-green-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <FaCheck className="mr-2" />
                        Xác nhận và lưu kế hoạch
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Detail Modal */}
      {showActivityDetail && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Chi tiết hoạt động</h3>
              <button
                onClick={() => setShowActivityDetail(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <input
                  type="text"
                  value={selectedActivity.description}
                  onChange={(e) => {
                    const updatedActivity = { ...selectedActivity, description: e.target.value };
                    setSelectedActivity(updatedActivity);
                    // Update in the main list
                    const index = editedActivities.findIndex(act => 
                      act.activity_type === selectedActivity.activity_type && 
                      act.start_date === selectedActivity.start_date
                    );
                    if (index !== -1) {
                      const newActivities = [...editedActivities];
                      newActivities[index] = updatedActivity;
                      setEditedActivities(newActivities);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={selectedActivity.start_date}
                    onChange={(e) => {
                      const updatedActivity = { ...selectedActivity, start_date: e.target.value };
                      setSelectedActivity(updatedActivity);
                      // Update in the main list
                      const index = editedActivities.findIndex(act => 
                        act.activity_type === selectedActivity.activity_type && 
                        act.start_date === selectedActivity.start_date
                      );
                      if (index !== -1) {
                        const newActivities = [...editedActivities];
                        newActivities[index] = updatedActivity;
                        setEditedActivities(newActivities);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={selectedActivity.end_date}
                    onChange={(e) => {
                      const updatedActivity = { ...selectedActivity, end_date: e.target.value };
                      setSelectedActivity(updatedActivity);
                      // Update in the main list
                      const index = editedActivities.findIndex(act => 
                        act.activity_type === selectedActivity.activity_type && 
                        act.start_date === selectedActivity.start_date
                      );
                      if (index !== -1) {
                        const newActivities = [...editedActivities];
                        newActivities[index] = updatedActivity;
                        setEditedActivities(newActivities);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại hoạt động</label>
                <div className="px-3 py-2 bg-gray-50 rounded border">
                  {getActivityTypeLabel(selectedActivity.activity_type)}
                </div>
              </div>

              {selectedActivity.materials && selectedActivity.materials.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vật tư cần thiết ({selectedActivity.materials.length} loại)
                  </label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Tên vật tư</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Số lượng</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Đơn vị</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Từ template</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedActivity.materials.map((material: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm">{material.name}</td>
                            <td className="px-4 py-2 text-sm font-medium">
                              {material.quantity}
                              {material.base_quantity_per_ha && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <div>Chuẩn: {material.base_quantity_per_ha} {material.unit}/ha</div>
                                  {material.field_area_ha && (
                                    <div>Diện tích: {material.field_area_ha.toFixed(4)} ha</div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm">{material.unit}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {material.template_name || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedActivity.materials.some((m: any) => m.field_area_ha) && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm text-blue-800">
                          <div className="font-medium mb-1">Tính toán theo diện tích thực tế</div>
                          <div>Số lượng vật tư đã được tính toán dựa trên diện tích {Array.isArray(selectedActivity.materials) && selectedActivity.materials.length > 0 ? selectedActivity.materials[0]?.field_area_ha?.toFixed(4) : '0'} ha của cánh đồng.</div>
                          <div className="text-xs mt-1">Template định nghĩa số lượng cho 1 ha, hệ thống tự động nhân với diện tích thực tế và làm tròn lên.</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowActivityDetail(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PineappleCropFormPage;