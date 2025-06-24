import React from 'react';
import { Edit2, Trash2, Plus, Minus } from 'react-feather';
import { FarmMaterialInventory } from '@/services/farming/farmInventoryService';

interface MaterialInventoryCardProps {
  material: FarmMaterialInventory;
  onEdit: () => void;
  onAdjust: () => void;
  onDelete: () => void;
}

const MaterialInventoryCard: React.FC<MaterialInventoryCardProps> = ({ 
  material, 
  onEdit, 
  onAdjust, 
  onDelete 
}) => {
  // Determine status color based on quantity
  const getStatusColor = () => {
    if (material.quantity <= 0) return 'bg-red-100 text-red-800 border-red-200';
    if (material.quantity <= 10) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-900 text-lg truncate" title={material.name}>
            {material.name}
          </h3>
          <div className="flex space-x-1">
            <button 
              onClick={onEdit}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Chỉnh sửa"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={onDelete}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Xóa"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Số lượng:</span>
            <span className={`px-2.5 py-0.5 rounded text-sm font-medium ${getStatusColor()}`}>
              {material.quantity} {material.unit}
            </span>
          </div>

          {material.category && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Danh mục:</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                {material.category}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">Cập nhật:</span>
            <span className="text-gray-600 text-sm">
              {new Date(material.last_updated).toLocaleDateString('vi-VN')}
            </span>
          </div>
          
          {material.expiration_date && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">Hết hạn:</span>
              <span className="text-gray-600 text-sm">
                {new Date(material.expiration_date).toLocaleDateString('vi-VN')}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 bg-gray-50 p-3">
        <button
          onClick={onAdjust}
          className="w-full py-1.5 px-4 border border-green-600 text-green-600 hover:bg-green-50 rounded-md text-sm font-medium transition-colors flex justify-center items-center"
        >
          <Plus size={16} className="mr-1" />
          <Minus size={16} className="mr-1" />
          Điều chỉnh số lượng
        </button>
      </div>
    </div>
  );
};

export default MaterialInventoryCard;