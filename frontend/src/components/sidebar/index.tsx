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
} from '@ant-design/icons';
import { Button } from 'antd';

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: { title: string; path: string }[];
  allowedUsers?: string[];
}

interface NavItemProps {
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: { title: string; path: string }[];
  userType?: string | null;
  allowedUsers?: string[];
  collapsed: boolean;
}

const NavItem = ({ title, icon, path, children, userType, allowedUsers, collapsed }: NavItemProps) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  // Kiểm tra xem menu này có được hiển thị cho loại người dùng không
  if (allowedUsers && userType && !allowedUsers.includes(userType)) {
    return null;
  }
  
  // Kiểm tra xem đường dẫn hiện tại có khớp với path hoặc path của children không
  const isActive = path 
    ? location.pathname === path || location.pathname.startsWith(path + '/')
    : children?.some(child => 
        location.pathname === child.path || location.pathname.startsWith(child.path + '/')
      );
  
  // Xác định các class CSS phù hợp
  const activeClass = isActive ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-50';
  
  useEffect(() => {
    // Tự động mở menu nếu một trong các submenu của nó đang active
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
            className={`flex items-center justify-between px-4 py-3 cursor-pointer ${activeClass} rounded-md`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center">
              <span className="mr-3 text-lg">{icon}</span>
              {!collapsed && <span className="font-medium">{title}</span>}
            </div>
            {!collapsed && (
              <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                <svg width="12" height="6" viewBox="0 0 12 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L6 5L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            )}
          </div>
          
          {/* Sub-menu */}
          {isOpen && !collapsed && (
            <ul className="ml-7 mt-1 space-y-1">
              {children.map((child, index) => (
                <li key={index}>
                  <Link 
                    to={child.path}
                    className={`block px-4 py-2 text-sm rounded-md ${location.pathname === child.path ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {child.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        /* Nếu không có sub-menu */
        <Link 
          to={path || '#'}
          className={`flex items-center px-4 py-3 rounded-md ${activeClass}`}
        >
          <span className="mr-3 text-lg">{icon}</span>
          {!collapsed && <span className="font-medium">{title}</span>}
        </Link>
      )}
    </li>
  );
};

interface SideNavigationProps {
  userType: string | null;
  onToggle?: (collapsed: boolean) => void; // Thêm callback function này
}

export default function SideNavigation({ userType, onToggle }: SideNavigationProps) {
  const [collapsed, setCollapsed] = useState(false);
  
  // Thêm useEffect để thông báo trạng thái collapsed lên MainLayout
  useEffect(() => {
    if (onToggle) {
      onToggle(collapsed);
    }
  }, [collapsed, onToggle]);

  // Cập nhật cấu trúc menu cho phù hợp với navlinks.tsx

  // Cấu trúc menu cho farmer
  const farmerMenuItems: MenuItem[] = [
    {
      title: 'Home',
      icon: <HomeOutlined />,
      children: [
        { title: 'Lịch trình', path: '/calendar' },
        { title: 'Trò chuyện', path: '/chat' },
        { title: 'Theo dõi cánh đồng', path: '/fields' },
        { title: 'Các mùa vụ', path: '/pineapple' },
      ],
    },
    {
      title: 'Activity',
      icon: <CheckCircleOutlined />,
      children: [
        { title: 'Hoạt động', path: '/farm-activities' },
        { title: 'Quy trình chung', path: '/activity-templates' },
      ],
    },
    {
      title: 'Vật tư nông nghiệp',
      icon: <ToolOutlined />,
      children: [
        { title: 'Danh sách vật tư', path: '/farmer/listings' },
        { title: 'Đơn hàng của tôi', path: '/farmer/orders' },
      ],
    },
    {
      title: 'Đăng tải',
      icon: <ShopOutlined />,
      children: [
        { title: 'New Product', path: '/products/create' },
        { title: 'Products', path: '/products' },
        { title: 'Orders', path: '/orders' },
      ],
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
    },
    {
      title: 'Liên hệ',
      icon: <PhoneOutlined />,
      children: [
        { title: 'Liên hệ', path: '/contact' },
        { title: 'Địa điểm', path: '/location' },
      ],
    },
  ];

  // Cấu trúc menu cho supplier
  const supplierMenuItems: MenuItem[] = [
    {
      title: 'Bảng điều khiển',
      icon: <DashboardOutlined />,
      children: [
        { title: 'Overview', path: '/supplier/dashboard' },
      ],
    },
    {
      title: 'Quản lý vật tư',
      icon: <ToolOutlined />,
      children: [
        { title: 'Danh sách vật tư', path: '/supplier/listings' },
        { title: 'Tạo vật tư mới', path: '/supplier/listings/create' },
      ],
    },
    {
      title: 'Đơn hàng',
      icon: <ShoppingCartOutlined />,
      children: [
        { title: 'Đơn hàng nhận được', path: '/supplier/orders' },
      ],
    },
    {
      title: 'Liên hệ',
      icon: <PhoneOutlined />,
      children: [
        { title: 'Liên hệ', path: '/contact' },
        { title: 'Địa điểm', path: '/location' },
      ],
    },
  ];

  // Cấu trúc menu cho trader
  const traderMenuItems: MenuItem[] = [
    {
      title: 'Home',
      icon: <HomeOutlined />,
      children: [
        { title: 'Homepage', path: '/calendar' },
        { title: 'Chat', path: '/chat' },
        { title: 'Field', path: '/fields' },
      ],
    },
    {
      title: 'Activity',
      icon: <CheckCircleOutlined />,
      children: [
        { title: 'Farm Activities', path: '/farm-activities' },
      ],
    },
    {
      title: 'Shop',
      icon: <ShopOutlined />,
      children: [
        { title: 'New Product', path: '/products/create' },
        { title: 'Products', path: '/products' },
        { title: 'Categories', path: '/categories' },
      ],
    },
    {
      title: 'Contact Us',
      icon: <PhoneOutlined />,
      children: [
        { title: 'Contact', path: '/contact' },
        { title: 'Location', path: '/location' },
      ],
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
        return farmerMenuItems; // Mặc định là farmer
    }
  };

  const menuItems: MenuItem[] = getMenuItems();

  useEffect(() => {
    const handleResize = () => {
      // Auto collapse on small screens
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else if (window.innerWidth >= 1200) {
        // Auto expand on large screens
        setCollapsed(false);
      }
    };
    
    // Initial check
    handleResize();
    
    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Sesuaikan margin main content saat sidebar diubah
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
    
    // Điều chỉnh vị trí của navbar thay vì margin
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

  // Thay đổi cách xử lý toggle button
  const handleToggle = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`bg-white border-r border-gray-200 h-full transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header của sidebar */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
        {!collapsed && <h2 className="text-lg font-semibold text-gray-800">PineFarm</h2>}
        <Button 
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={handleToggle}
          className="text-gray-500"
        />
      </div>
      
      {/* Navigation menu */}
      <nav className="overflow-y-auto h-[calc(100vh-4rem)]">
        <ul className="space-y-1 px-2 py-4">
          {menuItems.map((item, index) => (
            <NavItem
              key={index}
              title={item.title}
              icon={item.icon}
              path={item.path}
              children={item.children}
              userType={userType}
              allowedUsers={item.allowedUsers}
              collapsed={collapsed}
            />
          ))}
        </ul>
      </nav>
    </div>
  );
}