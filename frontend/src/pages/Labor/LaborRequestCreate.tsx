import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createLaborRequest, createMixedRequest } from '@/services/labor/laborRequestService';
import { getFarmHouseholds } from '@/services/labor/farmHouseholdService';
import { getFarmActivities } from '@/services/farming/farmService';
import { FarmHousehold, LaborRequestFormData } from '@/types/labor/laborRequest.types';
import { FarmActivity } from '@/types/labor/types';

import Button from '@/components/common/Button';
import { formatDate } from '@/utils/formatters';
import LaborNavigation from '@/components/Labor/LaborNavigation';

const LaborRequestCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activityFromNav = location.state?.fromActivity;

  const [formData, setFormData] = useState<LaborRequestFormData>({
    title: '',
    description: '',
    workers_needed: 1,
    request_type: 'exchange',
    start_date: '',
    end_date: '',
  });
  
  const [households, setHouseholds] = useState<FarmHousehold[]>([]);
  const [farmActivities, setFarmActivities] = useState<FarmActivity[]>([]);
  const [selectedHouseholds, setSelectedHouseholds] = useState<number[]>([]);
  const [isMixed, setIsMixed] = useState<boolean>(false);
  const [isPublic, setIsPublic] = useState<boolean>(false);
  const [maxAcceptors, setMaxAcceptors] = useState<number>(5);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [laborSuggestions, setLaborSuggestions] = useState<{
    workers_needed: number;
    estimated_duration: string;
    labor_type: string;
    suggested_title: string;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load households
        const householdsResponse = await getFarmHouseholds();
        setHouseholds(householdsResponse.data);
        
        // Load farm activities
        const activitiesResponse = await getFarmActivities();
        setFarmActivities(activitiesResponse.farm_activities || []);
        
      } catch (err) {
        console.error('Error loading data', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // Nếu có truyền farm activity từ trang chi tiết
    if (activityFromNav) {
      setFormData(prev => ({
        ...prev,
        title: `${getActivityTypeLabel(activityFromNav.activity_type)} ${formatDate(activityFromNav.start_date)}`,
        description: activityFromNav.description || '',
        start_date: activityFromNav.start_date,
        end_date: activityFromNav.end_date,
        farm_activity_id: activityFromNav.id
      }));
      
      // Tính toán labor suggestions
      const suggestions = calculateLaborSuggestions(activityFromNav);
      setLaborSuggestions(suggestions);
    }
  }, [activityFromNav]);

  // Thêm useEffect để xử lý URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromActivityParam = urlParams.get('fromActivity');
    
    if (fromActivityParam && !activityFromNav) {
      try {
        const activityData = JSON.parse(decodeURIComponent(fromActivityParam));
        setFormData(prev => ({
          ...prev,
          title: `${getActivityTypeLabel(activityData.activity_type)} ${formatDate(activityData.start_date)}`,
          description: activityData.description || '',
          start_date: activityData.start_date,
          end_date: activityData.end_date,
          farm_activity_id: activityData.id
        }));
        
        // Tính toán labor suggestions
        const suggestions = calculateLaborSuggestions(activityData);
        setLaborSuggestions(suggestions);
      } catch (error) {
        console.error('Error parsing activity data from URL:', error);
      }
    }
  }, [activityFromNav]);

  const getActivityTypeLabel = (type: any) => {
    if (type === 1) return 'Tưới nước';
    if (type === 2) return 'Bón phân';
    if (type === 3) return 'Thu hoạch';
    if (type === 4) return 'Phun thuốc';
    if (type === 5) return 'Làm đất';
    if (type === 6) return 'Gieo trồng';
    return 'Hoạt động';
  };

  const calculateLaborSuggestions = (activity: FarmActivity) => {
    const activityTypeMap: Record<string, any> = {
      "1": { workers_needed: 1, estimated_duration: "2-3 giờ", labor_type: "Tưới nước" },
      "2": { workers_needed: 2, estimated_duration: "4-6 giờ", labor_type: "Bón phân" },
      "3": { workers_needed: 3, estimated_duration: "6-8 giờ", labor_type: "Thu hoạch" },
      "4": { workers_needed: 2, estimated_duration: "3-4 giờ", labor_type: "Phun thuốc" },
      "5": { workers_needed: 1, estimated_duration: "4-5 giờ", labor_type: "Làm đất" },
      "6": { workers_needed: 2, estimated_duration: "5-6 giờ", labor_type: "Gieo trồng" }
    };

    const activityType = activity.activity_type?.toString();
    const baseInfo = activityTypeMap[activityType || ""] || 
                    { workers_needed: 1, estimated_duration: "3-4 giờ", labor_type: "Hoạt động nông nghiệp" };

    const suggested_title = `${baseInfo.labor_type} ${formatDate(activity.start_date)}`;

    return {
      ...baseInfo,
      suggested_title
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setFormData(prev => ({ ...prev, [name]: numValue }));
    }
  };

  const handleHouseholdSelection = (id: number) => {
    setSelectedHouseholds(prev => {
      if (prev.includes(id)) {
        return prev.filter(hId => hId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      if (isMixed) {
        // Tạo yêu cầu kết hợp
        const mixedParams = {
          labor_request: formData,
          provider_ids: selectedHouseholds,
          is_public: isPublic,
          max_acceptors: isPublic ? maxAcceptors : undefined
        };
        
        const response = await createMixedRequest(mixedParams);
        navigate(`/labor/requests/${response.data.parent_request.id}`);
      } else {
        // Tạo yêu cầu thông thường
        const standardRequest = {
          ...formData,
          providing_household_id: selectedHouseholds.length === 1 ? selectedHouseholds[0] : undefined
        };
        
        const response = await createLaborRequest(standardRequest);
        navigate(`/labor/requests/${response.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo yêu cầu.');
      console.error('Error submitting labor request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <LaborNavigation />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Tạo yêu cầu đổi công mới</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          {/* Thông tin cơ bản */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Labor Suggestions */}
            {laborSuggestions && (
              <div className="col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2">💡 Gợi ý từ hoạt động nông nghiệp</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Loại công việc:</span>
                      <div className="text-blue-600">{laborSuggestions.labor_type}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Số người cần:</span>
                      <div className="text-blue-600">{laborSuggestions.workers_needed} người</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Thời gian ước tính:</span>
                      <div className="text-blue-600">{laborSuggestions.estimated_duration}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600">
                    Thông tin này được gợi ý dựa trên loại hoạt động nông nghiệp đã chọn
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="workers_needed" className="block text-sm font-medium text-gray-700 mb-1">
                Số người cần <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="workers_needed"
                name="workers_needed"
                value={formData.workers_needed}
                onChange={handleNumberInput}
                min="1"
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="request_type" className="block text-sm font-medium text-gray-700 mb-1">
                Loại yêu cầu <span className="text-red-500">*</span>
              </label>
              <select
                id="request_type"
                name="request_type"
                value={formData.request_type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="exchange">Đổi công</option>
                <option value="paid">Trả công</option>
                <option value="mixed">Kết hợp</option>
              </select>
            </div>

            {formData.request_type === 'paid' && (
              <div>
                <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">
                  Giá công (VND)
                </label>
                <input
                  type="number"
                  id="rate"
                  name="rate"
                  value={formData.rate || ''}
                  onChange={handleNumberInput}
                  min="1000"
                  step="1000"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                required
                min={formData.start_date}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                Giờ bắt đầu
              </label>
              <input
                type="time"
                id="start_time"
                name="start_time"
                value={formData.start_time || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                Giờ kết thúc
              </label>
              <input
                type="time"
                id="end_time"
                name="end_time"
                value={formData.end_time || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="farm_activity_id" className="block text-sm font-medium text-gray-700 mb-1">
                Hoạt động nông nghiệp liên quan
              </label>
              <select
                id="farm_activity_id"
                name="farm_activity_id"
                value={formData.farm_activity_id || ''}
                onChange={e => {
                  const value = e.target.value ? parseInt(e.target.value) : undefined;
                  setFormData(prev => ({ ...prev, farm_activity_id: value }));
                }}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Không liên kết hoạt động --</option>
                {farmActivities.map(activity => (
                  <option key={activity.id} value={activity.id}>
                    {activity.description} ({formatDate(activity.start_date)})
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Liên kết yêu cầu đổi công với một hoạt động nông nghiệp cụ thể
              </p>
            </div>
          </div>

          {/* Loại yêu cầu */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="is_mixed"
                checked={isMixed}
                onChange={() => setIsMixed(!isMixed)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_mixed" className="ml-2 block text-sm text-gray-900">
                Tạo yêu cầu kết hợp (gửi cho hộ cụ thể và/hoặc công khai)
              </label>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isMixed ? "Chọn các hộ sản xuất cụ thể:" : "Chọn hộ sản xuất nhận yêu cầu:"}
              </label>
              {loading ? (
                <div className="flex justify-center my-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                </div>
              ) : households.length === 0 ? (
                <div className="text-gray-500">Không có hộ sản xuất nào.</div>
              ) : (
                <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                  {households.map(household => (
                    <div key={household.id} className="flex items-center p-2 hover:bg-gray-100">
                      <input
                        type="checkbox"
                        id={`household-${household.id}`}
                        checked={selectedHouseholds.includes(household.id)}
                        onChange={() => handleHouseholdSelection(household.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`household-${household.id}`} className="ml-2 block text-sm text-gray-900">
                        {household.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {!isMixed && selectedHouseholds.length > 1 && (
                <p className="text-yellow-600 text-sm mt-1">
                  Vui lòng chỉ chọn 1 hộ sản xuất cho yêu cầu thông thường
                </p>
              )}
            </div>

            {isMixed && (
              <div>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={isPublic}
                    onChange={() => setIsPublic(!isPublic)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_public" className="ml-2 block text-sm text-gray-900">
                    Đồng thời tạo yêu cầu công khai (cho phép các hộ khác tham gia)
                  </label>
                </div>

                {isPublic && (
                  <div className="mb-4">
                    <label htmlFor="max_acceptors" className="block text-sm font-medium text-gray-700 mb-1">
                      Số lượng hộ tham gia tối đa
                    </label>
                    <input
                      type="number"
                      id="max_acceptors"
                      value={maxAcceptors}
                      onChange={e => setMaxAcceptors(parseInt(e.target.value) || 5)}
                      min="1"
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              buttonType="secondary"
              onClick={() => navigate('/labor/requests')}
            >
              Hủy
            </Button>
            <Button
              buttonType="primary"
              htmlType="submit"
              disabled={submitting || (!isMixed && selectedHouseholds.length > 1)}
              loading={submitting}
            >
              {submitting ? "Đang xử lý..." : "Tạo yêu cầu"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LaborRequestCreate;