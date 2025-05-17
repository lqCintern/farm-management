import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes, FaArrowLeft, FaCalendarAlt, FaEdit, FaCheck } from 'react-icons/fa';
import * as pineappleCropService from '@/services/farming/pineappleCropService';
import fieldService from '@/services/farming/fieldService';
import { PineappleCrop, FarmActivity } from '@/types';

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

  // Fetch field list on component mount
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fieldService.getFields();
        if (response && response.data) {
          setFields(response.data.map((field: Field) => ({
            id: field.id,
            name: field.name,
            area: field.area
          })));
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

        setName(crop.name);
        setFieldId(crop.field_id);
        setPlantingDate(crop.planting_date);
        setFieldArea(crop.field_area);
        setSeasonType(crop.season_type);
        setPlantingDensity(crop.planting_density);
        setCurrentStage(crop.current_stage);
        setStatus(crop.status);
        setDescription(crop.description || '');
        setVariety(crop.variety);
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
      setPreviewActivities(response.preview_activities);
      setEditedActivities(response.preview_activities);
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
        const response = await pineappleCropService.createPineappleCrop(cropData) as { data: { id: number } };
        const newCropId = response.data.id;
        
        if (editedActivities.length > 0) {
          await pineappleCropService.confirmPlan(newCropId, editedActivities);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header with back button */}
          <div className="mb-6 flex items-center">
            <button
              onClick={() => navigate('/pineapple_crops')}
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
                      onClick={() => navigate('/pineapple_crops')}
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
                              <input
                                type="text"
                                value={activity.description}
                                onChange={(e) =>
                                  handleEditActivity(index, { description: e.target.value })
                                }
                                className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
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
                              <button
                                onClick={() => {
                                  const newActivities = [...editedActivities];
                                  newActivities.splice(index, 1);
                                  setEditedActivities(newActivities);
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                Xóa
                              </button>
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
    </div>
  );
};

export default PineappleCropFormPage;