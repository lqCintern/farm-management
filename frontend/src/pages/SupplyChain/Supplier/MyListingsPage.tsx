// frontend/src/pages/SupplyChain/Supplier/MyListingsPage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Button, Input, Table, Tag, Modal, message, Select, Card, 
  Typography, Statistic, Badge, Empty, Dropdown, Menu, Space
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined,
  FilterOutlined, MoreOutlined, SortAscendingOutlined, SortDescendingOutlined,
  EyeOutlined, LineChartOutlined
} from '@ant-design/icons';
import supplyListingService from '../../../services/supply_chain/supplyListingService';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { confirm } = Modal;

// Định nghĩa các nhãn và màu sắc
const categoryLabels: Record<string, string> = {
  fertilizer: "Phân bón",
  pesticide: "Thuốc BVTV",
  seed: "Hạt giống",
  tool: "Dụng cụ",
  other: "Khác",
};

const statusLabels: Record<string, string> = {
  active: "Đang bán",
  sold_out: "Hết hàng",
  inactive: "Ngừng bán",
};

const MyListingsPage: React.FC = () => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Thêm state cho thống kê
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalSales: 0,
    totalRevenue: 0,
  });
  
  // Thêm state cho sắp xếp
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchText) params.keyword = searchText;
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      
      const response = await supplyListingService.getSupplierListings();
      setListings(response.data);
      
      // Tính toán thống kê
      const activeListings = response.data.filter((item: any) => item.status === 'active').length;
      const totalSales = response.data.reduce((sum: number, item: any) => sum + (item.order_count || 0), 0);
      const totalRevenue = response.data.reduce((sum: number, item: any) => 
        sum + parseFloat(item.price) * (item.order_count || 0), 0);
      
      setStats({
        totalListings: response.data.length,
        activeListings,
        totalSales,
        totalRevenue,
      });
      
      // Get unique categories if not already fetched
      if (categories.length === 0) {
        const categoriesResponse = await supplyListingService.getCategories();
        setCategories(categoriesResponse.data);
      }
    } catch (error) {
      message.error('Không thể tải danh sách vật tư');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Lọc danh sách dựa trên các bộ lọc hiện tại
  const filteredListings = listings
    .filter(item => 
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchText.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchText.toLowerCase()))
    )
    .filter(item => !categoryFilter || item.category === categoryFilter)
    .filter(item => !statusFilter || item.status === statusFilter)
    .sort((a, b) => {
      if (sortField === 'price') {
        return sortOrder === 'ascend' ? parseFloat(a.price) - parseFloat(b.price) : parseFloat(b.price) - parseFloat(a.price);
      } else if (sortField === 'quantity') {
        return sortOrder === 'ascend' ? a.quantity - b.quantity : b.quantity - a.quantity;
      } else if (sortField === 'order_count') {
        return sortOrder === 'ascend' ? (a.order_count || 0) - (b.order_count || 0) : (b.order_count || 0) - (a.order_count || 0);
      }
      // Mặc định sắp xếp theo ngày
      return sortOrder === 'ascend' 
        ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime() 
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleDelete = (id: number) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa vật tư này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Khi xóa, vật tư này sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await supplyListingService.deleteListing(id);
          message.success('Đã xóa vật tư thành công');
          fetchListings();
        } catch (error) {
          message.error('Không thể xóa vật tư');
        }
      },
    });
  };

  const handleStatusChange = (id: number, status: string) => {
    const statusText = statusLabels[status] || status;
    confirm({
      title: `Bạn có chắc chắn muốn thay đổi trạng thái thành "${statusText}"?`,
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          await supplyListingService.changeStatus(id, status);
          message.success('Đã cập nhật trạng thái thành công');
          fetchListings();
        } catch (error) {
          message.error('Không thể cập nhật trạng thái');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'main_image',
      key: 'main_image',
      render: (image: string, record: any) => (
        <div className="w-12 h-12">
          <img 
            src={image || '/images/placeholder-product.png'} 
            alt={record.name} 
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '4px' }}
          />
        </div>
      ),
    },
    {
      title: 'Tên vật tư',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Link to={`/supplier/listings/${record.id}/edit`}>
          <div>
            <div className="font-medium">{text}</div>
            {record.brand && <div className="text-xs text-gray-500">{record.brand}</div>}
          </div>
        </Link>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag>{categoryLabels[category] || category}</Tag>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number, record: any) => (
        <div>
          <span className="font-medium">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
              maximumFractionDigits: 0
            }).format(price)}
          </span>
          <div className="text-xs text-gray-500">/{record.unit}</div>
        </div>
      ),
      sorter: (a: any, b: any) => parseFloat(a.price) - parseFloat(b.price),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: any) => (
        <Text type={quantity < 10 ? quantity <= 0 ? "danger" : "warning" : undefined}>
          {quantity} {record.unit}
        </Text>
      ),
      sorter: (a: any, b: any) => a.quantity - b.quantity,
    },
    {
      title: 'Đã bán',
      dataIndex: 'order_count',
      key: 'order_count',
      render: (count: number) => (
        <Badge 
          count={count || 0} 
          showZero 
          style={{ backgroundColor: count > 0 ? '#1890ff' : '#d9d9d9' }}
        />
      ),
      sorter: (a: any, b: any) => (a.order_count || 0) - (b.order_count || 0),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig: Record<string, { color: string, text: string }> = {
          'active': { color: 'green', text: 'Đang bán' },
          'inactive': { color: 'volcano', text: 'Ngừng bán' },
          'sold_out': { color: 'red', text: 'Hết hàng' }
        };
        
        const { color, text } = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: any) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                label: <Link to={`/supplier/listings/${record.id}/edit`}>Chỉnh sửa</Link>,
                icon: <EditOutlined />
              },
              {
                key: 'view',
                label: <Link to={`/listings/${record.id}`}>Xem chi tiết</Link>,
                icon: <EyeOutlined />
              },
              {
                key: 'stats',
                label: <Link to={`/supplier/listings/${record.id}/stats`}>Xem thống kê</Link>,
                icon: <LineChartOutlined />
              },
              {
                type: 'divider',
              },
              {
                key: 'status-submenu',
                label: 'Thay đổi trạng thái',
                icon: <FilterOutlined />,
                children: ([
                  record.status !== 'active' ? {
                    key: 'active',
                    label: 'Đánh dấu đang bán',
                    onClick: () => handleStatusChange(record.id, 'active'),
                  } : null,
                  record.status !== 'inactive' ? {
                    key: 'inactive',
                    label: 'Đánh dấu ngừng bán',
                    onClick: () => handleStatusChange(record.id, 'inactive'),
                  } : null,
                  record.status !== 'sold_out' && record.quantity === 0 ? {
                    key: 'sold_out',
                    label: 'Đánh dấu hết hàng',
                    onClick: () => handleStatusChange(record.id, 'sold_out'),
                  } : null,
                ].filter(Boolean) as any[])
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                label: 'Xóa',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDelete(record.id),
              },
            ]
          }}
          trigger={['click']}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <Title level={3}>Quản lý vật tư</Title>
        <Link to="/supplier/listings/create">
          <Button type="primary" icon={<PlusOutlined />}>
            Thêm vật tư mới
          </Button>
        </Link>
      </div>

      {/* Thêm phần thống kê */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <Statistic
            title="Tổng vật tư"
            value={stats.totalListings}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
        <Card>
          <Statistic
            title="Đang bán"
            value={stats.activeListings}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
        <Card>
          <Statistic
            title="Đã bán"
            value={stats.totalSales}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
        <Card>
          <Statistic
            title="Doanh thu"
            value={stats.totalRevenue}
            formatter={value => `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value as number)}`}
            valueStyle={{ color: '#13c2c2' }}
          />
        </Card>
      </div>

      <Card className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <Search
            placeholder="Tìm kiếm vật tư..."
            onSearch={value => setSearchText(value)}
            onChange={e => setSearchText(e.target.value)}
            allowClear
          />
          
          <Select
            placeholder="Lọc theo danh mục"
            allowClear
            style={{ width: '100%' }}
            onChange={(value) => setCategoryFilter(value)}
          >
            {categories.map(category => (
              <Option key={category} value={category}>
                {categoryLabels[category] || category}
              </Option>
            ))}
          </Select>
          
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            style={{ width: '100%' }}
            onChange={(value) => setStatusFilter(value)}
          >
            <Option value="active">{statusLabels.active}</Option>
            <Option value="inactive">{statusLabels.inactive}</Option>
            <Option value="sold_out">{statusLabels.sold_out}</Option>
          </Select>
          
          <div className="flex gap-2">
            <Select
              placeholder="Sắp xếp theo"
              style={{ width: '100%' }}
              value={sortField}
              onChange={(value) => setSortField(value)}
            >
              <Option value="created_at">Ngày tạo</Option>
              <Option value="price">Giá</Option>
              <Option value="quantity">Tồn kho</Option>
              <Option value="order_count">Đã bán</Option>
            </Select>
            
            <Button
              icon={sortOrder === 'ascend' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
              onClick={() => setSortOrder(sortOrder === 'ascend' ? 'descend' : 'ascend')}
            />
          </div>
        </div>
        
        <Table
          columns={columns}
          dataSource={filteredListings}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} vật tư`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    Chưa có vật tư nào.{' '}
                    <Link to="/supplier/listings/create">
                      <Button type="link">Thêm vật tư mới</Button>
                    </Link>
                  </span>
                }
              />
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default MyListingsPage;
