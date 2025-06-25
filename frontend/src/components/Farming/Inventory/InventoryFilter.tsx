import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'react-feather';
import { InventoryFilters } from '@/services/farming/farmInventoryService';

interface InventoryFilterProps {
  onFilterChange: (filters: Partial<InventoryFilters>) => void;
  initialFilters: InventoryFilters;
}

const MATERIAL_CATEGORIES = [
  'Tất cả',
  'Phân bón',
  'Thuốc trừ sâu',
  'Thuốc diệt cỏ',
  'Hạt giống',
  'Dụng cụ',
  'Khác'
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Tên (A-Z)' },
  { value: 'name_desc', label: 'Tên (Z-A)' },
  { value: 'quantity', label: 'Số lượng (Thấp-Cao)' },
  { value: 'quantity_desc', label: 'Số lượng (Cao-Thấp)' },
  { value: 'updated', label: 'Cập nhật gần nhất' },
  { value: 'category', label: 'Danh mục' }
];

const InventoryFilter: React.FC<InventoryFilterProps> = ({ onFilterChange, initialFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    category: initialFilters.category || '',
    sort_by: initialFilters.sort_by || 'name',
    stock_status: 'all' // 'all', 'in_stock', 'low_stock', 'out_of_stock'
  });

  useEffect(() => {
    // Cập nhật trạng thái local nếu initialFilters thay đổi từ bên ngoài
    setFilters(prev => ({
      ...prev,
      category: initialFilters.category || '',
      sort_by: initialFilters.sort_by || 'name'
    }));
  }, [initialFilters]);

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    
    // Chuyển đổi filter để gửi đi
    const apiFilters: Partial<InventoryFilters> = {
      sort_by: newFilters.sort_by
    };
    
    if (newFilters.category && newFilters.category !== 'Tất cả') {
      apiFilters.category = newFilters.category;
    }
    
    // Xử lý stock_status
    switch (newFilters.stock_status) {
      case 'in_stock':
        apiFilters.min_quantity = '1';
        break;
      case 'low_stock':
        apiFilters.max_quantity = '10';
        apiFilters.min_quantity = '0.1';
        break;
      case 'out_of_stock':
        apiFilters.max_quantity = '0';
        break;
    }
    
    onFilterChange(apiFilters);
  };

  const clearFilters = () => {
    const defaultFilters = {
      category: '',
      sort_by: 'name',
      stock_status: 'all'
    };
    setFilters(defaultFilters);
    onFilterChange({ sort_by: 'name' });
  };

  return (
    <div className="flex flex-col md:flex-row">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
      >
        <Filter size={16} className="mr-2" />
        Bộ lọc
        {isExpanded ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
      </button>
      
      {isExpanded && (
        <div className="mt-4 md:mt-0 md:ml-4 p-4 bg-white border border-gray-200 rounded-md shadow-sm md:absolute md:right-0 md:top-full md:z-10 md:w-64">
          <div className="space-y-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục
              </label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Tất cả</option>
                {MATERIAL_CATEGORIES.filter(c => c !== 'Tất cả').map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="sort_by" className="block text-sm font-medium text-gray-700 mb-1">
                Sắp xếp theo
              </label>
              <select
                id="sort_by"
                value={filters.sort_by}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tình trạng kho
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFilterChange('stock_status', 'all')}
                  className={`py-1.5 px-3 rounded text-sm ${
                    filters.stock_status === 'all'
                      ? 'bg-green-100 text-green-800 font-medium'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('stock_status', 'in_stock')}
                  className={`py-1.5 px-3 rounded text-sm ${
                    filters.stock_status === 'in_stock'
                      ? 'bg-green-100 text-green-800 font-medium'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Còn hàng
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('stock_status', 'low_stock')}
                  className={`py-1.5 px-3 rounded text-sm ${
                    filters.stock_status === 'low_stock'
                      ? 'bg-yellow-100 text-yellow-800 font-medium'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Sắp hết
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterChange('stock_status', 'out_of_stock')}
                  className={`py-1.5 px-3 rounded text-sm ${
                    filters.stock_status === 'out_of_stock'
                      ? 'bg-red-100 text-red-800 font-medium'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Hết hàng
                </button>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryFilter;