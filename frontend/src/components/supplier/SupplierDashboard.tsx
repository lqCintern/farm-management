import React, { useEffect, useState } from "react";
import { Card, Typography, Statistic, Row, Col, Table, Tag } from "antd";
import {
  ShoppingCartOutlined,
  StarOutlined,
  DollarCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import supplyOrderService from "@/services/supplyOrderService";
import { Link } from "react-router-dom";

const { Title } = Typography;

const SupplierDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await supplyOrderService.getSupplierDashboard();
        setDashboardData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "gold",
      confirmed: "blue",
      shipped: "purple",
      delivered: "cyan",
      completed: "green",
      cancelled: "red",
      rejected: "red",
    };
    return colors[status] || "default";
  };

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <Title level={2}>Dashboard Nhà cung cấp</Title>

      {/* Stats Overview */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Đơn hàng chờ xử lý"
              value={dashboardData?.pending_orders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng doanh thu"
              value={dashboardData?.revenue || 0}
              prefix={<DollarCircleOutlined />}
              suffix="đ"
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Đánh giá trung bình"
              value={dashboardData?.reviews_avg || 0}
              prefix={<StarOutlined />}
              precision={1}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Sản phẩm đã đăng"
              value={
                dashboardData?.listing_stats
                  ? Object.values(dashboardData.listing_stats).reduce<number>(
                      (a: number, b: unknown) =>
                        a + (typeof b === "number" ? b : 0),
                      0
                    )
                  : 0
              }
              prefix={<InboxOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Order Status Breakdown */}
      <Card title="Trạng thái đơn hàng" className="mb-6" loading={loading}>
        <Row gutter={[16, 16]}>
          {dashboardData?.order_stats &&
            Object.entries(dashboardData.order_stats).map(([status, count]) => (
              <Col key={status} xs={12} sm={8} md={6} lg={4}>
                <Card size="small">
                  <Statistic
                    title={
                      <Tag color={getStatusColor(status)}>
                        {
                          {
                            pending: "Chờ xác nhận",
                            confirmed: "Đã xác nhận",
                            shipped: "Đang giao",
                            delivered: "Đã giao",
                            completed: "Hoàn thành",
                            cancelled: "Đã hủy",
                            rejected: "Từ chối",
                          }[status]
                        }
                      </Tag>
                    }
                    value={Number(count)}
                  />
                </Card>
              </Col>
            ))}
        </Row>
      </Card>

      {/* Product Category Breakdown */}
      <Card title="Vật tư theo danh mục" loading={loading}>
        <Row gutter={[16, 16]}>
          {dashboardData?.listing_stats &&
            Object.entries(dashboardData.listing_stats).map(
              ([category, count]) => (
                <Col key={category} xs={12} sm={8} md={6} lg={4}>
                  <Card size="small">
                    <Statistic
                      title={
                        {
                          fertilizer: "Phân bón",
                          pesticide: "Thuốc BVTV",
                          seed: "Hạt giống",
                          tool: "Công cụ",
                          other: "Khác",
                        }[category] || category
                      }
                      value={Number(count)}
                    />
                  </Card>
                </Col>
              )
            )}
        </Row>
      </Card>

      {/* Quick Links */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col span={24}>
          <Card title="Truy cập nhanh">
            <div className="flex flex-wrap gap-4">
              <Link
                to="/supplier/listings/new"
                className="btn-primary px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
              >
                Đăng vật tư mới
              </Link>
              <Link
                to="/supplier/orders?status=pending"
                className="btn-primary px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white"
              >
                Đơn hàng chờ xử lý
              </Link>
              <Link
                to="/supplier/listings"
                className="btn-primary px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white"
              >
                Quản lý vật tư
              </Link>
              <Link
                to="/supplier/orders"
                className="btn-primary px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white"
              >
                Tất cả đơn hàng
              </Link>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SupplierDashboard;
