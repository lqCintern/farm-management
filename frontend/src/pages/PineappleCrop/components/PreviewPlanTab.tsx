import React, { useState } from 'react';
import { FaSave, FaArrowLeft, FaEdit, FaTrash } from 'react-icons/fa';
import { FarmActivity } from '@/types/labor/types';
import ActivityDetailModal from './ActivityDetailModal';

interface PreviewPlanTabProps {
  activities: FarmActivity[];
  onEditActivity: (index: number, updatedActivity: Partial<FarmActivity>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  isSubmitting: boolean;
  getActivityTypeLabel: (activityType: number | string) => string;
}

const PreviewPlanTab: React.FC<PreviewPlanTabProps> = ({
  activities,
  onEditActivity,
  onSubmit,
  onBack,
  isSubmitting,
  getActivityTypeLabel
}) => {
  const [selectedActivity, setSelectedActivity] = useState<FarmActivity | null>(null);
  const [showActivityDetail, setShowActivityDetail] = useState<boolean>(false);

  const handleDeleteActivity = (index: number) => {
    const newActivities = [...activities];
    newActivities.splice(index, 1);
    // Note: This would need to be handled by parent component
    // For now, we'll just call onEditActivity with the updated array
    // This is a simplified approach - in a real app you'd want to lift this state up
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-green-700 gradient-text mb-2">
          Xem trước kế hoạch hoạt động
        </h2>
        <p className="text-base text-gray-600">
          Dưới đây là danh sách các hoạt động được đề xuất cho vụ trồng dứa. 
          Bạn có thể chỉnh sửa thông tin nếu cần thiết.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">Chưa có hoạt động nào</h3>
          <p className="text-gray-500">Vui lòng quay lại tab "Thông tin cơ bản" và nhấn "Xem trước kế hoạch"</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full divide-y divide-green-100">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-6 py-3 text-left text-base font-bold text-green-700 uppercase tracking-wider">
                    Hoạt động
                  </th>
                  <th className="px-6 py-3 text-left text-base font-bold text-green-700 uppercase tracking-wider">
                    Vật tư
                  </th>
                  <th className="px-6 py-3 text-left text-base font-bold text-green-700 uppercase tracking-wider">
                    Bắt đầu
                  </th>
                  <th className="px-6 py-3 text-left text-base font-bold text-green-700 uppercase tracking-wider">
                    Kết thúc
                  </th>
                  <th className="px-6 py-3 text-left text-base font-bold text-green-700 uppercase tracking-wider">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-green-50">
                {activities.map((activity, index) => (
                  <tr key={index} className="hover:bg-green-50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold text-gray-900">
                      <input
                        type="text"
                        value={activity.description}
                        onChange={(e) => onEditActivity(index, { description: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-base"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Loại: {getActivityTypeLabel(activity.activity_type)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-base">
                      {activity.materials && activity.materials.length > 0 ? (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">
                            {activity.materials.length} vật tư
                          </div>
                          <div className="space-y-1">
                            {activity.materials.slice(0, 2).map((material, matIndex) => (
                              <div key={matIndex} className="text-xs bg-blue-50 px-2 py-1 rounded">
                                <div className="font-medium">
                                  {material.name}: {material.quantity} {material.unit}
                                </div>
                                {(material as any).base_quantity_per_ha != null && (
                                  <div className="text-gray-600">
                                    Chuẩn: {(material as any).base_quantity_per_ha} {material.unit}/ha
                                  </div>
                                )}
                                {(material as any).field_area_ha != null && (
                                  <div className="text-gray-600">
                                    Diện tích: {Number((material as any).field_area_ha).toFixed(4)} ha
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
                    <td className="px-6 py-4 whitespace-nowrap text-base">
                      <input
                        type="date"
                        value={activity.start_date}
                        onChange={(e) => onEditActivity(index, { start_date: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-base"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-base">
                      <input
                        type="date"
                        value={activity.end_date}
                        onChange={(e) => onEditActivity(index, { end_date: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-base"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedActivity(activity);
                            setShowActivityDetail(true);
                          }}
                          className="rounded-full bg-gradient-to-r from-blue-400 to-cyan-300 text-white shadow px-4 py-2 font-semibold hover:scale-105 transition-all flex items-center gap-2"
                        >
                          <FaEdit /> Chi tiết
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteActivity(index)}
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

          <div className="flex justify-between">
            <button
              type="button"
              onClick={onBack}
              className="rounded-full bg-gradient-to-r from-gray-200 to-gray-100 text-gray-700 shadow-md px-7 py-3 font-semibold text-lg hover:scale-105 transition-all hover-lift"
            >
              <FaArrowLeft className="inline mr-2" /> Quay lại chỉnh sửa thông tin
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="rounded-full bg-gradient-to-r from-green-500 to-lime-400 text-white shadow-md px-10 py-3 font-bold text-xl hover:scale-105 transition-all pulse-button disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="spinner mr-2"></span> Đang lưu...
                </span>
              ) : (
                <>
                  <FaSave className="inline mr-2" /> Xác nhận và lưu kế hoạch
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Activity Detail Modal */}
      {showActivityDetail && selectedActivity && (
        <ActivityDetailModal
          activity={selectedActivity}
          onClose={() => setShowActivityDetail(false)}
          onUpdate={(updatedActivity) => {
            const index = activities.findIndex(act => 
              act.activity_type === selectedActivity.activity_type && 
              act.start_date === selectedActivity.start_date
            );
            if (index !== -1) {
              onEditActivity(index, updatedActivity);
            }
            setShowActivityDetail(false);
          }}
          getActivityTypeLabel={getActivityTypeLabel}
        />
      )}
    </div>
  );
};

export default PreviewPlanTab; 