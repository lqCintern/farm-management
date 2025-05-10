import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  Tag,
  Button,
  Card,
  Select,
  Input,
  Space,
  Tabs,
  Typography,
  Badge,
  Avatar,
  message,
  Empty,
  Spin,
  Tooltip,
} from "antd";
import {
  EyeOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  InboxOutlined,
  SyncOutlined,
  SortAscendingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import supplyOrderService, { SupplyOrder } from "@/services/supplyOrderService";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<SupplyOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentStatus, setCurrentStatus] = useState<string>("all");
  const [searchText, setSearchText] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("newest");

  useEffect(() => {
    fetchOrders();
  }, [currentStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = currentStatus !== "all" ? { status: currentStatus } : {};
      const response = await supplyOrderService.getFarmerOrders(params);
      setOrders(response.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      message.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (id: number) => {
    navigate(`/orders/${id}`);
  };

  const handleCancelOrder = async (id: number) => {
    try {
      await supplyOrderService.cancelOrder(id);
      message.success("Hủy đơn hàng thành công");
      fetchOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      message.error("Không thể hủy đơn hàng");
    }
  };

  const handleCompleteOrder = async (id: number) => {
    try {
      await supplyOrderService.completeOrder(id);
      message.success("Xác nhận đã nhận hàng thành công");
      fetchOrders();
    } catch (error) {
      console.error("Error completing order:", error);
      message.error("Không thể xác nhận đã nhận hàng");
    }
  };

  const getOrderStatusTag = (status: string) => {
    const statusMap: Record<
      string,
      { color: string; text: string; icon: JSX.Element }
    > = {
      pending: {
        color: "blue",
        text: "Chờ xác nhận",
        icon: <ClockCircleOutlined />,
      },
      confirmed: {
        color: "cyan",
        text: "Đã xác nhận",
        icon: <CheckCircleOutlined />,
      },
      shipped: {
        color: "geekblue",
        text: "Đang giao hàng",
        icon: <SyncOutlined spin />,
      },
      delivered: {
        color: "volcano",
        text: "Đã giao hàng",
        icon: <InboxOutlined />,
      },
      completed: {
        color: "green",
        text: "Hoàn thành",
        icon: <CheckCircleOutlined />,
      },
      cancelled: {
        color: "red",
        text: "Đã hủy",
        icon: <CloseCircleOutlined />,
      },
      rejected: {
        color: "magenta",
        text: "Bị từ chối",
        icon: <CloseCircleOutlined />,
      },
    };

    const statusInfo = statusMap[status] || {
      color: "default",
      text: "Không xác định",
      icon: null,
    };

    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getFilteredOrders = () => {
    let result = [...orders];

    // Tìm kiếm
    if (searchText) {
      const lowerCaseSearch = searchText.toLowerCase();
      result = result.filter(
        (order) =>
          order.supply_listing_id
            .toString()
            .toLowerCase()
            .includes(lowerCaseSearch) ||
          order.supply_listing_id
            .toString()
            .toLowerCase()
            .includes(lowerCaseSearch)
      );
    }

    // Sắp xếp
    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (sortBy === "price_high") {
      result.sort(
        (a, b) =>
          b.supply_listing_id * b.quantity - a.supply_listing_id * a.quantity
      );
    } else if (sortBy === "price_low") {
      result.sort(
        (a, b) =>
          (a.supply_listing_id || 0) * a.quantity -
          (b.supply_listing_id || 0) * b.quantity
      );
    }

    return result;
  };

  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "supply_listing",
      key: "supply_listing",
      render: (listing: any, record: SupplyOrder) => (
        <div className="flex items-center">
          <img
            src={listing.image || "https://via.placeholder.com/50"}
            alt={listing.name}
            className="w-12 h-12 object-cover rounded mr-3"
          />
          <div>
            <Text strong className="block">
              {listing.name}
            </Text>
            <Text type="secondary">
              SL: {record.quantity} {listing.unit || "đơn vị"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Nhà cung cấp",
      dataIndex: "supplier",
      key: "supplier",
      render: (supplier: any) => (
        <div className="flex items-center">
          <Avatar icon={<UserOutlined />} size="small" className="mr-2" />
          {supplier.name}
        </div>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      key: "total",
      render: (text: number, record: SupplyOrder) => (
        <Text strong>
          {(record.quantity * (record.supply_listing_id || 0)).toLocaleString()}{" "}
          đ
        </Text>
      ),
    },
    {
      title: "Ngày đặt",
      dataIndex: "created_at",
      key: "created_at",
      render: (text: string) => {
        const date = new Date(text);
        return date.toLocaleDateString("vi-VN");
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getOrderStatusTag(status),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (text: string, record: SupplyOrder) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => record.id && handleViewDetail(record.id)}
          >
            Chi tiết
          </Button>

          {record.status === "pending" && (
            <Button
              type="link"
              danger
              onClick={() => record.id && handleCancelOrder(record.id)}
            >
              Hủy
            </Button>
          )}

          {record.status === "delivered" && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => record.id && handleCompleteOrder(record.id)}
              className="text-green-600"
            >
              Đã nhận
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const renderOrderCount = () => {
    const count = orders.length;
    return (
      <Text type="secondary">
        Tổng cộng: <Text strong>{count}</Text> đơn hàng
      </Text>
    );
  };

  const renderEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span>
          Chưa có đơn hàng nào
          <br />
          <Button
            type="primary"
            onClick={() => navigate("/supply-listings")}
            className="mt-4"
          >
            Mua vật tư ngay
          </Button>
        </span>
      }
    />
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <Title level={3} className="mb-0">
            <ShoppingOutlined className="mr-2" />
            Quản lý đơn mua vật tư
          </Title>
          <Button
            type="primary"
            onClick={() => navigate("/supply-listings")}
            icon={<ShoppingOutlined />}
          >
            Mua vật tư
          </Button>
        </div>

        <Tabs
          activeKey={currentStatus}
          onChange={setCurrentStatus}
          className="mb-4"
        >
          <TabPane
            tab={
              <Badge count={orders.length}>
                <span>Tất cả</span>
              </Badge>
            }
            key="all"
          />
          <TabPane tab="Chờ xác nhận" key="pending" />
          <TabPane tab="Đã xác nhận" key="confirmed" />
          <TabPane tab="Đang giao" key="shipped" />
          <TabPane tab="Đã giao" key="delivered" />
          <TabPane tab="Hoàn thành" key="completed" />
          <TabPane tab="Đã hủy" key="cancelled" />
          <TabPane tab="Từ chối" key="rejected" />
        </Tabs>

        <div className="flex justify-between mb-4">
          <Input
            placeholder="Tìm kiếm theo tên sản phẩm, nhà cung cấp..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />

          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: 200 }}
            placeholder="Sắp xếp theo"
            suffixIcon={<SortAscendingOutlined />}
          >
            <Option value="newest">Mới nhất</Option>
            <Option value="oldest">Cũ nhất</Option>
            <Option value="price_high">Giá cao đến thấp</Option>
            <Option value="price_low">Giá thấp đến cao</Option>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <Spin size="large" />
          </div>
        ) : orders.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={getFilteredOrders()}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Tổng cộng ${total} đơn hàng`,
              }}
              footer={renderOrderCount}
            />
          </>
        )}
      </Card>
    </div>
  );
};

export default OrderList;
