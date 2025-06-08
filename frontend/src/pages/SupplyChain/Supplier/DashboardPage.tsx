// frontend/src/pages/SupplyChain/Supplier/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Col, Row, Statistic, Table, Typography, Spin, Tag, DatePicker, Button, Alert } from 'antd';
import { ShopOutlined, ShoppingCartOutlined, DollarOutlined, RiseOutlined, PlusOutlined } from '@ant-design/icons';
import supplyOrderService from '../../../services/supply_chain/supplyOrderService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface DashboardData {
  total_revenue: number;
  total_orders: number;
  total_products: number;
  recent_orders: any[];
  top_products: any[];
  orders_by_status: Record<string, number>;
}

const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Convert date range to the format expected by the API
        const params: any = {};
        if (dateRange && dateRange[0] && dateRange[1]) {
          params.start_date = dateRange[0].format('YYYY-MM-DD');
          params.end_date = dateRange[1].format('YYYY-MM-DD');
        }
        
        const response = await supplyOrderService.getSupplierDashboard();
        setDashboardData(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Không thể tải dữ liệu bảng điều khiển');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange]);

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'pending': { color: 'gold', text: 'Chờ xác nhận' },
      'confirmed': { color: 'blue', text: 'Đã xác nhận' },
      'processing': { color: 'processing', text: 'Đang xử lý' },
      'shipped': { color: 'cyan', text: 'Đang giao hàng' },
      'delivered': { color: 'geekblue', text: 'Đã giao hàng' },
      'completed': { color: 'green', text: 'Hoàn thành' },
      'cancelled': { color: 'red', text: 'Đã hủy' },
      'rejected': { color: 'volcano', text: 'Bị từ chối' },
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const recentOrderColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => <Link to={`/supplier/orders/${id}`}>#{id}</Link>,
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'product_name',
      key: 'product_name',
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount: number) => `${amount.toLocaleString('vi-VN')} VNĐ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
  ];

  const topProductColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Link to={`/supplier/listings/${record.id}`}>{name}</Link>
      ),
    },
    {
      title: 'Đã bán',
      dataIndex: 'total_sold',
      key: 'total_sold',
      sorter: (a: any, b: any) => a.total_sold - b.total_sold,
    },
    {
      title: 'Doanh thu',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue: number) => `${revenue.toLocaleString('vi-VN')} VNĐ`,
      sorter: (a: any, b: any) => a.revenue - b.revenue,
    },
    {
      title: 'Còn lại',
      dataIndex: 'stock',
      key: 'stock',
      render: (stock: number) => (
        <Text type={stock < 10 ? "danger" : undefined}>
          {stock}
        </Text>
      ),
    },
  ];

  if (loading && !dashboardData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <Title level={3} className="mb-4 md:mb-0">Tổng quan kinh doanh</Title>
        <div className="flex flex-col md:flex-row gap-4">
          <RangePicker 
            onChange={(dates) => setDateRange(dates)}
            format="DD/MM/YYYY"
            placeholder={['Từ ngày', 'Đến ngày']}
          />
          <Link to="/supplier/listings/create">
            <Button type="primary" icon={<PlusOutlined />}>
              Thêm vật tư mới
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
          className="mb-8"
        />
      )}

      {dashboardData && (
        <>
          <Row gutter={[16, 16]} className="mb-8">
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tổng đơn hàng"
                  value={dashboardData.total_orders}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tổng doanh thu"
                  value={dashboardData.total_revenue}
                  precision={0}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<DollarOutlined />}
                  suffix="VNĐ"
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Số lượng vật tư"
                  value={dashboardData.total_products}
                  prefix={<ShopOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Tỉ lệ hoàn thành"
                  value={(dashboardData.orders_by_status.completed || 0) / 
                         (dashboardData.total_orders || 1) * 100}
                  precision={1}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<RiseOutlined />}
                  suffix="%"
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} className="mb-8">
            <Col xs={24} md={12}>
              <Card title="Đơn hàng theo trạng thái" className="h-full">
                {Object.entries(dashboardData.orders_by_status).map(([status, count]) => (
                  <div key={status} className="mb-2 flex items-center">
                    {getStatusTag(status)}
                    <div className="ml-4 flex-1">
                      <div className="bg-gray-200 h-4 rounded overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full" 
                          style={{ 
                            width: `${(count / dashboardData.total_orders) * 100}%` 
                          }} 
                        />
                      </div>
                    </div>
                    <span className="ml-2">{count}</span>
                  </div>
                ))}
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card 
                title="Đơn hàng gần đây" 
                className="h-full"
                extra={<Link to="/supplier/orders">Xem tất cả</Link>}
              >
                <Table 
                  columns={recentOrderColumns}
                  dataSource={dashboardData.recent_orders} 
                  rowKey="id" 
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>

          <Card 
            title="Vật tư bán chạy" 
            className="mb-8"
            extra={<Link to="/supplier/listings">Xem tất cả</Link>}
          >
            <Table 
              columns={topProductColumns}
              dataSource={dashboardData.top_products} 
              rowKey="id" 
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
