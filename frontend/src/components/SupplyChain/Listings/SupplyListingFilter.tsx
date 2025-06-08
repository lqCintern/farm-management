import React, { useState, useEffect } from 'react';
import supplyListingService from '@/services/supply_chain/supplyListingService';

interface SupplyListingFilterProps {
  onFilterChange: (filters: any) => void;
  initialFilters?: any;
}

const SupplyListingFilter: React.FC<SupplyListingFilterProps> = ({ 
  onFilterChange,
  initialFilters = {} 
}) => {
  const [categories, setCategories] = useState<{value: string, label: string}[]>([]);
  const [filters, setFilters] = useState({
    category: initialFilters.category || '',
    min_price: initialFilters.min_price || '',
    max_price: initialFilters.max_price || '',
    province: initialFilters.province || '',
    keyword: initialFilters.keyword || '',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await supplyListingService.getCategories();
        if (response && response.status === "success") {
          setCategories(response.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange(filters);
  };

  const handleClear = () => {
    const resetFilters = {
      category: '',
      min_price: '',
      max_price: '',
      province: '',
      keyword: '',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-medium text-lg mb-4">Lọc vật tư</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục
            </label>
            <select
              name="category"
              value={filters.category}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá tối thiểu
            </label>
            <input
              type="number"
              name="min_price"
              value={filters.min_price}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="VNĐ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Giá tối đa
            </label>
            <input
              type="number"
              name="max_price"
              value={filters.max_price}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="VNĐ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tỉnh/Thành phố
            </label>
            <input
              type="text"
              name="province"
              value={filters.province}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ví dụ: Hà Nội"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Từ khóa
            </label>
            <input
              type="text"
              name="keyword"
              value={filters.keyword}
              onChange={handleInputChange}
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tìm kiếm..."
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Áp dụng
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50"
          >
            Xóa lọc
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupplyListingFilter;
