import React, { useEffect, useState } from 'react';
import { Table, Tabs, Badge, Card, Typography, Tag, Button, Space, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EyeOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getProductOrders } from '@/services/marketplace/productOrderService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { useContext } from 'react';
import {useAuth} from '@/contexts/AuthContext';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    rejected: 0,
    completed: 0,
    total: 0,
  });
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const isFarmer = user?.user_type === 'farmer';

  useEffect(() => {
    fetchOrders(activeTab !== 'all' ? activeTab : undefined);
  }, [activeTab]);

  const fetchOrders = async (status?: string) => {
    try {
      setLoading(true);
      const response = await getProductOrders({ status }) as { orders: any[]; statistics: { [key: string]: number } };
      setOrders(response.orders || []);
      setStats({
        pending: 0,
        accepted: 0,
        rejected: 0,
        completed: 0,
        total: 0,
        ...response.statistics,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      accepted: 'blue',
      completed: 'green',
      rejected: 'red',
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: 'Chờ xác nhận',
      accepted: 'Đã chấp nhận',
      completed: 'Hoàn thành',
      rejected: 'Đã từ chối',
    };
    return texts[status] || status;
  };

  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product_listing',
      key: 'product',
      render: (productListing: any) => (
        <div className="flex items-center">
          {productListing?.product_images?.[0]?.image_url && (
            <img
              src={productListing.product_images[0].image_url}
              alt={productListing.title}
              className="w-12 h-12 object-cover rounded-md mr-3"
            />
          )}
          <div>
            <div className="font-medium">{productListing.title}</div>
            <div className="text-xs text-gray-500">{productListing.product_type}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number) => <span>{quantity} kg</span>,
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => formatCurrency(price) + '/kg',
    },
    {
      title: isFarmer ? 'Người mua' : 'Người bán',
      key: 'partner',
      render: (record: any) => {
        const partner = isFarmer ? record.buyer : record.product_listing?.user;
        return (
          <div>
            <div>{partner?.fullname || partner?.user_name}</div>
            <div className="text-xs text-gray-500">{partner?.phone}</div>
          </div>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/orders/${record.id}`)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <Card>
        <Title level={3}>{isFarmer ? 'Đơn hàng nhận được' : 'Đơn hàng của tôi'}</Title>
        
        <div className="stats-row grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card size="small" className="text-center">
            <Badge count={stats.total} overflowCount={9999} showZero>
              <div className="p-2">Tổng đơn</div>
            </Badge>
          </Card>
          <Card size="small" className="text-center">
            <Badge count={stats.pending} color="orange" overflowCount={9999} showZero>
              <div className="p-2">Chờ xác nhận</div>
            </Badge>
          </Card>
          <Card size="small" className="text-center">
            <Badge count={stats.accepted} color="blue" overflowCount={9999} showZero>
              <div className="p-2">Đã chấp nhận</div>
            </Badge>
          </Card>
          <Card size="small" className="text-center">
            <Badge count={stats.completed} color="green" overflowCount={9999} showZero>
              <div className="p-2">Đã hoàn thành</div>
            </Badge>
          </Card>
          <Card size="small" className="text-center">
            <Badge count={stats.rejected} color="red" overflowCount={9999} showZero>
              <div className="p-2">Đã từ chối</div>
            </Badge>
          </Card>
        </div>
        
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          className="mb-6"
        >
          <TabPane tab="Tất cả" key="all" />
          <TabPane tab="Chờ xác nhận" key="pending" />
          <TabPane tab="Đã chấp nhận" key="accepted" />
          <TabPane tab="Hoàn thành" key="completed" />
          <TabPane tab="Đã từ chối" key="rejected" />
        </Tabs>
        
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default OrderList;
