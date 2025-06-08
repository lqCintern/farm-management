import React from 'react';

interface CategoryBadgeProps {
  category: string;
}

const getCategoryConfig = (category: string) => {
  const categories: Record<string, {color: string, label: string}> = {
    fertilizer: { color: 'bg-green-100 text-green-800', label: 'Phân bón' },
    pesticide: { color: 'bg-red-100 text-red-800', label: 'Thuốc BVTV' },
    seed: { color: 'bg-yellow-100 text-yellow-800', label: 'Hạt giống' },
    tool: { color: 'bg-blue-100 text-blue-800', label: 'Công cụ' },
    equipment: { color: 'bg-purple-100 text-purple-800', label: 'Thiết bị' },
    default: { color: 'bg-gray-100 text-gray-800', label: category }
  };
  
  return categories[category] || categories.default;
};

const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const { color, label } = getCategoryConfig(category);
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
};

export default CategoryBadge;
