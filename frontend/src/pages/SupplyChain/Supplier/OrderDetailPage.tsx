import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import supplyOrderService from '../../../services/supply_chain/supplyOrderService';
import OrderStatusBadge from '@/components/SupplyChain/Orders/OrderStatusBadge';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showReasonInput, setShowReasonInput] = useState<boolean>(false);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const response = await supplyOrderService.getSupplierOrderById(parseInt(id));
        if (response.status === "success") {
          setOrder(response.data);
          setNewStatus(response.data.status);
          setError(null);
        } else {
          setError(response.message || 'Không thể tải thông tin đơn hàng');
        }
      } catch (err: any) {
        setError(err.message || 'Đã xảy ra lỗi khi tải đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [id]);

  const handleStatusChange = async () => {
    if (newStatus === order.status) return;

    setUpdating(true);
    try {
      const response = await supplyOrderService.updateOrderStatus(
        parseInt(id!),
        newStatus,
        // Gửi lý do khi từ chối hoặc hủy
        (newStatus === 'rejected' || newStatus === 'cancelled') ? rejectionReason : undefined
      );

      if (response.success) {
        setOrder({ ...order, status: newStatus });
        setShowReasonInput(false);
        setRejectionReason('');
        // Hiển thị thông báo thành công
        alert('Cập nhật trạng thái đơn hàng thành công');
      } else {
        setError(response.message || 'Không thể cập nhật trạng thái đơn hàng');
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi khi cập nhật đơn hàng');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return value?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) || '0 ₫';
  };

  // Danh sách trạng thái cho phép chuyển đổi dựa trên trạng thái hiện tại
  const getAvailableStatuses = () => {
    switch (order?.status) {
      case 'pending':
        return [
          { value: 'pending', label: 'Chờ xác nhận' },
          { value: 'confirmed', label: 'Xác nhận' },
          { value: 'rejected', label: 'Từ chối' },
          { value: 'cancelled', label: 'Hủy đơn' }
        ];
      case 'confirmed':
        return [
          { value: 'confirmed', label: 'Đã xác nhận' },
          { value: 'shipped', label: 'Đang giao hàng' },
          { value: 'cancelled', label: 'Hủy đơn' }
        ];
      case 'shipped':
        return [
          { value: 'shipped', label: 'Đang giao hàng' },
          { value: 'delivered', label: 'Đã giao hàng' },
          { value: 'cancelled', label: 'Hủy đơn' }
        ];
      case 'delivered':
        return [
          { value: 'delivered', label: 'Đã giao hàng' },
          { value: 'completed', label: 'Hoàn thành' }
        ];
      case 'completed':
        return [{ value: 'completed', label: 'Hoàn thành' }]; 
      case 'cancelled':
        return [{ value: 'cancelled', label: 'Đã hủy' }];
      case 'rejected':
        return [{ value: 'rejected', label: 'Đã từ chối' }];
      default:
        return [{ value: order?.status, label: order?.status }];
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p className="font-medium">{error || 'Không tìm thấy đơn hàng'}</p>
          <button
            onClick={() => navigate('/supplier/orders')}
            className="mt-4 bg-white border border-red-300 text-red-600 px-4 py-2 rounded hover:bg-red-50"
          >
            Quay lại danh sách đơn hàng
          </button>
        </div>
      </div>
    );
  }

  const canUpdateStatus = ['pending', 'confirmed', 'shipped', 'delivered'].includes(order.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Chi Tiết Đơn Hàng #{order.order_number || order.id}</h1>
        <div>
          <Link
            to="/supplier/orders"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 mr-2 px-4 py-2 rounded"
          >
            Quay lại danh sách
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thông tin đơn hàng */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="font-medium text-lg">Thông tin đơn hàng</h2>
            </div>
            
            <div className="px-6 py-4">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-sm text-gray-600">Ngày đặt hàng</p>
                  <p className="font-medium">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái</p>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              <div className="border-t border-gray-200 my-4"></div>

              <h3 className="font-medium mb-3">Sản phẩm</h3>
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <div className="flex-shrink-0 w-16 h-16">
                    <img
                      src={order.supply_listing?.image || '/images/placeholder-product.png'}
                      alt={order.supply_listing?.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium">{order.supply_listing?.name}</p>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>
                        {formatCurrency(parseFloat(order.price || 0))} x {order.quantity}{' '}
                        {order.supply_listing?.unit || 'cái'}
                      </span>
                      <span>{formatCurrency(parseFloat(order.total || 0))}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 my-4"></div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(order.total || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phí vận chuyển</span>
                  <span>{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between font-medium text-lg">
                  <span>Tổng cộng</span>
                  <span className="text-red-600">{formatCurrency(order.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Thông tin khách hàng và giao hàng */}
        <div className="space-y-6">
          {/* Thông tin khách hàng */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="font-medium text-lg">Thông tin khách hàng</h2>
            </div>
            <div className="px-6 py-4">
              <p className="font-medium">{order.buyer?.name || 'Không có tên'}</p>
              <p className="text-sm text-gray-600 mt-2">
                <span className="inline-block w-24">SĐT:</span> {order.buyer?.phone || 'Không có'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="inline-block w-24">Email:</span> {order.buyer?.email || 'Không có'}
              </p>
            </div>
          </div>

          {/* Địa chỉ giao hàng */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h2 className="font-medium text-lg">Địa chỉ giao hàng</h2>
            </div>
            <div className="px-6 py-4">
              <p>
                {order.buyer?.name || 'Không có tên'}
                {order.contact_phone ? ` - ${order.contact_phone}` : ''}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {order.delivery_address || 'Không có địa chỉ'}
                {order.delivery_ward && `, ${order.delivery_ward}`}
                {order.delivery_district && `, ${order.delivery_district}`}
                {order.delivery_province && `, ${order.delivery_province}`}
              </p>
              
              {/* Hiển thị bản đồ nếu có tọa độ trong delivery_address */}
              {order.delivery_address && order.delivery_address.includes('[Lat:') && (
                <div className="mt-3">
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_address.match(/Lat: ([\d.]+), Lng: ([\d.]+)/)?.[1]},${order.delivery_address.match(/Lat: ([\d.]+), Lng: ([\d.]+)/)?.[2]}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Xem trên Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Cập nhật trạng thái */}
          {canUpdateStatus && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="font-medium text-lg">Cập nhật trạng thái</h2>
              </div>
              <div className="px-6 py-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái đơn hàng
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => {
                      const status = e.target.value;
                      setNewStatus(status);
                      // Hiển thị input lý do khi từ chối hoặc hủy đơn
                      setShowReasonInput(status === 'rejected' || status === 'cancelled');
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getAvailableStatuses().map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                {showReasonInput && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newStatus === 'rejected' ? 'Lý do từ chối' : 'Lý do hủy đơn'}
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder={newStatus === 'rejected' 
                        ? "Nhập lý do từ chối đơn hàng" 
                        : "Nhập lý do hủy đơn hàng"}
                    ></textarea>
                  </div>
                )}

                <button
                  onClick={handleStatusChange}
                  disabled={
                    updating || 
                    newStatus === order.status || 
                    ((newStatus === 'rejected' || newStatus === 'cancelled') && !rejectionReason)
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-md"
                >
                  {updating ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    'Cập nhật trạng thái'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Ghi chú */}
          {order.note && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="font-medium text-lg">Ghi chú</h2>
              </div>
              <div className="px-6 py-4">
                <p className="text-gray-700">{order.note}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
