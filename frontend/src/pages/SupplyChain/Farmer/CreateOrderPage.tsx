import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import supplyListingService from '@/services/supply_chain/supplyListingService';
import supplyOrderService from '@/services/supply_chain/supplyOrderService';
import fieldService from '@/services/farming/fieldService';
import { getUserProfile } from '@/services/users/authService';
import QuantitySelector from '@/components/SupplyChain/Common/QuantitySelector';

const CreateOrderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const preloadedListing = location.state?.listing;
  const preloadedQuantity = location.state?.quantity || 1;

  const [listing, setListing] = useState<any>(preloadedListing || null);
  const [loading, setLoading] = useState<boolean>(!preloadedListing);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [fields, setFields] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  const [orderForm, setOrderForm] = useState({
    quantity: preloadedQuantity,
    note: '',
    delivery_field_id: '',
    contact_phone: '',
    payment_method: 'cod',
  });

  // Fetch listing if not preloaded
  useEffect(() => {
    const fetchListing = async () => {
      if (preloadedListing) return;
      if (!id) return;

      setLoading(true);
      try {
        const response = await supplyListingService.getListingById(parseInt(id));
        if (response && response.status === 'success') {
          setListing(response.data);
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
  }, [id, preloadedListing]);

  // Fetch user profile and fields
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profileResponse = await getUserProfile();
        setUserProfile(profileResponse);

        const fieldsResponse = await fieldService.getFields();
        if (fieldsResponse && fieldsResponse.data) {
          setFields(fieldsResponse.data.map((field: any) => ({
            id: field.id,
            name: field.name,
            area: field.area,
            coordinates: field.coordinates,
            // Lấy thông tin địa chỉ từ location (nếu có)
            province: field.location?.split(', ')[2] || '',
            district: field.location?.split(', ')[1] || '',
            ward: field.location?.split(', ')[0] || '',
            address: field.description || field.location || '',
          })));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Không thể tải thông tin người dùng hoặc danh sách cánh đồng.');
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setOrderForm(prev => ({ ...prev, [name]: value }));
  };

  const handleQuantityChange = (quantity: number) => {
    setOrderForm(prev => ({ ...prev, quantity }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!listing) return;

    // Chuyển đổi delivery_field_id từ string sang number để so sánh
    const selectedField = fields.find(field => field.id === parseInt(orderForm.delivery_field_id));

    if (!selectedField) {
      setError('Vui lòng chọn cánh đồng giao hàng hợp lệ.');
      return;
    }

    // Tính toán tọa độ trung tâm từ coordinates
    const centerCoordinates = calculateCenter(selectedField.coordinates);
    
    // Tạo địa chỉ kết hợp với tọa độ
    const combinedAddress = selectedField.address || userProfile?.address || '';
    const addressWithCoordinates = `${combinedAddress} [Lat: ${centerCoordinates.lat.toFixed(6)}, Lng: ${centerCoordinates.lng.toFixed(6)}]`;

    setSubmitting(true);
    try {
      // Chỉ gửi các tham số được phép
      const orderData = {
        supply_listing_id: listing.id,
        supply_order: {
          quantity: orderForm.quantity,
          note: orderForm.note,
          price: listing.price,
          delivery_province: selectedField.province || '',
          delivery_district: selectedField.district || '',
          delivery_ward: selectedField.ward || '',
          delivery_address: addressWithCoordinates, // Kết hợp địa chỉ và tọa độ
          contact_phone: orderForm.contact_phone || userProfile?.phone || '',
          payment_method: orderForm.payment_method,
        },
      };

      const response = await supplyOrderService.createOrder(orderData);

      if (response && response.status === 'success') {
        navigate('/farmer/orders', {
          state: {
            orderSuccess: true,
            message: 'Đặt hàng thành công!',
          },
        });
      } else {
        setError(response.message || 'Không thể đặt hàng');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi đặt hàng');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateCenter = (coordinates: { lat: number; lng: number }[]): { lat: number; lng: number } => {
    if (coordinates.length === 0) return { lat: 0, lng: 0 };

    const total = coordinates.reduce(
      (acc, coord) => {
        acc.lat += coord.lat;
        acc.lng += coord.lng;
        return acc;
      },
      { lat: 0, lng: 0 }
    );

    return {
      lat: total.lat / coordinates.length,
      lng: total.lng / coordinates.length,
    };
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
      <h1 className="text-2xl font-bold mb-6">Đặt hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-medium mb-6">Thông tin đặt hàng</h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Delivery field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn cánh đồng giao hàng *
                  </label>
                  <select
                    name="delivery_field_id"
                    value={orderForm.delivery_field_id}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-md border border-gray-300 py-2 px-3"
                  >
                    <option value="">Chọn cánh đồng</option>
                    {fields.map(field => (
                      <option key={field.id} value={field.id}>
                        {field.name} - {field.area} ha
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contact phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại liên hệ *
                  </label>
                  <input
                    type="tel"
                    name="contact_phone"
                    value={orderForm.contact_phone || userProfile?.phone || ''}
                    onChange={handleInputChange}
                    required
                    pattern="[0-9]{10}"
                    className="w-full rounded-md border border-gray-300 py-2 px-3"
                  />
                </div>

                {/* Payment method */}
                <div>
                  <h3 className="font-medium mb-3">Phương thức thanh toán</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payment_method"
                        value="cod"
                        checked={orderForm.payment_method === 'cod'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Thanh toán khi nhận hàng (COD)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payment_method"
                        value="bank_transfer"
                        checked={orderForm.payment_method === 'bank_transfer'}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      Chuyển khoản ngân hàng
                    </label>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    name="note"
                    value={orderForm.note}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 py-2 px-3"
                    rows={3}
                    placeholder="Nhập ghi chú nếu cần..."
                  />
                </div>

                {/* Center coordinates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tọa độ trung tâm
                  </label>
                  {orderForm.delivery_field_id && (
                    <>
                      <p className="text-gray-600">
                        {(() => {
                          const selectedField = fields.find(field => field.id === parseInt(orderForm.delivery_field_id));
                          if (selectedField?.coordinates) {
                            const center = calculateCenter(selectedField.coordinates);
                            return `Lat: ${center.lat.toFixed(6)}, Lng: ${center.lng.toFixed(6)}`;
                          }
                          return 'Không có dữ liệu tọa độ';
                        })()}
                      </p>
                      
                      {(() => {
                        const selectedField = fields.find(field => field.id === parseInt(orderForm.delivery_field_id));
                        if (selectedField?.coordinates) {
                          const center = calculateCenter(selectedField.coordinates);
                          const mapsUrl = `https://www.google.com/maps?q=${center.lat},${center.lng}`;
                          
                          return (
                            <a 
                              href={mapsUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm flex items-center mt-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              Xem trên Google Maps
                            </a>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Đang xử lý...' : 'Hoàn tất đặt hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h2 className="text-xl font-medium mb-4">Thông tin đơn hàng</h2>

            <div className="flex items-start mb-4">
              {listing.main_image ? (
                <img
                  src={listing.main_image}
                  alt={listing.name}
                  className="w-16 h-16 object-cover rounded mr-3"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded mr-3" />
              )}
              <div>
                <h3 className="font-medium line-clamp-2">{listing.name}</h3>
                <p className="text-sm text-gray-500">{listing.category}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng
                </label>
                <QuantitySelector
                  quantity={orderForm.quantity}
                  setQuantity={handleQuantityChange}
                  maxQuantity={listing.quantity}
                  unit={listing.unit}
                />
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Giá:</span>
                  <span>{listing.price.toLocaleString()} đ/{listing.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số lượng:</span>
                  <span>{orderForm.quantity} {listing.unit}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between items-center font-bold">
                    <span>Tổng tiền:</span>
                    <span className="text-red-600 text-xl">
                      {(listing.price * orderForm.quantity).toLocaleString()} đ
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderPage;
