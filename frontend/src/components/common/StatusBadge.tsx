import React from 'react';

interface StatusBadgeProps {
  status: string;
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
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const config = statusConfig[status] || {
    label: status || 'Không xác định',
    color: 'bg-gray-100 text-gray-800'
  };
  
  const { label, color } = config;
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color} ${className}`}>
      {label}
    </span>
  );
};

export default StatusBadge;