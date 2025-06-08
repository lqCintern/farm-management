import React from 'react';

interface OrderStatusBadgeProps {
  status: string;
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', label: 'Chờ xác nhận' };
      case 'confirmed':
        return { color: 'bg-blue-100 text-blue-800', label: 'Đã xác nhận' };
      case 'processing':
        return { color: 'bg-indigo-100 text-indigo-800', label: 'Đang chuẩn bị hàng' };
      case 'shipping':
        return { color: 'bg-purple-100 text-purple-800', label: 'Đang giao hàng' };
      case 'delivered':
        return { color: 'bg-cyan-100 text-cyan-800', label: 'Đã giao hàng' };
      case 'completed':
        return { color: 'bg-green-100 text-green-800', label: 'Hoàn thành' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', label: 'Đã hủy' };
      case 'rejected':
        return { color: 'bg-gray-100 text-gray-800', label: 'Bị từ chối' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: status };
    }
  };

  const { color, label } = getStatusConfig();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};

export default OrderStatusBadge;
