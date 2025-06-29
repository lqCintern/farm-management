import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import supplyListingService from '@/services/supply_chain/supplyListingService';
import SupplyListingCard from '@/components/SupplyChain/Listings/SupplyListingCard';
import SupplyListingFilter from '@/components/SupplyChain/Listings/SupplyListingFilter';
import Breadcrumb from '@/components/common/Breadcrumb';

const ListingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    province: searchParams.get('province') || '',
    keyword: searchParams.get('keyword') || '',
    page: Number(searchParams.get('page') || 1),
  });

  const breadcrumbItems = [
    { label: "Trang chủ", path: "/" },
    { label: "Vật tư nông nghiệp" },
    { label: "Tìm mua vật tư" }
  ];

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        // Only include non-empty filters
        const apiFilters = Object.entries(filters).reduce((acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        }, {} as Record<string, any>);
        
        const response = await supplyListingService.getListings(apiFilters);
        
        if (response && response.status === "success") {
          setListings(response.data);
          setCurrentPage(response.current_page || 1);
          setTotalPages(response.total_pages || 1);
          setError(null);
        } else {
          setError(response.message || 'Không thể tải danh sách vật tư');
        }
      } catch (err) {
        setError('Đã xảy ra lỗi khi tải danh sách vật tư');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
    
    // Update URL search params
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = String(value);
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
    window.scrollTo(0, 0);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      
      <h1 className="text-2xl font-bold mb-6">Vật Tư Nông Nghiệp</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar filters */}
        <div className="md:col-span-1">
          <SupplyListingFilter 
            onFilterChange={handleFilterChange}
            initialFilters={filters}
          />
        </div>
        
        {/* Main content */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
              {error}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-6 rounded text-center">
              <p className="text-lg font-medium">Không tìm thấy vật tư phù hợp</p>
              <p className="mt-2">Vui lòng thử lại với bộ lọc khác</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map(listing => (
                  <SupplyListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              
              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingsPage;
