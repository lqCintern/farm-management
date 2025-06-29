import { Link, useLocation } from 'react-router-dom';

const LaborNavigation = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/labor',
      label: 'Tổng quan',
      icon: '📊'
    },
    {
      path: '/labor/my-requests',
      label: 'Yêu cầu của tôi',
      icon: '📋'
    },
    {
      path: '/labor/participated-requests',
      label: 'Đã tham gia',
      icon: '🤝'
    },
    {
      path: '/labor/public-requests',
      label: 'Tìm yêu cầu',
      icon: '🔍'
    },
    {
      path: '/labor/requests',
      label: 'Tất cả yêu cầu',
      icon: '📝'
    },
    {
      path: '/labor/assignments',
      label: 'Phân công',
      icon: '👥'
    },
    {
      path: '/labor/exchanges',
      label: 'Đổi công',
      icon: '⚖️'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/labor') {
      return location.pathname === '/labor';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="bg-white shadow-sm border-b mb-6">
      <div className="container mx-auto px-4">
        <nav className="flex space-x-8 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                isActive(item.path)
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default LaborNavigation; 