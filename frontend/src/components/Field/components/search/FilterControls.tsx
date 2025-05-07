import React from "react";
import { FaFilter } from "react-icons/fa";

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
  return (
    <div className="relative">
      <button
        className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg flex items-center border border-blue-200 hover:bg-blue-100"
        onClick={onFilterToggle}
      >
        <FaFilter className="mr-2" /> Lọc & Sắp xếp
      </button>

      {filterOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-10 p-4">
          <h3 className="font-medium mb-2 text-gray-700">Sắp xếp theo</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="sortBy"
                value="name"
                checked={sortBy === "name"}
                onChange={() => onSortChange("name")}
                className="mr-2"
              />
              Tên
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="sortBy"
                value="area"
                checked={sortBy === "area"}
                onChange={() => onSortChange("area")}
                className="mr-2"
              />
              Diện tích (giảm dần)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="sortBy"
                value="date"
                checked={sortBy === "date"}
                onChange={() => onSortChange("date")}
                className="mr-2"
              />
              Ngày tạo (mới nhất)
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterControls;
