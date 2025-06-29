import React from "react";
import { MapPin, Layers, Filter, Search } from "lucide-react";
import FieldListItem from "./FieldListItem";
import EmptyFieldList from "./EmptyFieldList";
import { Field } from "@/components/Field/types";

interface FieldListContainerProps {
  fields: Field[];
  selectedField: Field | null;
  onFieldSelect: (field: Field) => void;
}

const FieldListContainer: React.FC<FieldListContainerProps> = ({
  fields,
  selectedField,
  onFieldSelect,
}) => {
  const getStatusSummary = () => {
    const activeFields = fields.filter(f => f.currentCrop).length;
    const totalArea = fields.reduce((sum, f) => {
      const area = typeof f.area === 'string' ? parseFloat(f.area) : f.area || 0;
      return sum + area;
    }, 0);
    
    return {
      active: activeFields,
      total: fields.length,
      area: totalArea
    };
  };

  const formatArea = (area: number) => {
    if (area >= 10000) {
      return `${(area / 10000).toFixed(2)} ha`;
    }
    return `${area.toFixed(2)} m²`;
  };

  const summary = getStatusSummary();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 border-b border-green-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-green-600" />
            Danh sách cánh đồng
          </h2>
          <div className="flex items-center gap-2">
            <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {fields.length} cánh đồng
            </div>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-white rounded-lg border border-green-200">
            <div className="text-lg font-bold text-green-600">{summary.total}</div>
            <div className="text-xs text-gray-600">Tổng số</div>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-green-200">
            <div className="text-lg font-bold text-orange-600">{summary.active}</div>
            <div className="text-xs text-gray-600">Đang trồng</div>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-green-200">
            <div className="text-lg font-bold text-blue-600">{formatArea(summary.area)}</div>
            <div className="text-xs text-gray-600">Tổng diện tích</div>
          </div>
        </div>
      </div>

      {/* Fields List */}
      <div className="overflow-y-auto max-h-[500px] p-4">
        {fields.length > 0 ? (
          <div className="space-y-3">
            {fields.map((field) => (
              <FieldListItem
                key={field.id}
                field={field}
                isSelected={!!(selectedField && selectedField.id === field.id)}
                onClick={() => onFieldSelect(field)}
              />
            ))}
          </div>
        ) : (
          <EmptyFieldList />
        )}
      </div>

      {/* Footer */}
      {fields.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Click để chọn cánh đồng</span>
            </div>
            <div className="flex items-center gap-1">
              <Search className="w-4 h-4" />
              <span>{fields.length} kết quả</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldListContainer; 