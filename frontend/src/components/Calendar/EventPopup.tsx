import React from "react";
import { FarmActivity } from "@/types/labor/types";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { X, Calendar, Clock, Package, FileText, CheckCircle, AlertCircle, XCircle, PlayCircle } from "lucide-react";

interface EventPopupProps {
  event: FarmActivity | null;
  isOpen: boolean;
  onClose: () => void;
}

const EventPopup: React.FC<EventPopupProps> = ({ event, isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen || !event) return null;

  const getActivityTypeLabel = (type: string | number) => {
    const typeMap: Record<string, string> = {
      watering: "Tưới nước",
      fertilizing: "Bón phân",
      harvesting: "Thu hoạch",
      pesticide: "Phun thuốc",
      soil_preparation: "Làm đất",
      planting: "Gieo trồng",
      other: "Khác"
    };
    return typeMap[String(type)] || String(type);
  };

  const getStatusLabel = (status: string | number) => {
    const statusMap: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
      pending: { 
        label: "Chờ thực hiện", 
        color: "#FFC107", 
        bgColor: "#FFF8E1",
        icon: <AlertCircle className="w-4 h-4" />
      },
      in_progress: { 
        label: "Đang thực hiện", 
        color: "#2196F3", 
        bgColor: "#E3F2FD",
        icon: <PlayCircle className="w-4 h-4" />
      },
      completed: { 
        label: "Đã hoàn thành", 
        color: "#4CAF50", 
        bgColor: "#E8F5E8",
        icon: <CheckCircle className="w-4 h-4" />
      },
      cancelled: { 
        label: "Đã hủy", 
        color: "#F44336", 
        bgColor: "#FFEBEE",
        icon: <XCircle className="w-4 h-4" />
      }
    };
    return statusMap[String(status)] || { 
      label: String(status), 
      color: "#9E9E9E", 
      bgColor: "#F5F5F5",
      icon: <AlertCircle className="w-4 h-4" />
    };
  };

  const statusInfo = getStatusLabel(event.status || 'pending');

  const handleViewDetails = () => {
    navigate(`/farm-activities/${event.id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto animate-slideIn">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 relative">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">
                  {event.description}
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Package className="w-4 h-4" />
                  {getActivityTypeLabel(event.activity_type)}
                </span>
                <span 
                  className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: statusInfo.bgColor, color: statusInfo.color }}
                >
                  {statusInfo.icon}
                  {statusInfo.label}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Thông tin cơ bản
              </h4>
              
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" />
                    Thời gian:
                  </label>
                  <p className="text-gray-800 font-medium">
                    {format(new Date(event.start_date), "dd/MM/yyyy", { locale: vi })} - {format(new Date(event.end_date), "dd/MM/yyyy", { locale: vi })}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="text-sm font-medium text-gray-600 mb-1">Tần suất:</label>
                  <p className="text-gray-800 font-medium capitalize">
                    {event.frequency === "once" ? "Một lần" : event.frequency}
                  </p>
                </div>

                {event.created_at && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="text-sm font-medium text-gray-600 mb-1">Ngày tạo:</label>
                    <p className="text-gray-800 font-medium">
                      {format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  </div>
                )}

                {event.actual_completion_date && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <label className="text-sm font-medium text-green-700 mb-1">Ngày hoàn thành:</label>
                    <p className="text-green-800 font-medium">
                      {format(new Date(event.actual_completion_date), "dd/MM/yyyy", { locale: vi })}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin vật tư */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-3 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Vật tư
              </h4>
              
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <label className="text-sm font-medium text-gray-600 mb-1">Cần vật tư:</label>
                  <p className="text-gray-800 font-medium">
                    {event.requires_materials ? "Có" : "Không"}
                  </p>
                </div>

                {event.materials && event.materials.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2">Vật tư dự kiến:</label>
                    <div className="space-y-2">
                      {event.materials.map((material: any, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <span className="text-sm text-gray-700 font-medium">{material.name}</span>
                          <span className="text-sm font-bold text-blue-700">
                            {material.quantity} {material.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {event.actual_materials && event.actual_materials.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2">Vật tư thực tế:</label>
                    <div className="space-y-2">
                      {event.actual_materials.map((material: any, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                          <span className="text-sm text-gray-700 font-medium">{material.name}</span>
                          <span className="text-sm font-bold text-green-700">
                            {material.quantity} {material.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ghi chú thực tế */}
          {event.actual_notes && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Ghi chú thực tế:</h4>
              <p className="text-blue-700">{event.actual_notes}</p>
            </div>
          )}

          {/* Status details */}
          {event.status_details && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Trạng thái chi tiết:</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${event.status_details.starting_soon ? 'bg-yellow-400' : 'bg-gray-300'}`}></span>
                  <span className={event.status_details.starting_soon ? 'text-yellow-700' : 'text-gray-500'}>
                    Sắp bắt đầu
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${event.status_details.ending_soon ? 'bg-orange-400' : 'bg-gray-300'}`}></span>
                  <span className={event.status_details.ending_soon ? 'text-orange-700' : 'text-gray-500'}>
                    Sắp kết thúc
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${event.status_details.overdue ? 'bg-red-400' : 'bg-gray-300'}`}></span>
                  <span className={event.status_details.overdue ? 'text-red-700' : 'text-gray-500'}>
                    Quá hạn
                  </span>
                </div>
                {event.status_details.overdue && (
                  <div className="text-sm text-red-600">
                    Quá hạn {event.status_details.overdue_days} ngày
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleViewDetails}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Xem chi tiết hoạt động
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPopup;
