import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes, FaArrowLeft, FaCalendarAlt, FaEdit, FaCheck, FaTrash, FaEye } from 'react-icons/fa';
import * as pineappleCropService from '@/services/farming/pineappleCropService';
import fieldService from '@/services/farming/fieldService';
import { PineappleCrop, FarmActivity } from '@/types/labor/types';
import CropFormFields from './components/CropFormFields';
import PreviewPlanTab from './components/PreviewPlanTab';

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
  const [editedActivities, setEditedActivities] = useState<FarmActivity[]>([]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Tab management
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  // Fetch field list on component mount
  useEffect(() => {
    const fetchFields = async () => {
      try {
        const response = await fieldService.getFields();
        console.log('Fields response:', response);
        
        if (response && response.data) {
          setFields(
            response.data.map((field: any) => ({
              id: field.id as number,
              name: field.name as string,
              area: typeof field.area === 'string' ? parseFloat(field.area) : field.area as number
            }))
          );
          console.log('Processed fields:', fields);
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
      setActiveTab('preview');
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
      console.error('Error submitting form:', error);
      setError('Không thể lưu vụ trồng dứa. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityTypeLabel = (activityType: number | string) => {
    const typeLabels: { [key: string]: string } = {
      'preparation': 'Chuẩn bị đất',
      'seedling_preparation': 'Chuẩn bị giống',
      'planting': 'Trồng dứa',
      'leaf_tying': 'Buộc lá',
      'first_fertilizing': 'Bón phân lần 1',
      'second_fertilizing': 'Bón phân lần 2',
      'flower_treatment': 'Xử lý ra hoa',
      'sun_protection': 'Che nắng',
      'fruit_development': 'Thúc quả',
      'harvesting': 'Thu hoạch',
      'sprout_collection': 'Tách chồi',
      'field_cleaning': 'Dọn vườn'
    };
    return typeLabels[activityType.toString()] || `Hoạt động ${activityType}`;
  };

  const formData = {
    name,
    setName,
    fieldId,
    setFieldId,
    plantingDate,
    setPlantingDate,
    fieldArea,
    setFieldArea,
    seasonType,
    setSeasonType,
    plantingDensity,
    setPlantingDensity,
    currentStage,
    setCurrentStage,
    status,
    setStatus,
    description,
    setDescription,
    variety,
    setVariety,
    source,
    setSource,
    fields,
    handleSelectField,
    SEASON_TYPES,
    VARIETIES
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => navigate('/pineapple')}
                className="rounded-full bg-white shadow-md p-3 hover:scale-105 transition-all hover-lift"
              >
                <FaArrowLeft className="text-green-600 text-xl" />
              </button>
              <h1 className="text-3xl font-bold text-green-700 gradient-text">
                {isEditMode ? 'Chỉnh sửa vụ trồng dứa' : 'Tạo vụ trồng dứa mới'}
              </h1>
            </div>
            <p className="text-gray-600 text-lg ml-16">
              {isEditMode ? 'Cập nhật thông tin vụ trồng dứa' : 'Thiết lập kế hoạch trồng dứa mới'}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 animate-fadeIn">
              <div className="flex items-center gap-2">
                <FaTimes className="text-red-500" />
                {error}
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="flex space-x-1 bg-white rounded-2xl p-2 shadow-lg">
              <button
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all ${
                  activeTab === 'form'
                    ? 'bg-gradient-to-r from-green-500 to-lime-400 text-white shadow-md'
                    : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                }`}
              >
                <FaEdit className="inline mr-2" />
                Thông tin cơ bản
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                disabled={!isEditMode && editedActivities.length === 0}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all ${
                  activeTab === 'preview'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md'
                    : editedActivities.length === 0
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <FaEye className="inline mr-2" />
                Xem trước kế hoạch
                {editedActivities.length > 0 && (
                  <span className="ml-2 bg-white text-blue-600 rounded-full px-2 py-1 text-sm font-bold">
                    {editedActivities.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'form' && (
            <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fadeIn">
              <form onSubmit={handleSubmit} className="space-y-8">
                <CropFormFields {...formData} />
                
                {/* Nút xem trước kế hoạch */}
                {!isEditMode && (
                  <div className="flex justify-end mt-8">
                    <button
                      type="button"
                      onClick={generatePreview}
                      disabled={isGeneratingPreview}
                      className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md px-8 py-3 font-bold text-lg hover:scale-105 transition-all pulse-button disabled:opacity-60"
                    >
                      {isGeneratingPreview ? (
                        <span className="flex items-center"><span className="spinner mr-2"></span> Đang tạo xem trước...</span>
                      ) : (
                        <><FaEye className="inline mr-2" /> Xem trước kế hoạch</>
                      )}
                    </button>
                  </div>
                )}

                {/* Nút hủy (chỉ hiển thị khi ở chế độ edit) */}
                {isEditMode && (
                  <div className="flex gap-4 justify-end mt-10">
                    <button
                      type="button"
                      onClick={() => navigate('/pineapple')}
                      className="rounded-full bg-gradient-to-r from-gray-200 to-gray-100 text-gray-700 shadow-md px-7 py-3 font-semibold text-lg hover:scale-105 transition-all hover-lift"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-full bg-gradient-to-r from-green-500 to-lime-400 text-white shadow-md px-10 py-3 font-bold text-xl hover:scale-105 transition-all pulse-button disabled:opacity-60"
                    >
                      <FaSave className="inline mr-2" /> Lưu thay đổi
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'preview' && (
            <PreviewPlanTab
              activities={editedActivities}
              onEditActivity={handleEditActivity}
              onSubmit={handleSubmit}
              onBack={() => setActiveTab('form')}
              isSubmitting={isSubmitting}
              getActivityTypeLabel={getActivityTypeLabel}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PineappleCropFormPage;