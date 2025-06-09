import React from 'react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionButton?: ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionButton,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-500 text-center mb-6 max-w-md">{description}</p>}
      {actionButton && <div>{actionButton}</div>}
    </div>
  );
};

export default EmptyState;
