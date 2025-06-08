import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import supplyListingService from '@/services/supply_chain/supplyListingService';
import CategoryBadge from '@/components/SupplyChain/Common/CategoryBadge';
import QuantitySelector from '@/components/SupplyChain/Common/QuantitySelector';

const ListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const response = await supplyListingService.getListingById(parseInt(id));
        
        if (response && response.status === "success") {
          setListing(response.data);
          setSelectedImage(response.data.main_image || (response.data.images && response.data.images.length > 0 ? response.data.images[0] : null));
          setError(null);
        } else {
          setError(response.message || 'Không thể tải thông tin vật tư');
        }
      } catch (err) {
        setError('Đã xảy ra lỗi khi tải thông tin vật tư');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleOrderClick = () => {
    if (!listing) return;
    navigate(`/farmer/orders/create/${listing.id}`, { 
      state: { listing, quantity } 
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error || 'Không tìm thấy thông tin vật tư'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-green-600 hover:text-green-800 mb-6"
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Quay lại
      </button>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
          {/* Image section */}
          <div>
            <div className="mb-4 aspect-w-1 aspect-h-1 rounded-lg overflow-hidden border">
              {selectedImage ? (
                <img 
                  src={selectedImage} 
                  alt={listing.name} 
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                  Không có hình ảnh
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {listing.images && listing.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {listing.images.map((image: string, index: number) => (
                  <div 
                    key={index}
                    onClick={() => setSelectedImage(image)}
                    className={`cursor-pointer rounded overflow-hidden border-2 aspect-square ${selectedImage === image ? 'border-green-500' : 'border-gray-200'}`}
                  >
                    <img 
                      src={image} 
                      alt={`${listing.name} - ${index}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Info section */}
          <div>
            <div className="mb-2">
              <CategoryBadge category={listing.category} />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {listing.name}
            </h1>
            
            <div className="flex items-baseline mb-4">
              <span className="text-3xl font-bold text-red-600">
                {listing.price.toLocaleString()} đ
              </span>
              <span className="text-gray-600 ml-2">
                / {listing.unit}
              </span>
            </div>
            
            <div className="border-t border-b border-gray-200 py-4 mb-6">
              <div className="grid grid-cols-2 gap-y-2">
                <div>
                  <span className="text-gray-600">Còn lại:</span> {listing.quantity} {listing.unit}
                </div>
                {listing.brand && (
                  <div>
                    <span className="text-gray-600">Thương hiệu:</span> {listing.brand}
                  </div>
                )}
                {listing.manufacturer && (
                  <div>
                    <span className="text-gray-600">Nhà sản xuất:</span> {listing.manufacturer}
                  </div>
                )}
                {listing.province && (
                  <div>
                    <span className="text-gray-600">Khu vực:</span> {listing.province}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">Số lượng</label>
              <QuantitySelector 
                quantity={quantity} 
                setQuantity={setQuantity}
                maxQuantity={listing.quantity}
                unit={listing.unit}
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleOrderClick}
                disabled={listing.quantity <= 0 || listing.status === 'out_of_stock'}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {listing.quantity <= 0 || listing.status === 'out_of_stock' ? 'Hết hàng' : 'Đặt hàng ngay'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Description section */}
        <div className="p-6 border-t border-gray-200">
          <h2 className="text-xl font-bold mb-4">Mô tả sản phẩm</h2>
          <div className="prose max-w-none">
            {listing.description ? (
              <p className="whitespace-pre-line">{listing.description}</p>
            ) : (
              <p className="text-gray-500 italic">Không có mô tả chi tiết</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailPage;
