import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { FarmActivity } from '@/types/labor/types';

interface ActivityDetailModalProps {
  activity: FarmActivity;
  onClose: () => void;
  onUpdate: (updatedActivity: Partial<FarmActivity>) => void;
  getActivityTypeLabel: (activityType: number | string) => string;
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  onClose,
  onUpdate,
  getActivityTypeLabel
}) => {
  const [editedActivity, setEditedActivity] = useState<FarmActivity>(activity);

  const handleSave = () => {
    onUpdate(editedActivity);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-green-700">Chi tiết hoạt động</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Mô tả */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            <input
              type="text"
              value={editedActivity.description}
              onChange={(e) => setEditedActivity({ ...editedActivity, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-base"
            />
          </div>

          {/* Ngày bắt đầu và kết thúc */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
              <input
                type="date"
                value={editedActivity.start_date}
                onChange={(e) => setEditedActivity({ ...editedActivity, start_date: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc</label>
              <input
                type="date"
                value={editedActivity.end_date}
                onChange={(e) => setEditedActivity({ ...editedActivity, end_date: e.target.value })}
                className="w-full px-4 py-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 text-base"
              />
            </div>
          </div>

          {/* Loại hoạt động */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Loại hoạt động</label>
            <div className="px-4 py-3 bg-green-50 rounded-xl border-2 border-green-200">
              {getActivityTypeLabel(editedActivity.activity_type)}
            </div>
          </div>

          {/* Vật tư */}
          {editedActivity.materials && editedActivity.materials.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Vật tư cần thiết ({editedActivity.materials.length} loại)
              </label>
              <div className="border-2 border-green-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-green-100">
                  <thead className="bg-green-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                        Tên vật tư
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-green-700 uppercase tracking-wider">
                        Đơn vị
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-green-100">
                    {editedActivity.materials.map((material: any, index: number) => (
                      <tr key={index} className="hover:bg-green-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {material.name}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium">{material.quantity}</div>
                          {(material as any).base_quantity_per_ha != null && (
                            <div className="text-xs text-gray-500 mt-1">
                              <div>Chuẩn: {(material as any).base_quantity_per_ha} {material.unit}/ha</div>
                              {(material as any).field_area_ha != null && (
                                <div>Diện tích: {Number((material as any).field_area_ha).toFixed(4)} ha</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{material.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Thông tin tính toán */}
              {editedActivity.materials.some((m: any) => (m as any).field_area_ha) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-800">
                      <div className="font-medium mb-1">Tính toán theo diện tích thực tế</div>
                      <div>
                        Số lượng vật tư đã được tính toán dựa trên diện tích{' '}
                        {Array.isArray(editedActivity.materials) && editedActivity.materials.length > 0 
                          ? (editedActivity.materials[0] as any)?.field_area_ha?.toFixed(4) || '0' 
                          : '0'} ha của cánh đồng.
                      </div>
                      <div className="text-xs mt-1">
                        Template định nghĩa số lượng cho 1 ha, hệ thống tự động nhân với diện tích thực tế và làm tròn lên.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Nút hành động */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 bg-white rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-all"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-lime-400 text-white rounded-xl font-semibold hover:scale-105 transition-all"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailModal; 