import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import farmInventoryService, { FarmMaterialInventory, InventoryFilters } from '@/services/farming/farmInventoryService';
import { Plus, Search, Filter, Edit2, Trash2, MoreVertical, XCircle, RefreshCw, Download } from 'react-feather';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// Import các components
import MaterialInventoryCard from '@/components/Farming/Inventory/MaterialInventoryCard';
import InventoryFilter from '@/components/Farming/Inventory/InventoryFilter';
import AddMaterialModal from '@/components/Farming/Inventory/AddMaterialModal';
import EditMaterialModal from '@/components/Farming/Inventory/EditMaterialModal';
import AdjustQuantityModal from '@/components/Farming/Inventory/AdjustQuantityModal';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import InventoryStatisticsCard from '@/components/Farming/Inventory/InventoryStatisticsCard';

const InventoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [materials, setMaterials] = useState<FarmMaterialInventory[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [selectedMaterial, setSelectedMaterial] = useState<FarmMaterialInventory | null>(null);

  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    localStorage.getItem('inventoryViewMode') as 'grid' | 'list' || 'grid'
  );
  
  // Filters state
  const [filters, setFilters] = useState<InventoryFilters>({
    category: searchParams.get('category') || '',
    keyword: searchParams.get('keyword') || '',
    sort_by: searchParams.get('sort_by') || 'name',
    page: Number(searchParams.get('page') || 1),
    per_page: 12
  });

  // Load inventory data
  useEffect(() => {
    const fetchInventory = async () => {
      setLoading(true);
      try {
        // Chỉ gửi các filters không rỗng
        const apiFilters = Object.entries(filters).reduce((acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        }, {} as Record<string, any>);
        
        const response = await farmInventoryService.getInventoryMaterials(apiFilters);
        
        // Thay đổi kiểm tra response để phù hợp với cấu trúc thực tế
        if (response && response.materials) {
          setMaterials(response.materials);
          setCurrentPage(response.pagination.current_page);
          setTotalPages(response.pagination.total_pages);
          setError(null);
        } else {
          setError('Không thể tải danh sách vật tư trong kho');
        }
      } catch (err) {
        setError('Đã xảy ra lỗi khi tải danh sách vật tư');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch statistics
    const fetchStatistics = async () => {
      try {
        const statsResponse = await farmInventoryService.getInventoryStatistics();
        // Kiểm tra trực tiếp dữ liệu
        if (statsResponse && statsResponse.statistics) {
          setStatistics(statsResponse.statistics);
        }
      } catch (err) {
        console.error('Error fetching inventory statistics:', err);
      }
    };

    fetchInventory();
    fetchStatistics();
    
    // Update URL search params
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'per_page') params[key] = String(value);
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<InventoryFilters>) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo(0, 0);
  };

  // Handle add new material
  const handleAddMaterial = async (materialData: any) => {
    try {
      await farmInventoryService.addMaterialToInventory(materialData);
      setIsAddModalOpen(false);
      // Reload data
      setFilters({ ...filters });
    } catch (err) {
      console.error('Error adding material:', err);
    }
  };

  // Handle edit material
  const handleEditMaterial = async (materialData: any) => {
    if (!selectedMaterial) return;
    
    try {
      await farmInventoryService.updateInventoryMaterial(selectedMaterial.id, materialData);
      setIsEditModalOpen(false);
      // Reload data
      setFilters({ ...filters });
    } catch (err) {
      console.error('Error updating material:', err);
    }
  };

  // Handle adjust quantity
  const handleAdjustQuantity = async (adjustment: { quantity: number; reason: string }) => {
    if (!selectedMaterial) return;
    
    try {
      await farmInventoryService.adjustInventoryQuantity(selectedMaterial.id, adjustment);
      setIsAdjustModalOpen(false);
      // Reload data
      setFilters({ ...filters });
    } catch (err) {
      console.error('Error adjusting quantity:', err);
    }
  };

  // Handle delete material
  const handleDeleteMaterial = async () => {
    if (!selectedMaterial) return;
    
    try {
      await farmInventoryService.removeInventoryMaterial(selectedMaterial.id);
      setIsDeleteModalOpen(false);
      // Reload data
      setFilters({ ...filters });
    } catch (err) {
      console.error('Error deleting material:', err);
    }
  };

  // Toggle view mode
  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    localStorage.setItem('inventoryViewMode', newMode);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const options = { 
      filename: 'kho-vat-tu',
      fieldSeparator: ',',
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true, 
      useTextFile: false,
      useBom: true,
      headers: ['Tên vật tư', 'Số lượng', 'Đơn vị', 'Danh mục', 'Cập nhật lần cuối']
    };
    
    const data = materials.map(material => ({
      'Tên vật tư': material.name,
      'Số lượng': material.quantity,
      'Đơn vị': material.unit,
      'Danh mục': material.category,
      'Cập nhật lần cuối': new Date(material.last_updated).toLocaleDateString('vi-VN')
    }));
  };

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center mt-8">
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded border disabled:opacity-50"
          >
            Trước
          </button>
          
          {/* Display page numbers */}
          {[...Array(totalPages).keys()].map(i => (
            <button
              key={i}
              onClick={() => handlePageChange(i + 1)}
              className={`px-4 py-2 rounded border ${
                currentPage === i + 1 ? 'bg-green-600 text-white' : ''
              }`}
            >
              {i + 1}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded border disabled:opacity-50"
          >
            Tiếp
          </button>
        </div>
      </div>
    );
  };

  // Categorized materials for statistics
  const categorizedMaterials = useMemo(() => {
    const categories: Record<string, number> = {};
    
    materials.forEach(material => {
      const category = material.category || 'Không phân loại';
      if (!categories[category]) {
        categories[category] = 1;
      } else {
        categories[category]++;
      }
    });
    
    return categories;
  }, [materials]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold">Kho Vật Tư Nông Nghiệp</h1>
        
        <div className="flex flex-wrap items-center space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Plus size={18} className="mr-1" />
            Thêm vật tư
          </button>
          
          <button
            onClick={toggleViewMode}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {viewMode === 'grid' ? 'Xem dạng danh sách' : 'Xem dạng lưới'}
          </button>
          
          <Menu as="div" className="relative ml-2">
            <Menu.Button className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              <MoreVertical size={18} />
            </Menu.Button>
            
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setFilters({ ...filters })}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <RefreshCw size={18} className="mr-2" />
                        Làm mới dữ liệu
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleExportCSV}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <Download size={18} className="mr-2" />
                        Xuất CSV
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <InventoryStatisticsCard 
            title="Tổng vật tư"
            value={statistics.total_items}
            icon="box"
            colorClass="bg-blue-50 text-blue-500"
          />
          <InventoryStatisticsCard 
            title="Vật tư sắp hết"
            value={statistics.low_stock_count}
            icon="alert-triangle"
            colorClass="bg-yellow-50 text-yellow-500"
          />
          <InventoryStatisticsCard 
            title="Đã hết"
            value={statistics.out_of_stock_count}
            icon="x-circle"
            colorClass="bg-red-50 text-red-500"
          />
          <InventoryStatisticsCard 
            title="Danh mục"
            value={Object.keys(categorizedMaterials).length}
            icon="tag"
            colorClass="bg-green-50 text-green-500"
          />
        </div>
      )}

      {/* Search bar and filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-grow">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm vật tư..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-green-500 focus:border-green-500"
                value={filters.keyword || ''}
                onChange={(e) => handleFilterChange({ keyword: e.target.value })}
              />
              <Search 
                size={20} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              {filters.keyword && (
                <button 
                  onClick={() => handleFilterChange({ keyword: '' })}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>
          </div>
          
          <InventoryFilter onFilterChange={handleFilterChange} initialFilters={filters} />
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
            {error}
          </div>
        ) : materials.length === 0 ? (
          <div className="bg-yellow-50 text-yellow-700 p-10 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-lg font-medium mb-2">Kho vật tư của bạn đang trống</p>
              <p className="text-sm mb-6">Bắt đầu thêm vật tư vào kho hoặc điều chỉnh bộ lọc</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Thêm vật tư mới
              </button>
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              // Grid view
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                {materials.map(material => (
                  <MaterialInventoryCard 
                    key={material.id} 
                    material={material}
                    onEdit={() => {
                      setSelectedMaterial(material);
                      setIsEditModalOpen(true);
                    }}
                    onAdjust={() => {
                      setSelectedMaterial(material);
                      setIsAdjustModalOpen(true);
                    }}
                    onDelete={() => {
                      setSelectedMaterial(material);
                      setIsDeleteModalOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              // List view
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tên vật tư
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Số lượng
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Danh mục
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cập nhật lần cuối
                      </th>
                      <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {materials.map(material => (
                      <tr key={material.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{material.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            material.quantity <= 0 ? 'bg-red-100 text-red-800' : 
                            material.quantity <= 10 ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {material.quantity} {material.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{material.category || 'Không phân loại'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-500">{new Date(material.last_updated).toLocaleDateString('vi-VN')}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedMaterial(material);
                              setIsAdjustModalOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            Điều chỉnh
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMaterial(material);
                              setIsEditModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMaterial(material);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {renderPagination()}
          </>
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddMaterialModal 
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleAddMaterial}
        />
      )}
      
      {isEditModalOpen && selectedMaterial && (
        <EditMaterialModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEditMaterial}
          material={selectedMaterial}
        />
      )}
      
      {isAdjustModalOpen && selectedMaterial && (
        <AdjustQuantityModal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          onSave={handleAdjustQuantity}
          material={selectedMaterial}
        />
      )}
      
      {isDeleteModalOpen && selectedMaterial && (
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteMaterial}
          title="Xóa vật tư"
          message={`Bạn có chắc chắn muốn xóa vật tư "${selectedMaterial.name}" khỏi kho?`}
          confirmText="Xóa"
          confirmButtonClass="bg-red-600 hover:bg-red-700"
        />
      )}
    </div>
  );
};

export default InventoryPage;