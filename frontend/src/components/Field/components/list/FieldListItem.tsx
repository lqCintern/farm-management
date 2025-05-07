import React from "react";
import { Link } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
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
  return (
    <div
      className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{field.name}</h3>
          <p className="text-gray-600 text-sm">{field.location}</p>
          <div className="mt-2 flex items-center">
            <span
              className="block w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: field.color }}
            />
            <span className="text-sm text-gray-700">
              {field.area.toLocaleString()} m²
            </span>
          </div>
        </div>
        <div className="flex space-x-1">
          <Link
            to={`/fields/${field.id}/edit`}
            className="p-1.5 text-gray-500 hover:text-amber-500 hover:bg-amber-50 rounded"
            title="Chỉnh sửa"
          >
            <FaEdit size={16} />
          </Link>
          <button
            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded"
            title="Xóa"
          >
            <FaTrash size={16} />
          </button>
        </div>
      </div>
      {field.description && (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {field.description}
        </p>
      )}
    </div>
  );
};

export default FieldListItem;
