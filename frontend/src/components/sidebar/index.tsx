import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { routes } from '@/constants';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ApartmentOutlined,
  ShopOutlined,
  AreaChartOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  SettingOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  FileTextOutlined,
  HomeOutlined,
  BarChartOutlined,
  MessageOutlined,
  ToolOutlined,
  PhoneOutlined,
  DashboardOutlined,
  CloudOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import '@/styles/sidebar.css';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: { title: string; path: string }[];
  allowedUsers?: string[];
  category?: string; // Thêm trường phân loại menu
}

interface NavItemProps {
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: { title: string; path: string }[];
  userType?: string | null;
  allowedUsers?: string[];
  collapsed: boolean;
  category?: string;
}

const NavItem = ({ title, icon, path, children, userType, allowedUsers, collapsed, category }: NavItemProps) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  if (allowedUsers && userType && !allowedUsers.includes(userType)) {
    return null;
  }
  
  const isActive = path 
    ? location.pathname === path || location.pathname.startsWith(path + '/')
    : children?.some(child => 
        location.pathname === child.path || location.pathname.startsWith(child.path + '/')
      );
  
  useEffect(() => {
    if (children && !isOpen) {
      const hasActiveChild = children.some(child => 
        location.pathname === child.path || 
        location.pathname.startsWith(child.path + '/')
      );
      
      if (hasActiveChild) {
        setIsOpen(true);
      }
    }
  }, [location.pathname, children]);
  
  return (
    <li>
      {/* Nếu có sub-menu */}
      {children ? (
        <>
          <div 
            className={`side-nav-item flex items-center justify-between px-3 py-2.5 mb-1 cursor-pointer rounded-lg transition-all duration-200 ${
              isActive 
                ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center">
              <Tooltip title={collapsed ? title : ''} placement="right">
                <span className={`text-lg ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {icon}
                </span>
              </Tooltip>
              {!collapsed && <span className="ml-3 truncate">{title}</span>}
            </div>
            {!collapsed && (
              <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
          </div>
          
          {/* Sub-menu with animation */}
          <div className={`overflow-hidden transition-all duration-300 ${
            isOpen && !collapsed ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <ul className="pl-2 pr-1 ml-4 border-l-2 border-gray-200 space-y-1 py-1">
              {children.map((child, index) => {
                const isChildActive = location.pathname === child.path || location.pathname.startsWith(child.path + '/');
                return (
                  <li key={index}>
                    <Link 
                      to={child.path}
                      className={`side-nav-item block px-3 py-2 text-sm rounded-md transition-all duration-200 truncate ${
                        isChildActive 
                          ? 'bg-green-50 text-green-700 font-medium' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {child.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      ) : (
        /* Nếu không có sub-menu */
        <Tooltip title={collapsed ? title : ''} placement="right">
          <Link 
            to={path || '#'}
            className={`side-nav-item flex items-center px-3 py-2.5 mb-1 rounded-lg transition-all duration-200 ${
              isActive 
                ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 font-medium shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span className={`text-lg ${isActive ? 'text-green-600' : 'text-gray-500'}`}>{icon}</span>
            {!collapsed && <span className="ml-3 truncate">{title}</span>}
          </Link>
        </Tooltip>
      )}
    </li>
  );
};

interface SideNavigationProps {
  userType: string | null;
  onToggle?: (collapsed: boolean) => void;
}

export default function SideNavigation({ userType, onToggle }: SideNavigationProps) {
  const [collapsed, setCollapsed] = useState(false);
  
  useEffect(() => {
    if (onToggle) {
      onToggle(collapsed);
    }
  }, [collapsed, onToggle]);

  // Cấu trúc menu cho farmer
  const farmerMenuItems: MenuItem[] = [
    {
      title: 'Trang chủ',
      icon: <HomeOutlined />,
      children: [
        { title: 'Lịch trình', path: '/calendar' },
        { title: 'Trò chuyện', path: '/chat' },
        { title: 'Theo dõi cánh đồng', path: '/fields' },
        { title: 'Các mùa vụ', path: '/pineapple' },
        { title: 'Thống kê', path: '/farmer/statistics' },
      ],
      category: 'general'
    },
    {
      title: 'Hoạt động',
      icon: <CheckCircleOutlined />,
      children: [
        { title: 'Hoạt động', path: '/farm-activities' },
        { title: 'Quy trình chung', path: '/activity-templates' },
      ],
      category: 'farming'
    },
    {
      title: 'Vật tư nông nghiệp',
      icon: <ToolOutlined />,
      children: [
        { title: 'Tìm mua vật tư', path: '/farmer/listings' },
        { title: 'Đơn hàng vật tư', path: '/farmer/orders' },
        { title: 'Kho', path: '/farmer/inventory' },
      ],
      category: 'supply'
    },
    {
      title: 'Sản phẩm',
      icon: <ShopOutlined />,
      children: [
        { title: 'Tạo sản phẩm', path: '/products/create' },
        { title: 'Danh sách sản phẩm', path: '/products' },
        { title: 'Đơn đặt hàng', path: '/orders' },
      ],
      category: 'market'
    },
    {
      title: 'Đổi công',
      icon: <TeamOutlined />,
      children: [
        { title: 'Tổng quan', path: '/labor' },
        { title: 'Yêu cầu đổi công', path: '/labor/requests' },
        { title: 'Tạo yêu cầu đổi công', path: '/labor/requests/create' },
        { title: 'Yêu cầu công khai', path: '/labor/public-requests' },
        { title: 'Đổi công với hộ khác', path: '/labor/exchanges' },
        { title: 'Phân công lao động', path: '/labor/assignments' },
        { title: 'Phân công nông trại', path: '/labor/farm-assignments' },
        { title: 'Thống kê đổi công', path: '/labor/assignment-stats' },
      ],
      category: 'labor'
    },
    {
      title: 'Thời tiết',
      icon: <CloudOutlined />,
      children: [
        { title: 'Dự báo thời tiết', path: '/climate' },
      ],
      category: 'support'
    },
    {
      title: 'Liên hệ',
      icon: <PhoneOutlined />,
      children: [
        { title: 'Liên hệ', path: '/contact' },
        { title: 'Địa điểm', path: '/location' },
      ],
      category: 'support'
    },
  ];

  // Cấu trúc menu cho supplier
  const supplierMenuItems: MenuItem[] = [
    {
      title: 'Bảng điều khiển',
      icon: <DashboardOutlined />,
      children: [
        { title: 'Tổng quan', path: '/supplier/dashboard' },
      ],
      category: 'general'
    },
    {
      title: 'Quản lý vật tư',
      icon: <ToolOutlined />,
      children: [
        { title: 'Danh sách vật tư', path: '/supplier/listings' },
        { title: 'Tạo vật tư mới', path: '/supplier/listings/create' },
      ],
      category: 'supply'
    },
    {
      title: 'Đơn hàng',
      icon: <ShoppingCartOutlined />,
      children: [
        { title: 'Đơn hàng nhận được', path: '/supplier/orders' },
      ],
      category: 'market'
    },
    {
      title: 'Thời tiết',
      icon: <CloudOutlined />,
      children: [
        { title: 'Dự báo thời tiết', path: '/climate' },
      ],
      category: 'support'
    },
    {
      title: 'Liên hệ',
      icon: <PhoneOutlined />,
      children: [
        { title: 'Liên hệ', path: '/contact' },
        { title: 'Địa điểm', path: '/location' },
      ],
      category: 'support'
    },
  ];

  // Cấu trúc menu cho trader
  const traderMenuItems: MenuItem[] = [
    {
      title: 'Trang chủ',
      icon: <HomeOutlined />,
      children: [
        { title: 'Trang chủ', path: '/calendar' },
        { title: 'Trò chuyện', path: '/chat' },
      ],
      category: 'general'
    },
    {
      title: 'Hoạt động',
      icon: <CheckCircleOutlined />,
      children: [
        { title: 'Hoạt động nông trại', path: '/farm-activities' },
      ],
      category: 'farming'
    },
    {
      title: 'Cửa hàng',
      icon: <ShopOutlined />,
      children: [
        { title: 'Chợ', path: '/products' },
        { title: 'Danh mục', path: '/categories' },
      ],
      category: 'market'
    },
    {
      title: 'Thời tiết',
      icon: <CloudOutlined />,
      children: [
        { title: 'Dự báo thời tiết', path: '/climate' },
      ],
      category: 'support'
    },
    {
      title: 'Liên hệ',
      icon: <PhoneOutlined />,
      children: [
        { title: 'Liên hệ', path: '/contact' },
        { title: 'Địa điểm', path: '/location' },
      ],
      category: 'support'
    },
  ];

  const getMenuItems = (): MenuItem[] => {
    switch (userType) {
      case 'farmer':
        return farmerMenuItems;
      case 'supplier':
        return supplierMenuItems;
      case 'trader':
        return traderMenuItems;
      default:
        return farmerMenuItems;
    }
  };

  const menuItems: MenuItem[] = getMenuItems();

  // Nhóm các menu items theo category
  const groupedMenuItems = menuItems.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Thứ tự hiển thị các category
  const categoryOrder = ['general', 'farming', 'supply', 'market', 'labor', 'support', 'other'];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else if (window.innerWidth >= 1200) {
        setCollapsed(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const mainContent = document.querySelector('.ml-64');
    if (mainContent) {
      if (collapsed) {
        mainContent.classList.remove('ml-64');
        mainContent.classList.add('ml-16');
      } else {
        mainContent.classList.remove('ml-16');
        mainContent.classList.add('ml-64');
      }
    }
    
    const navbar = document.querySelector('header');
    if (navbar) {
      if (collapsed) {
        navbar.classList.remove('left-64');
        navbar.classList.add('left-16');
      } else {
        navbar.classList.remove('left-16');
        navbar.classList.add('left-64');
      }
    }
  }, [collapsed]);

  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  // Chuyển đổi userType sang tên hiển thị
  const getUserTypeDisplay = () => {
    switch (userType) {
      case 'farmer': return 'Nông dân';
      case 'supplier': return 'Nhà cung cấp';
      case 'trader': return 'Thương lái';
      default: return 'Người dùng';
    }
  };

  return (
    <div 
      className={`side-nav border-r border-gray-200 bg-white min-h-screen fixed top-0 left-0 transition-all duration-300 shadow-sm ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo và header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-3">
        <div className="flex items-center">
          {/* Logo - luôn hiển thị */}
          <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-md flex items-center justify-center text-white font-bold mr-2">
            PF
          </div>
          
          {/* Tên app - chỉ hiển thị khi không collapse */}
          {!collapsed && (
            <div>
              <h2 className="text-base font-semibold text-gray-800 m-0 leading-tight">PineFarm</h2>
              <p className="text-xs text-gray-500 m-0">{getUserTypeDisplay()}</p>
            </div>
          )}
        </div>
        
        <Button 
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={handleToggle}
          className="text-gray-500 hover:text-green-600 hover:bg-green-50"
        />
      </div>
      
      {/* Navigation menu - thay đổi ở đây */}
      <nav className="overflow-y-auto h-[calc(100vh-4rem)] px-2 py-3 no-scrollbar">
        {categoryOrder.map((category) => {
          const items = groupedMenuItems[category];
          if (!items || items.length === 0) return null;
          
          return (
            <div key={category} className="mb-4">
              {/* Category label khi không collapsed */}
              {!collapsed && (
                <div className="px-3 py-1 text-xs font-semibold uppercase text-gray-500 tracking-wider">
                  {category === 'general' && 'Chung'}
                  {category === 'farming' && 'Canh tác'}
                  {category === 'supply' && 'Vật tư'}
                  {category === 'market' && 'Thị trường'}
                  {category === 'labor' && 'Lao động'}
                  {category === 'support' && 'Hỗ trợ'}
                  {category === 'other' && 'Khác'}
                </div>
              )}
              
              {/* Category divider khi collapsed */}
              {collapsed && (
                <div className="mx-2 mb-2 border-t border-gray-200"></div>
              )}
              
              {/* Menu items trong category */}
              <ul className="space-y-1">
                {items.map((item, index) => (
                  <NavItem
                    key={index}
                    title={item.title}
                    icon={item.icon}
                    path={item.path}
                    children={item.children}
                    userType={userType}
                    allowedUsers={item.allowedUsers}
                    collapsed={collapsed}
                    category={item.category}
                  />
                ))}
              </ul>
            </div>
          );
        })}

        {/* User profile */}
        <div className="mt-auto pt-4 border-t border-gray-200 mx-2">
          <div className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
              {userType?.charAt(0).toUpperCase() || 'U'}
            </div>
            
            {!collapsed && (
              <div className="ml-2 truncate">
                <div className="text-sm font-medium text-gray-700 truncate">
                  {getUserTypeDisplay()}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  Cài đặt tài khoản
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}