import React from "react";
import { Link } from "react-router-dom";
import { 
	MapPin, 
	Ruler, 
	Calendar, 
	Activity, 
	Crop, 
	Wheat,
	Edit3,
	Trash2,
	Eye,
	ArrowRight
} from "lucide-react";
import { Field } from "@/components/Field/types";

interface FieldListItemProps {
  field: Field;
  isSelected: boolean;
  onClick: () => void;
}

const FieldListItem: React.FC<FieldListItemProps> = ({
  field,
  isSelected,
  onClick,
}) => {
  const formatArea = (area: number | string | undefined) => {
    if (!area) return "0 m²";
    
    const numArea = typeof area === 'string' ? parseFloat(area) : area;
    if (isNaN(numArea)) return "0 m²";
    
    if (numArea >= 10000) {
      return `${(numArea / 10000).toFixed(2)} ha`;
    }
    return `${numArea.toFixed(2)} m²`;
  };

  const getStatusColor = () => {
    // Logic để xác định màu dựa trên trạng thái
    return "bg-gradient-to-r from-green-400 to-emerald-500";
  };

  return (
    <div
      className={`group relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:shadow-xl hover:scale-[1.02] ${
        isSelected 
          ? "border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 shadow-xl scale-[1.02] ring-2 ring-green-200" 
          : "border-gray-200 hover:border-green-300 bg-white hover:bg-gradient-to-br hover:from-white hover:to-green-50"
      }`}
      onClick={onClick}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      )}

      {/* Field color indicator */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded-full shadow-sm transition-transform duration-200 group-hover:scale-110"
            style={{ backgroundColor: field.color }}
          />
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-200">
              {field.name}
            </h3>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>{field.location || "Chưa có vị trí"}</span>
            </div>
          </div>
        </div>
        
        {/* Status badge */}
        <div className={`px-2 py-1 rounded-full text-xs font-medium text-white transition-all duration-200 ${getStatusColor()}`}>
          {field.currentCrop ? "Đang trồng" : "Trống"}
        </div>
      </div>

      {/* Field details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm group/item">
          <div className="flex items-center gap-2 text-gray-600 group-hover/item:text-green-600 transition-colors duration-200">
            <Ruler className="w-4 h-4" />
            <span>Diện tích</span>
          </div>
          <span className="font-medium text-gray-900 group-hover/item:text-green-700 transition-colors duration-200">
            {formatArea(field.area)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm group/item">
          <div className="flex items-center gap-2 text-gray-600 group-hover/item:text-orange-600 transition-colors duration-200">
            <Crop className="w-4 h-4" />
            <span>Cây trồng</span>
          </div>
          <span className="font-medium text-gray-900 group-hover/item:text-orange-700 transition-colors duration-200">
            {field.currentCrop ? "1" : "0"}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm group/item">
          <div className="flex items-center gap-2 text-gray-600 group-hover/item:text-blue-600 transition-colors duration-200">
            <Activity className="w-4 h-4" />
            <span>Hoạt động</span>
          </div>
          <span className="font-medium text-gray-900 group-hover/item:text-blue-700 transition-colors duration-200">
            0
          </span>
        </div>

        <div className="flex items-center justify-between text-sm group/item">
          <div className="flex items-center gap-2 text-gray-600 group-hover/item:text-purple-600 transition-colors duration-200">
            <Wheat className="w-4 h-4" />
            <span>Thu hoạch</span>
          </div>
          <span className="font-medium text-gray-900 group-hover/item:text-purple-700 transition-colors duration-200">
            0
          </span>
        </div>
      </div>

      {/* Description */}
      {field.description && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg group-hover:bg-green-50 transition-colors duration-200 border border-gray-100 group-hover:border-green-200">
          <p className="text-sm text-gray-600 line-clamp-2 group-hover:text-gray-700 transition-colors duration-200">
            {field.description}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex gap-1">
          <button
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 hover:scale-110"
            title="Xem chi tiết"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Open detail modal
            }}
          >
            <Eye className="w-4 h-4" />
          </button>
          <Link
            to={`/fields/${field.id}/edit`}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
            title="Chỉnh sửa"
            onClick={(e) => e.stopPropagation()}
          >
            <Edit3 className="w-4 h-4" />
          </Link>
          <button
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110"
            title="Xóa"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: Show delete confirmation
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-1 text-sm text-gray-400 group-hover:text-green-600 transition-colors">
          <span>Chi tiết</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" />
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};

export default FieldListItem;
