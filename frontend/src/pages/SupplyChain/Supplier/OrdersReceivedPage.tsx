import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import supplyOrderService from '@/services/supply_chain/supplyOrderService';
import OrderStatusBadge from '@/components/SupplyChain/Orders/OrderStatusBadge';

const OrdersReceivedPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [orderSummary, setOrderSummary] = useState<any>({
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0
  });

  const tabs = [
    { id: 'all', label: 'Tất cả', color: 'bg-gray-100' },
    { id: 'pending', label: 'Chờ xác nhận', color: 'bg-yellow-100' },
    { id: 'confirmed', label: 'Đã xác nhận', color: 'bg-blue-100' },
    { id: 'processing', label: 'Đang xử lý', color: 'bg-indigo-100' },
    { id: 'shipped', label: 'Đang giao', color: 'bg-purple-100' },
    { id: 'delivered', label: 'Đã giao', color: 'bg-green-100' },
    { id: 'cancelled', label: 'Đã hủy', color: 'bg-red-100' }
  ];

  useEffect(() => {
    // Lấy số liệu thống kê đơn hàng
    const fetchDashboardData = async () => {
      try {
        const response = await supplyOrderService.getSupplierDashboard();
        if (response.status === "success") {
          setOrderSummary(response.data.orders || orderSummary);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const params: any = { page: currentPage, per_page: 10 };
        if (currentTab !== 'all') {
          params.status = currentTab;
        }

        const response = await supplyOrderService.getSupplierOrders(params);
        console.log('API response:', response); // Để debug
        
        if (response.status === "success") {
          // Sử dụng response.data trực tiếp vì đó là mảng orders
          setOrders(response.data || []);
          
          // Nếu không có pagination info, giả định chỉ có 1 trang
          // Hoặc có thể xử lý pagination theo cách khác dựa trên response
          setTotalPages(1); // hoặc response.meta?.total_pages || 1 nếu API trả về meta
          
          setError(null);
        } else {
          setError(response.message || 'Không thể tải danh sách đơn hàng');
        }
      } catch (err: any) {
        setError(err.message || 'Đã xảy ra lỗi khi tải đơn hàng');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [currentTab, currentPage]);

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Đơn Hàng Đã Nhận</h1>
        <Link
          to="/supplier/dashboard"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Quay lại Dashboard
        </Link>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="text-yellow-700 font-medium mb-1">Chờ xác nhận</div>
          <div className="text-2xl font-bold text-yellow-800">{orderSummary.pending || 0}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="text-blue-700 font-medium mb-1">Đang xử lý</div>
          <div className="text-2xl font-bold text-blue-800">
            {(orderSummary.confirmed || 0) + (orderSummary.processing || 0)}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="text-green-700 font-medium mb-1">Hoàn thành</div>
          <div className="text-2xl font-bold text-green-800">{orderSummary.completed || 0}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700 font-medium mb-1">Đã hủy</div>
          <div className="text-2xl font-bold text-red-800">{orderSummary.cancelled || 0}</div>
        </div>
      </div>

      {/* Tab lọc trạng thái */}
      <div className="flex overflow-x-auto border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 whitespace-nowrap font-medium text-sm border-b-2 transition-colors ${
              currentTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setCurrentTab(tab.id);
              setCurrentPage(1);
            }}
          >
            {tab.label}
            {tab.id !== 'all' && orderSummary[tab.id] ? ` (${orderSummary[tab.id]})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-700 p-8 rounded-md text-center">
          <p className="text-lg mb-2">Không có đơn hàng nào</p>
          <p>Hiện tại bạn chưa có đơn hàng nào trong mục này</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Mã đơn hàng
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Khách hàng
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ngày đặt
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tổng tiền
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Trạng thái
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      to={`/supplier/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      #{order.order_number || order.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {order.buyer?.name || 'Không có tên'}
                    </div>
                    <div className="text-sm text-gray-500">{order.buyer?.phone || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(order.created_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(parseFloat(order.total))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <Link
                      to={`/supplier/orders/${order.id}`}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-center">
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Trang trước</span>
                      &larr;
                    </button>

                    {/* Tạo danh sách các trang */}
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                      let pageNumber: number;
                      
                      // Logic để hiển thị các trang phù hợp
                      if (totalPages <= 5) {
                        pageNumber = idx + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = idx + 1;
                      } else if (currentPage > totalPages - 3) {
                        pageNumber = totalPages - 4 + idx;
                      } else {
                        pageNumber = currentPage - 2 + idx;
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border ${
                            currentPage === pageNumber
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                          } text-sm font-medium`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage >= totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <span className="sr-only">Trang sau</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersReceivedPage;
