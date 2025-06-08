import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import supplyOrderService from '@/services/supply_chain/supplyOrderService';
import OrderCard from '@/components/SupplyChain/Orders/OrderCard';

const MyOrdersPage: React.FC = () => {
  const location = useLocation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Success message from order creation
  const orderSuccess = location.state?.orderSuccess;
  const successMessage = location.state?.message;
  
  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chờ xác nhận' },
    { id: 'confirmed', label: 'Đã xác nhận' },
    { id: 'shipping', label: 'Đang giao' },
    { id: 'completed', label: 'Hoàn thành' },
    { id: 'cancelled', label: 'Đã hủy' }
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const params = activeTab !== 'all' ? { status: activeTab } : {};
        const response = await supplyOrderService.getFarmerOrders(params);
        
        if (response && response.status === "success") {
          setOrders(response.data);
          setError(null);
        } else {
          setError(response.message || 'Không thể tải danh sách đơn hàng');
        }
      } catch (err) {
        setError('Đã xảy ra lỗi khi tải đơn hàng');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [activeTab]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>
      
      {/* Success message */}
      {orderSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mb-6">
          {successMessage || 'Đặt hàng thành công!'}
        </div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`px-4 py-2 whitespace-nowrap font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-b-2 border-green-500 text-green-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Orders list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 py-12 px-4 rounded text-center">
          <p className="text-gray-600">Không có đơn hàng nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
