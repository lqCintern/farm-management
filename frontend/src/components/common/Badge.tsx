import React from 'react';

interface BadgeProps {
  label: string;
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'gray' | 'purple' | 'amber';
  size?: 'small' | 'medium';
}

const Badge: React.FC<BadgeProps> = ({ label, color = 'blue', size = 'small' }) => {
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    gray: 'bg-gray-100 text-gray-800',
    purple: 'bg-purple-100 text-purple-800',
    amber: 'bg-amber-100 text-amber-800',
  };
  
  const sizeClasses = {
    small: 'px-2.5 py-0.5 text-xs',
    medium: 'px-3 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClasses[color]} ${sizeClasses[size]}`}>
      {label}
    </span>
  );
};

export default Badge;