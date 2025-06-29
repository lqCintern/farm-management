import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Calendar, ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const getIcon = (label: string, index: number) => {
    if (index === 0) return <Home className="w-4 h-4" />;
    if (label.toLowerCase().includes('lịch') || label.toLowerCase().includes('calendar')) {
      return <Calendar className="w-4 h-4" />;
    }
    return null;
  };

  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-2 md:space-x-4">
        {items.map((item, index) => (
          <li key={index} className="inline-flex items-center">
            {index > 0 && (
              <ChevronRight className="w-5 h-5 text-gray-400 mx-2" />
            )}
            {item.path && index < items.length - 1 ? (
              <Link 
                to={item.path}
                className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-green-600 transition-colors duration-200 group"
              >
                {getIcon(item.label, index) && (
                  <span className="mr-2 group-hover:scale-110 transition-transform duration-200">
                    {getIcon(item.label, index)}
                  </span>
                )}
                {item.label}
              </Link>
            ) : (
              <span className="inline-flex items-center text-sm font-medium gradient-text">
                {getIcon(item.label, index) && (
                  <span className="mr-2">
                    {getIcon(item.label, index)}
                  </span>
                )}
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb; 