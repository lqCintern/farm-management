import React from "react";
import { Filter, ChevronDown, SortAsc, SortDesc, Calendar, MapPin, Ruler } from "lucide-react";

interface FilterControlsProps {
  filterOpen: boolean;
  sortBy: string;
  onFilterToggle: () => void;
  onSortChange: (value: string) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filterOpen,
  sortBy,
  onFilterToggle,
  onSortChange,
}) => {
  const getSortIcon = () => {
    switch (sortBy) {
      case "name":
        return <SortAsc className="w-4 h-4" />;
      case "area":
        return <Ruler className="w-4 h-4" />;
      case "date":
        return <Calendar className="w-4 h-4" />;
      default:
        return <SortAsc className="w-4 h-4" />;
    }
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case "name":
        return "Tên";
      case "area":
        return "Diện tích";
      case "date":
        return "Ngày tạo";
      default:
        return "Sắp xếp";
    }
  };

  return (
    <div className="relative">
      <button
        className="bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm"
        onClick={onFilterToggle}
      >
        <Filter className="w-4 h-4" />
        <span className="font-medium">{getSortLabel()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${filterOpen ? 'rotate-180' : ''}`} />
      </button>

      {filterOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={onFilterToggle}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl z-20 border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Sắp xếp theo</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => onSortChange("name")}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                    sortBy === "name" 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <SortAsc className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-medium">Tên cánh đồng</div>
                    <div className="text-sm text-gray-500">A → Z</div>
                  </div>
                  {sortBy === "name" && (
                    <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>

                <button
                  onClick={() => onSortChange("area")}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                    sortBy === "area" 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <Ruler className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-medium">Diện tích</div>
                    <div className="text-sm text-gray-500">Lớn → Nhỏ</div>
                  </div>
                  {sortBy === "area" && (
                    <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>

                <button
                  onClick={() => onSortChange("date")}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                    sortBy === "date" 
                      ? "bg-green-50 text-green-700 border border-green-200" 
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-medium">Ngày tạo</div>
                    <div className="text-sm text-gray-500">Mới nhất</div>
                  </div>
                  {sortBy === "date" && (
                    <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Hiển thị {sortBy === "name" ? "theo tên" : sortBy === "area" ? "theo diện tích" : "theo ngày tạo"}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FilterControls; 