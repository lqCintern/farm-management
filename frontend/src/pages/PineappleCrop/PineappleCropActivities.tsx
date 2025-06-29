import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaCheckCircle, FaEdit, FaTrash, FaPlus, FaCalendarAlt } from 'react-icons/fa';
import * as farmService from '@/services/farming/farmService';
import { FarmActivity } from '@/types/labor/types';

const STATUS_BADGES = {
  pending: { class: 'bg-yellow-100 text-yellow-800', text: 'Chờ thực hiện' },
  in_progress: { class: 'bg-blue-100 text-blue-800', text: 'Đang thực hiện' },
  completed: { class: 'bg-green-100 text-green-800', text: 'Đã hoàn thành' },
  cancelled: { class: 'bg-red-100 text-red-800', text: 'Đã hủy' },
};

const PineappleCropActivities: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [completingActivityId, setCompletingActivityId] = useState<number | null>(null);
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);

  useEffect(() => {
    fetchActivities();
  }, [id]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await farmService.getFarmActivities();
      setActivities(response.farm_activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError('Không thể tải danh sách hoạt động. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteActivity = async (activityId: number) => {
    try {
      setShowCompletionModal(false);
      setLoading(true);
      const result = await farmService.completeFarmActivity(activityId, {
        actual_notes: completionNotes,
        actual_materials: {} // Không có vật tư thực tế trong trường hợp này
      });

      fetchActivities();
      
      // Hiển thị thông báo thành công
      let successMessage = "Đã đánh dấu hoàn thành hoạt động";
      
      // Thêm thông báo về việc tự động chuyển giai đoạn nếu có
      if (result.stage_advance_message) {
        successMessage += `\n\n${result.stage_advance_message}`;
      }
      
      // Thêm gợi ý nếu có
      if (result.suggestion) {
        successMessage += `\n\nGợi ý: ${result.suggestion}`;
      }
      
      alert(successMessage);
    } catch (error) {
      console.error('Error completing activity:', error);
      alert("Không thể hoàn thành hoạt động. Vui lòng thử lại.");
    } finally {
      // Reset states
      setCompletingActivityId(null);
      setCompletionNotes('');
      setLoading(false);
    }
  };

  const openCompletionModal = (activityId: number) => {
    setCompletingActivityId(activityId);
    setShowCompletionModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách hoạt động...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-green-50 py-10 font-[Quicksand,Inter,Roboto,sans-serif] animate-fadeIn">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8 flex items-center gap-4">
            <h1 className="text-3xl font-extrabold text-green-700 drop-shadow-sm tracking-wide">Danh sách hoạt động vụ dứa</h1>
            <button
              className="rounded-full bg-gradient-to-r from-green-500 to-lime-400 text-white shadow-md px-6 py-2 font-semibold text-base hover:scale-105 transition-all flex items-center gap-2"
              onClick={() => {/* Mở form thêm hoạt động */}}
            >
              <FaPlus /> Thêm hoạt động mới
            </button>
          </div>
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl shadow animate-fadeIn">
              {error}
            </div>
          )}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeIn">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-lg">
                Chưa có hoạt động nào cho vụ dứa này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-base font-bold text-green-700 uppercase tracking-wider">Hoạt động</th>
                      <th className="px-6 py-4 text-left text-base font-bold text-green-700 uppercase tracking-wider">Thời gian</th>
                      <th className="px-6 py-4 text-left text-base font-bold text-green-700 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-6 py-4 text-left text-base font-bold text-green-700 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {activities.map((activity) => (
                      <tr key={activity.id} className="hover:bg-green-50 transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold text-gray-900">{activity.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-700 flex items-center gap-2">
                          <FaCalendarAlt className="text-green-400" />
                          <span>{new Date(activity.start_date).toLocaleDateString('vi-VN')} - {new Date(activity.end_date).toLocaleDateString('vi-VN')}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-4 py-2 inline-flex text-base leading-5 font-bold rounded-full ${STATUS_BADGES[activity.status as keyof typeof STATUS_BADGES]?.class}`}>
                            {STATUS_BADGES[activity.status as keyof typeof STATUS_BADGES]?.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base font-medium">
                          <div className="flex gap-3">
                            {activity.status !== 'completed' && (
                              <button
                                onClick={() => openCompletionModal(activity.id as number)}
                                className="rounded-full bg-gradient-to-r from-green-500 to-lime-400 text-white shadow px-4 py-2 font-semibold hover:scale-105 transition-all flex items-center gap-2"
                              >
                                <FaCheckCircle /> Hoàn thành
                              </button>
                            )}
                            <button
                              onClick={() => {/* Mở form sửa */}}
                              className="rounded-full bg-gradient-to-r from-blue-400 to-cyan-300 text-white shadow px-4 py-2 font-semibold hover:scale-105 transition-all flex items-center gap-2"
                            >
                              <FaEdit /> Sửa
                            </button>
                            <button
                              onClick={() => {/* Xác nhận xóa */}}
                              className="rounded-full bg-gradient-to-r from-red-400 to-orange-300 text-white shadow px-4 py-2 font-semibold hover:scale-105 transition-all flex items-center gap-2"
                            >
                              <FaTrash /> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal hoàn thành hoạt động */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Hoàn thành hoạt động</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú hoàn thành
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                placeholder="Nhập ghi chú về việc hoàn thành hoạt động"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCompletionModal(false);
                  setCompletionNotes('');
                  setCompletingActivityId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700"
              >
                Hủy
              </button>
              <button
                onClick={() => handleCompleteActivity(completingActivityId as number)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Xác nhận hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PineappleCropActivities;