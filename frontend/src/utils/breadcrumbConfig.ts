// Breadcrumb configuration for different pages
export const breadcrumbConfig = {
  // Home pages
  '/': [],
  '/home': [],
  
  // Calendar
  '/calendar': [
    { label: "Trang chủ", path: "/" },
    { label: "Lịch trình" },
    { label: "Lịch hoạt động nông trại" }
  ],
  
  // Farm Activities
  '/farm-activities': [
    { label: "Trang chủ", path: "/" },
    { label: "Hoạt động" },
    { label: "Hoạt động nông trại" }
  ],
  
  // Field
  '/fields': [
    { label: "Trang chủ", path: "/" },
    { label: "Theo dõi cánh đồng" }
  ],
  
  // Pineapple
  '/pineapple': [
    { label: "Trang chủ", path: "/" },
    { label: "Các mùa vụ" },
    { label: "Vụ dứa" }
  ],
  
  // Labor
  '/labor': [
    { label: "Trang chủ", path: "/" },
    { label: "Đổi công" },
    { label: "Tổng quan" }
  ],
  '/labor/requests': [
    { label: "Trang chủ", path: "/" },
    { label: "Đổi công" },
    { label: "Yêu cầu đổi công" }
  ],
  '/labor/exchanges': [
    { label: "Trang chủ", path: "/" },
    { label: "Đổi công" },
    { label: "Dư nợ đổi công" }
  ],
  
  // Management
  '/household': [
    { label: "Trang chủ", path: "/" },
    { label: "Quản lý thông tin" },
    { label: "Thông tin hộ sản xuất" }
  ],
  '/profile': [
    { label: "Trang chủ", path: "/" },
    { label: "Quản lý thông tin" },
    { label: "Thông tin người dùng" }
  ],
  
  // Marketplace
  '/products': [
    { label: "Trang chủ", path: "/" },
    { label: "Cửa hàng" },
    { label: "Danh sách sản phẩm" }
  ],
  '/products/create': [
    { label: "Trang chủ", path: "/" },
    { label: "Cửa hàng" },
    { label: "Tạo sản phẩm" }
  ],
  
  // Supply Chain
  '/farmer/listings': [
    { label: "Trang chủ", path: "/" },
    { label: "Vật tư nông nghiệp" },
    { label: "Tìm mua vật tư" }
  ],
  '/farmer/orders': [
    { label: "Trang chủ", path: "/" },
    { label: "Vật tư nông nghiệp" },
    { label: "Đơn hàng vật tư" }
  ],
  '/farmer/inventory': [
    { label: "Trang chủ", path: "/" },
    { label: "Vật tư nông nghiệp" },
    { label: "Kho" }
  ],
  
  // Supplier
  '/supplier/dashboard': [
    { label: "Trang chủ", path: "/" },
    { label: "Nhà cung cấp" },
    { label: "Bảng điều khiển" }
  ],
  '/supplier/listings': [
    { label: "Trang chủ", path: "/" },
    { label: "Nhà cung cấp" },
    { label: "Danh sách vật tư" }
  ],
  '/supplier/orders': [
    { label: "Trang chủ", path: "/" },
    { label: "Nhà cung cấp" },
    { label: "Đơn hàng nhận được" }
  ],
  
  // Weather
  '/climate': [
    { label: "Trang chủ", path: "/" },
    { label: "Thời tiết" },
    { label: "Dự báo thời tiết" }
  ],
  
  // Notifications
  '/notifications': [
    { label: "Trang chủ", path: "/" },
    { label: "Thông báo" }
  ],
  
  // Orders
  '/orders': [
    { label: "Trang chủ", path: "/" },
    { label: "Sản phẩm" },
    { label: "Đơn đặt hàng" }
  ],
  
  // Cart
  '/cart': [
    { label: "Trang chủ", path: "/" },
    { label: "Giỏ hàng" }
  ]
};

// Function to get breadcrumb items for a given path
export const getBreadcrumbItems = (pathname: string) => {
  // Try exact match first
  if (breadcrumbConfig[pathname as keyof typeof breadcrumbConfig]) {
    return breadcrumbConfig[pathname as keyof typeof breadcrumbConfig];
  }
  
  // Try to match with dynamic routes (e.g., /products/:id)
  const pathSegments = pathname.split('/');
  
  // Handle dynamic routes
  if (pathSegments[1] === 'products' && pathSegments[2] && pathSegments[3] === 'edit') {
    return [
      { label: "Trang chủ", path: "/" },
      { label: "Cửa hàng" },
      { label: "Chỉnh sửa sản phẩm" }
    ];
  }
  
  if (pathSegments[1] === 'products' && pathSegments[2]) {
    return [
      { label: "Trang chủ", path: "/" },
      { label: "Cửa hàng" },
      { label: "Chi tiết sản phẩm" }
    ];
  }
  
  if (pathSegments[1] === 'pineapple' && pathSegments[2]) {
    return [
      { label: "Trang chủ", path: "/" },
      { label: "Các mùa vụ" },
      { label: "Chi tiết vụ dứa" }
    ];
  }
  
  if (pathSegments[1] === 'farm-activities' && pathSegments[2]) {
    return [
      { label: "Trang chủ", path: "/" },
      { label: "Hoạt động" },
      { label: "Chi tiết hoạt động" }
    ];
  }
  
  // Default breadcrumb
  return [
    { label: "Trang chủ", path: "/" },
    { label: "Trang hiện tại" }
  ];
}; 