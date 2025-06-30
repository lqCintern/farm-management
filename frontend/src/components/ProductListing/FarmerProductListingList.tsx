import React, { useState, useEffect } from "react";
import { getMyProductListings, updateProductListing } from "@/services/marketplace/productListingsService";
import Button from "@/components/common/Button";
import EmptyState from "@/components/common/EmptyState";
import Tabs from "@/components/common/Tabs"; // Fixed import
import Spinner from "@/components/common/Spinner";
import { useNavigate } from "react-router-dom";

export default function FarmerProductListingList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"active" | "reserved" | "sold" | "hidden">("active");
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    active: 0,
    reserved: 0,
    sold: 0,
    hidden: 0
  });

  // Fetch my listings based on active tab
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const tabMapping: { [key: string]: number } = {
          active: 1,
          reserved: 2,
          sold: 3,
          hidden: 4,
        };
        const response = await getMyProductListings(tabMapping[activeTab]);
        const typedResponse = response as { product_listings: any[]; statistics?: typeof stats };
        setListings(typedResponse.product_listings || []);
        
        // Update stats
        if ((response as { statistics?: typeof stats }).statistics) {
          setStats((response as { statistics: typeof stats }).statistics);
        }
      } catch (err: any) {
        console.error("Failed to fetch listings:", err);
        setError(err.message || "Không thể tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [activeTab]);

  // Handle status change
  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      if (newStatus === "sold") {
        const formData = new FormData();
        formData.append("status", "sold");
        await updateProductListing(id, formData);
      } else if (newStatus === "hidden") {
        const formData = new FormData();
        formData.append("status", "hidden");
        await updateProductListing(id, formData);
      } else if (newStatus === "active") {
        const formData = new FormData();
        formData.append("status", "active");
        await updateProductListing(id, formData);
      }

      // Refresh listings after update
      const tabMapping: { [key: string]: number } = {
        active: 1,
        reserved: 2,
        sold: 3,
        hidden: 4,
      };
      const response = await getMyProductListings(tabMapping[activeTab]);
      const typedResponse = response as { product_listings: any[]; statistics?: typeof stats };
      setListings(typedResponse.product_listings || []);
      
      // Update stats
      if ((response as { statistics?: typeof stats }).statistics) {
        setStats((response as { statistics: typeof stats }).statistics);
      }
    } catch (err) {
      console.error("Failed to update product status:", err);
    }
  };

  return (
    <div className="container mx-auto px-4">
      {/* Header with stats */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Quản lý sản phẩm của tôi</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            title="Đang bán" 
            value={stats.active} 
            color="bg-blue-500"
            onClick={() => setActiveTab("active")}
            active={activeTab === "active"}
          />
          <StatCard 
            title="Đã đặt" 
            value={stats.reserved} 
            color="bg-yellow-500"
            onClick={() => setActiveTab("reserved")}
            active={activeTab === "reserved"}
          />
          <StatCard 
            title="Đã bán" 
            value={stats.sold} 
            color="bg-green-500"
            onClick={() => setActiveTab("sold")}
            active={activeTab === "sold"}
          />
          <StatCard 
            title="Đã ẩn" 
            value={stats.hidden} 
            color="bg-gray-500"
            onClick={() => setActiveTab("hidden")}
            active={activeTab === "hidden"}
          />
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-between items-center mb-6">
        <Tabs
          tabs={[
            { id: "active", label: "Đang bán" },
            { id: "reserved", label: "Đã đặt" },
            { id: "sold", label: "Đã bán" },
            { id: "hidden", label: "Đã ẩn" }
          ]}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as "active" | "reserved" | "sold" | "hidden")}
        />
        
        <Button 
          buttonType="primary" 
          onClick={() => navigate("/products/create")}
          className="flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Thêm sản phẩm mới
        </Button>
      </div>

      {/* Listings grid/list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">{error}</div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={<svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>}
          title={`Chưa có sản phẩm ${getTabLabel(activeTab)}`}
          description={getEmptyStateMessage(activeTab)}
          actionButton={
            activeTab === "active" || activeTab === "hidden" ? (
              <Button 
                buttonType="primary" 
                onClick={() => navigate("/products/create")}
              >
                Thêm sản phẩm
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {listings.map(listing => (
            <FarmerProductCard 
              key={listing.id} 
              listing={listing} 
              status={activeTab}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Farmer-specific product card
interface FarmerProductCardProps {
  listing: {
    id: number;
    title: string;
    product_images?: (string | { image_url: string })[];
    thumbnail?: string;
    product_type: string;
    quantity: number;
    price_expectation: number;
    harvest_start_date: string;
    orders?: { buyer: { fullname: string }; quantity?: number; total_weight?: number; price?: number }[];
    harvests?: { id: number; scheduled_date: string; location: string; status?: string }[];
    view_count?: number;
    message_count?: number;
    order_count?: number;
  };
  status: string;
  onStatusChange: (id: number, newStatus: string) => Promise<void>;
}

function FarmerProductCard({ listing, status, onStatusChange }: FarmerProductCardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // Thêm state để theo dõi lỗi ảnh
  const [imageError, setImageError] = useState(false);

  const handleAction = async (action: "active" | "hidden" | "sold"): Promise<void> => {
    setLoading(true);
    try {
        await onStatusChange(listing.id, action);
    } finally {
        setLoading(false);
    }
  };

  // Get order/harvest info if reserved
  const hasOrder = listing.orders && listing.orders.length > 0;
  const hasHarvest = listing.harvests && listing.harvests.length > 0;

  // Thêm hàm getThumbnailUrl dưới đây (tương tự như bên TraderProductListingList)
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

    // Ảnh mặc định nếu không có ảnh
    return "/images/placeholder-pineapple.jpg";
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="md:flex">
        {/* Image section (md and above) */}
        <div className="md:w-1/3 h-48 md:h-auto">
          <img 
            src={getThumbnailUrl()}
            alt={listing.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              setImageError(true);
              // Fallback khi ảnh lỗi
              (e.target as HTMLImageElement).src = "/images/placeholder-pineapple.jpg";
            }}
          />
        </div>
        
        {/* Content section */}
        <div className="p-6 md:w-2/3 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-lg text-gray-800">{listing.title}</h3>
            <StatusBadge status={status} />
          </div>
          
          {/* Details */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
            <div className="text-sm">
              <span className="text-gray-500">Loại sản phẩm: </span>
              <span className="font-medium">{listing.product_type}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Số lượng: </span>
              <span className="font-medium">{listing.quantity} kg</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Giá đề xuất: </span>
              <span className="font-medium">{formatCurrency(listing.price_expectation)}/kg</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Ngày thu hoạch: </span>
              <span className="font-medium">{formatDate(listing.harvest_start_date)}</span>
            </div>
          </div>
          
          {/* Order info if reserved */}
          {status === "reserved" && hasOrder && (
            <div className="mb-4 p-3 bg-blue-50 rounded-md">
              <h4 className="font-medium text-blue-700 mb-1">Đơn đặt hàng từ thương lái</h4>
              <div className="text-sm">
                <p className="mb-1">
                  <span className="text-gray-600">Người đặt: </span>
                  <span className="font-medium">{listing.orders?.[0]?.buyer?.fullname || "Chưa xác định"}</span>
                </p>
                {listing.orders?.[0]?.total_weight || listing.orders?.[0]?.quantity && (
                  <p className="mb-1">
                    <span className="text-gray-600">Sản lượng: </span>
                    <span className="font-medium">{listing.orders[0].total_weight || listing.orders[0].quantity} kg</span>
                  </p>
                )}
                {listing.orders?.[0]?.price && (
                  <p>
                    <span className="text-gray-600">Giá đề xuất: </span>
                    <span className="font-medium">{formatCurrency(listing.orders[0].price)}/kg</span>
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Harvest info if present */}
          {hasHarvest && (
            <div className="mb-4 p-3 bg-green-50 rounded-md">
              <h4 className="font-medium text-green-700 mb-1">Lịch thu hoạch</h4>
              <div className="text-sm">
                <p className="mb-1">
                  <span className="text-gray-600">Ngày hẹn: </span>
                  <span className="font-medium">{formatDateTime(listing.harvests?.[0]?.scheduled_date ?? null)}</span>
                </p>
                <p>
                  <span className="text-gray-600">Địa điểm: </span>
                  <span className="font-medium">{listing.harvests?.[0]?.location || "Chưa xác định"}</span>
                </p>
              </div>
            </div>
          )}
          
          {/* Stats */}
          <div className="mb-4 flex gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {listing.view_count || 0} lượt xem
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              {listing.message_count || 0} tin nhắn
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {listing.order_count || 0} đơn hàng
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="mt-auto pt-4 border-t border-gray-100 flex flex-wrap gap-2">
            <Button
              buttonType="secondary"
              className="flex-grow"
              onClick={() => navigate(`/products/${listing.id}`)}
            >
              Xem chi tiết
            </Button>
            
            {status === "active" && (
              <>
                <Button 
                  buttonType="primary"
                  className="flex-grow"
                  onClick={() => navigate(`/products/${listing.id}/edit`)}
                >
                  Chỉnh sửa
                </Button>
                <Button
                  buttonType="danger"
                  className="flex-grow"
                  onClick={() => handleAction("hidden")}
                  disabled={loading}
                >
                  Ẩn
                </Button>
              </>
            )}
            
            {status === "hidden" && (
              <Button
                buttonType="primary"
                className="flex-grow"
                onClick={() => handleAction("active")}
                disabled={loading}
              >
                Hiện lại
              </Button>
            )}
            
            {status === "reserved" && (
              <Button 
                buttonType="success"
                className="flex-grow"
                onClick={() => navigate(`/marketplace/harvests/${listing.harvests?.[0]?.id || 'create'}?product=${listing.id}`)}
              >
                {listing.harvests && listing.harvests.length > 0 ? "Xem lịch thu hoạch" : "Lên lịch thu hoạch"}
              </Button>
            )}
            
            {hasHarvest && listing.harvests?.[0]?.status !== "completed" && (
              <Button
                buttonType="success"
                className="flex-grow"
                onClick={() => listing.harvests?.[0]?.id && navigate(`/marketplace/harvests/${listing.harvests[0].id}`)}
              >
                Xem/Cập nhật thu hoạch
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
interface StatCardProps {
  title: string;
  value: number;
  color: string;
  onClick: () => void;
  active: boolean;
}

function StatCard({ title, value, color, onClick, active }: StatCardProps) {
  return (
    <div 
      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
        active ? `border-${color.split('-')[1]}-500 bg-${color.split('-')[1]}-50` : 'border-gray-200'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mr-4`}>
          <span className="text-white font-bold text-lg">{value}</span>
        </div>
        <span className="font-medium text-gray-700">{title}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let bg, text, label;
  
  switch (status) {
    case "active":
      bg = "bg-blue-100";
      text = "text-blue-800";
      label = "Đang bán";
      break;
    case "reserved":
      bg = "bg-yellow-100";
      text = "text-yellow-800";
      label = "Đã đặt";
      break;
    case "sold":
      bg = "bg-green-100";
      text = "text-green-800";
      label = "Đã bán";
      break;
    case "hidden":
      bg = "bg-gray-100";
      text = "text-gray-800";
      label = "Đã ẩn";
      break;
    default:
      bg = "bg-gray-100";
      text = "text-gray-800";
      label = status;
  }
  
  return (
    <span className={`${bg} ${text} text-xs font-medium py-1 px-2 rounded-full`}>
      {label}
    </span>
  );
}

// Helper functions
function getTabLabel(tab: "active" | "reserved" | "sold" | "hidden"): string {
    switch(tab) {
        case "active": return "đang bán";
        case "reserved": return "đã đặt";
        case "sold": return "đã bán";
        case "hidden": return "đã ẩn";
        default: return "";
    }
}

function getEmptyStateMessage(tab: "active" | "reserved" | "sold" | "hidden"): string {
    switch(tab) {
        case "active": 
            return "Bạn chưa có sản phẩm nào đang được rao bán. Hãy thêm sản phẩm mới ngay!";
        case "reserved": 
            return "Bạn chưa có sản phẩm nào đang được đặt. Khi có người đặt mua, sản phẩm sẽ xuất hiện ở đây.";
        case "sold": 
            return "Bạn chưa có sản phẩm nào đã bán. Khi bán thành công, sản phẩm sẽ được hiển thị ở đây.";
        case "hidden": 
            return "Bạn chưa có sản phẩm nào đang bị ẩn.";
        default: 
            return "Không có sản phẩm nào.";
    }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Chưa xác định";
  const date = new Date(dateString);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function formatDateTime(dateTimeString: string | null): string {
  if (!dateTimeString) return "Chưa xác định";
  const date = new Date(dateTimeString);
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return "Thỏa thuận";
  return new Intl.NumberFormat('vi-VN').format(amount);
}