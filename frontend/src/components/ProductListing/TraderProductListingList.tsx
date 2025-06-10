import React, { useState, useEffect } from "react";
import { getProductListings, ProductListing } from "@/services/marketplace/productListingsService";
import { useNavigate } from "react-router-dom";
import { Spinner, Button, Input, Select } from "@/components/common";

// Define product type options
const productTypeOptions = [
  { value: "", label: "Tất cả loại sản phẩm" },
  { value: "fruit", label: "Trái cây" },
  { value: "vegetable", label: "Rau củ" },
  { value: "grain", label: "Ngũ cốc" }
];

export default function TraderProductListingList() {
  const navigate = useNavigate();
  // State management
  const [listings, setListings] = useState<ProductListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    productType: "",
    province: "",
    minPrice: "",
    maxPrice: "",
    harvestReady: false
  });
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch product listings with filters
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        
        // Thay vì tạo URLSearchParams, hãy tạo một object phù hợp với ProductListingFilters
        const filtersObject = {
          product_type: filters.productType || undefined,
          province: filters.province || undefined,
          min_price: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
          max_price: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
          ready_to_harvest: filters.harvestReady || undefined,
          query: searchQuery || undefined,
          sort: sortBy
        };
        
        // Truyền object trực tiếp vào hàm API
        const response = await getProductListings(filtersObject);
        
        // ĐÂY LÀ PHẦN CẦN SỬA: API đang trả về items thay vì product_listings
        // Sửa thành:
        const typedResponse = response as { items?: ProductListing[] };
        const products = typedResponse.items || []; // Lấy từ property 'items' thay vì 'product_listings'
        setListings(products);
        
        // Có thể lưu thông tin phân trang nếu cần
        // const pagination = response.pagination;
        // setPagination(pagination);
      } catch (err: any) {
        console.error("Failed to fetch product listings:", err);
        setError(err.message || "Failed to load product listings");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [filters, sortBy, searchQuery]);

  // Filter handlers
  const handleFilterChange = (key: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      productType: "",
      province: "",
      minPrice: "",
      maxPrice: "",
      harvestReady: false
    });
    setSearchQuery("");
    setSortBy("newest");
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      {/* Search and filter section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Tìm kiếm sản phẩm dứa</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Search box */}
          <div className="md:col-span-2">
            <Input
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full"
              leftIcon={
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          
          {/* Product type filter */}
          <div>
            <Select
              value={filters.productType}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange("productType", e.target.value)}
              options={productTypeOptions}
            />
          </div>
          
          {/* Sort options */}
          <div>
            <Select
              value={sortBy}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value)}
              options={[
                { value: "newest", label: "Mới nhất" },
                { value: "price_low", label: "Giá thấp đến cao" },
                { value: "price_high", label: "Giá cao đến thấp" },
                { value: "harvest_date", label: "Ngày thu hoạch" }
              ] as Array<{ value: string; label: string }>}
            />
          </div>
        </div>

        {/* Advanced filters - can be toggled */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Select
              value={filters.province}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFilterChange("province", e.target.value)}
              options={[
                { value: "", label: "Tất cả khu vực" },
                { value: "Hà Nội", label: "Hà Nội" },
                { value: "Hồ Chí Minh", label: "Hồ Chí Minh" },
                { value: "Đà Nẵng", label: "Đà Nẵng" }
              ] as Array<{ value: string; label: string }>}
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Giá tối thiểu"
              value={filters.minPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange("minPrice", e.target.value)}
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Giá tối đa"
              value={filters.maxPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange("maxPrice", e.target.value)}
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.harvestReady}
                onChange={e => handleFilterChange("harvestReady", e.target.checked)}
                className="form-checkbox h-5 w-5 text-green-600"
              />
              <span className="ml-2 text-gray-700">Sẵn sàng thu hoạch</span>
            </label>
            <Button 
              buttonType="text"
              onClick={resetFilters}
              className="ml-auto text-blue-600 hover:text-blue-800"
            >
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </div>

      {/* Results section */}
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-700">
          Kết quả tìm kiếm: {listings.length} sản phẩm
        </h2>
      </div>

      {/* Product listing cards */}
      {listings.length === 0 ? (
        <div className="bg-yellow-50 text-yellow-700 p-6 rounded-lg text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xl font-medium mb-2">Không tìm thấy sản phẩm phù hợp</p>
          <p className="mb-4">Hãy thử điều chỉnh bộ lọc để xem nhiều sản phẩm hơn</p>
          <Button buttonType="primary" onClick={resetFilters}>
            Xóa bộ lọc
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <TraderProductCard key={listing.id} listing={listing} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
}

// Special card component for traders
interface TraderProductCardProps {
  listing: ProductListing;
  navigate: ReturnType<typeof useNavigate>;
}

function TraderProductCard({ listing, navigate }: TraderProductCardProps) {
  const [imageError, setImageError] = useState(false);
    const getThumbnailUrl = (): string => {

    if (imageError) {
      return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNOTAgODVDOTAgODguODY2IDg2Ljg2NiA5MiA4MyA5MkM3OS4xMzQgOTIgNzYgODguODY2IDc2IDg1Qzc2IDgxLjEzNCA3OS4xMzQgNzggODMgNzhDODYuODY2IDc4IDkwIDgxLjEzNCA5MCA4NVoiIGZpbGw9IiM5Q0EzQUYiLz48cGF0aCBkPSJNMTI0IDE1Mi4yNUw1MS4yNSA3MUw3MCA1MEwxMTAgOTBMMTYwIDU1TDE4NSA4NUwxMjQgMTUyLjI1WiIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjEwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+";
    }
    // Ưu tiên hiển thị thumbnail nếu có
    if (listing.thumbnail && typeof listing.thumbnail === "string") {
      return listing.thumbnail;
    }
    // Nếu có product_images array, thử lấy ảnh đầu tiên
    if (listing.product_images && Array.isArray(listing.product_images) && listing.product_images.length > 0) {
      const firstImage = listing.product_images[0];
      if (typeof firstImage === "string") {
        return firstImage;
      }
      if (firstImage && typeof firstImage === "object" && "image_url" in firstImage && typeof firstImage.image_url === "string") {
        return firstImage.image_url;
      }
    }
    // Ảnh mặc định nếu không có ảnh nào
    return "/images/placeholder-pineapple.jpg";
  };

  function formatRelativeDate(created_at: string): React.ReactNode {
    const now = new Date();
    const created = new Date(created_at);
    const diffMs = now.getTime() - created.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (isNaN(created.getTime())) return "Không rõ thời gian";

    if (diffSec < 60) return "Vừa đăng";
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay === 1) return "Hôm qua";
    if (diffDay < 7) return `${diffDay} ngày trước`;

    // Otherwise, show date in dd/MM/yyyy
    return created.toLocaleDateString("vi-VN");
  }
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      {/* Image section - cover style */}
      <div className="relative pt-[60%]">
        <img 
          src={getThumbnailUrl()}
          alt={listing.title} 
          className="absolute top-0 left-0 w-full h-full object-cover"
          onError={(e) => {
            setImageError(true);
            // Fallback khi ảnh lỗi
            (e.target as HTMLImageElement).src = "/images/placeholder-pineapple.jpg";
          }}
        />
        <div className="absolute top-0 right-0 p-2">
          <span className={`text-white text-xs font-bold px-2 py-1 rounded-full ${
            getStatusClass(listing.status)
          }`}>
            {getStatusLabel(listing.status)}
          </span>
        </div>
        
        {/* Add date badge */}
        {listing.created_at && (
          <div className="absolute bottom-0 left-0 p-2">
            <span className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              {formatRelativeDate(listing.created_at)}
            </span>
          </div>
        )}
      </div>
      
      {/* Content section */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-lg mb-1 text-gray-800 line-clamp-2">{listing.title}</h3>
        
        {listing.location_text ? (
          <div className="mb-2 text-gray-600 text-sm flex items-start">
            <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{listing.location_text}</span>
          </div>
        ) : (
          listing.address && listing.province && (
            <div className="mb-2 text-gray-600 text-sm flex items-start">
              <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="line-clamp-1">{`${listing.address}, ${listing.province}`}</span>
            </div>
          )
        )}
        
        {/* Stats badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {listing.view_count !== undefined && (
            <span className="inline-flex items-center text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {listing.view_count || 0}
            </span>
          )}
          
          {listing.message_count !== undefined && (
            <span className="inline-flex items-center text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {listing.message_count || 0}
            </span>
          )}
        </div>
        
        {/* Key details - in 2x2 grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="text-sm">
            <span className="text-gray-500">Loại: </span>
            <span className="font-medium">{listing.product_type}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Số lượng: </span>
            <span className="font-medium">{listing.quantity} kg</span>
          </div>
          {listing.average_size && (
            <div className="text-sm">
              <span className="text-gray-500">Kích cỡ: </span>
              <span className="font-medium">{listing.average_size}g/quả</span>
            </div>
          )}
          <div className="text-sm">
            <span className="text-gray-500">Thu hoạch: </span>
            <span className="font-medium">{formatDate(listing.harvest_start_date ?? null)}</span>
          </div>
        </div>
        
        <div className="mt-auto pt-2">
          {/* Price and seller info */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="text-xl font-bold text-green-600">{formatCurrency(listing.price_expectation ?? null)}</span>
              <span className="text-gray-500 text-sm">/kg</span>
            </div>
            
            {/* Farmer badge */}
            {listing.seller_name && (
              <div className="flex items-center text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {listing.seller_name}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-2">
            <Button 
              buttonType="primary" 
              className="flex-1"
              onClick={() => navigate(`/products/${listing.id}`)}
            >
              Xem chi tiết
            </Button>
            <Button 
              buttonType="secondary" 
              className="flex-1"
              onClick={() => navigate(`/marketplace/orders/create?listing=${listing.id}`)}
              disabled={!(
                (typeof listing.status === "string" && listing.status === "active") ||
                (typeof listing.status === "number" && listing.status === 1)
              )}
            >
              Đặt mua
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Status helpers
function getStatusClass(status: string | number): string {
  // Adjust these mappings as per your backend status codes
  if (status === "active" || status === 1) return "bg-green-500";
  if (status === "reserved" || status === 2) return "bg-yellow-500";
  return "bg-gray-500";
}

function getStatusLabel(status: string | number): string {
  if (status === "active" || status === 1) return "Có sẵn";
  if (status === "reserved" || status === 2) return "Đã đặt";
  return "Đã bán";
}

// Helper functions
function formatDate(dateString: string | null): string {
  if (!dateString) return "Chưa xác định";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Chưa xác định";
  return date.toLocaleDateString('vi-VN');
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return "Thỏa thuận";
  return new Intl.NumberFormat('vi-VN').format(amount);
}
