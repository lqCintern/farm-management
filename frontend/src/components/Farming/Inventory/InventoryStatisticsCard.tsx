import React from 'react';
import { 
  Box, AlertTriangle, XCircle, Tag, TrendingUp, 
  TrendingDown, DollarSign, Calendar
} from 'react-feather';

interface InventoryStatisticsCardProps {
  title: string;
  value: number | string;
  icon: string;
  colorClass: string;
  subtitle?: string;
}

const InventoryStatisticsCard: React.FC<InventoryStatisticsCardProps> = ({ 
  title, 
  value, 
  icon, 
  colorClass,
  subtitle 
}) => {
  
  const renderIcon = () => {
    switch (icon) {
      case 'box':
        return <Box size={24} />;
      case 'alert-triangle':
        return <AlertTriangle size={24} />;
      case 'x-circle':
        return <XCircle size={24} />;
      case 'tag':
        return <Tag size={24} />;
      case 'trending-up':
        return <TrendingUp size={24} />;
      case 'trending-down':
        return <TrendingDown size={24} />;
      case 'dollar-sign':
        return <DollarSign size={24} />;
      case 'calendar':
        return <Calendar size={24} />;
      default:
        return <Box size={24} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="flex items-center">
        <div className={`p-2 rounded-md ${colorClass}`}>
          {renderIcon()}
        </div>
        <div className="ml-4">
          <h4 className="text-gray-500 text-sm font-medium">{title}</h4>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {subtitle && (
              <p className="ml-2 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryStatisticsCard;