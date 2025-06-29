import React from 'react';

interface StatusBadgeProps {
  status: string;
  color?: string;
  children?: React.ReactNode;
  className?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  assigned: {
    label: 'Đã phân công',
    color: 'bg-blue-100 text-blue-800',
  },
  worker_reported: {
    label: 'Chờ xác nhận',
    color: 'bg-yellow-100 text-yellow-800',
  },
  completed: {
    label: 'Hoàn thành',
    color: 'bg-green-100 text-green-800',
  },
  missed: {
    label: 'Vắng mặt',
    color: 'bg-gray-100 text-gray-800',
  },
  rejected: {
    label: 'Từ chối',
    color: 'bg-red-100 text-red-800',
  },
  pending: {
    label: 'Chờ phản hồi',
    color: 'bg-yellow-100 text-yellow-800',
  },
  accepted: {
    label: 'Đã chấp nhận',
    color: 'bg-green-100 text-green-800',
  },
  declined: {
    label: 'Đã từ chối',
    color: 'bg-red-100 text-red-800',
  },
  cancelled: {
    label: 'Đã hủy',
    color: 'bg-gray-100 text-gray-800',
  },
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  color: customColor, 
  children, 
  className = '' 
}) => {
  const config = statusConfig[status] || {
    label: status || 'Không xác định',
    color: 'bg-gray-100 text-gray-800'
  };
  
  const { label, color: defaultColor } = config;
  const finalColor = customColor || defaultColor;
  const displayText = children || label;
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${finalColor} ${className}`}>
      {displayText}
    </span>
  );
};

export default StatusBadge;