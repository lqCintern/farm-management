import React from 'react';
import { Link } from 'react-router-dom';
import { SupplyOrder } from '@/services/supply_chain/supplyOrderService';
import OrderStatusBadge from './OrderStatusBadge';

interface OrderCardProps {
  order: SupplyOrder;
  isFarmerView?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, isFarmerView = true }) => {
  const routePrefix = isFarmerView 
    ? '/farmer/orders' 
    : '/supply-chain/supplier/orders';
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };
  
  return (
    <Link 
      to={`${routePrefix}/${order.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
    >
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <p className="font-medium">Đơn hàng #{order.id}</p>
          <p className="text-sm text-gray-500">Ngày đặt: {formatDate(order.created_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      
      <div className="p-4">
        <p className="font-medium mb-2 line-clamp-1">{order.name}</p>
        <div className="flex justify-between text-sm">
          <div>
            <p><span className="text-gray-600">Số lượng:</span> {order.quantity} {order.unit}</p>
            <p><span className="text-gray-600">Danh mục:</span> {order.category}</p>
          </div>
          <div className="text-right">
            <p className="font-bold text-red-600">{(order.price * order.quantity).toLocaleString()} VNĐ</p>
            <p className="text-blue-600 mt-2">Xem chi tiết</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default OrderCard;
