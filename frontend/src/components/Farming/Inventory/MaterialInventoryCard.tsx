import React from 'react';
import { Link } from 'react-router-dom';
import { Package, Edit2, Trash2, PlusCircle, AlertCircle } from 'react-feather';
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
  return (
    <div className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Thêm Link để bọc nội dung thẻ, dẫn đến trang chi tiết */}
      <Link to={`/farmer/inventory/${material.id}`} className="block">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${
                material.category === 'fertilizer' ? 'bg-green-50 text-green-600' :
                material.category === 'pesticide' ? 'bg-red-50 text-red-600' :
                material.category === 'seed' ? 'bg-yellow-50 text-yellow-600' :
                material.category === 'tool' ? 'bg-blue-50 text-blue-600' :
                'bg-gray-50 text-gray-600'
              }`}>
                <Package size={20} />
              </div>
              <div className="truncate">
                <h3 className="font-medium text-gray-900 truncate">{material.name}</h3>
                <p className="text-sm text-gray-500">{material.category || "Không phân loại"}</p>
              </div>
            </div>
            
            {/* Show warning icon for low stock */}
            {material.quantity <= 10 && (
              <div className="ml-2">
                <AlertCircle size={18} className={material.quantity <= 0 ? "text-red-500" : "text-yellow-500"} />
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-500">Số lượng:</span>
              <span className={`font-medium ${
                material.quantity <= 0 ? 'text-red-600' :
                material.quantity <= 10 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {material.quantity} {material.unit}
              </span>
            </div>
            
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-sm text-gray-500">Cập nhật:</span>
              <span className="text-sm text-gray-500">
                {new Date(material.last_updated).toLocaleDateString('vi-VN')}
              </span>
            </div>

            {/* Add new info for unit cost */}
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-sm text-gray-500">Đơn giá:</span>
              <span className="text-sm text-gray-700">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(material.unit_cost || 0)}
              </span>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Action buttons */}
      <div className="flex border-t divide-x">
        <button 
          onClick={(e) => { e.preventDefault(); onAdjust(); }} 
          className="flex-1 py-2 text-blue-600 hover:bg-blue-50 text-sm font-medium"
        >
          <PlusCircle size={14} className="inline mr-1" /> Điều chỉnh
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); onEdit(); }}
          className="flex-1 py-2 text-gray-600 hover:bg-gray-50 text-sm font-medium"
        >
          <Edit2 size={14} className="inline mr-1" /> Sửa
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); onDelete(); }}
          className="flex-1 py-2 text-red-600 hover:bg-red-50 text-sm font-medium"
        >
          <Trash2 size={14} className="inline mr-1" /> Xóa
        </button>
      </div>
    </div>
  );
};

export default MaterialInventoryCard;