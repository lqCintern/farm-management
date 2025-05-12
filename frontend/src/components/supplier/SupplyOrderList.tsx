import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Select,
  Card,
  Tag,
  Tabs,
  Typography,
  Tooltip,
  Badge,
  Modal,
  Input,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  CarOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import supplyOrderService from "@/services/supplyOrderService";

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { confirm } = Modal;
const { TextArea } = Input;

interface Order {
  id: number;
  status: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
  supply_listing: {
    id: number;
    name: string;
    image: string;
  };
  buyer: {
    id: number;
    name: string;
    phone: string;
  };
}

const SupplyOrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentStatus, setCurrentStatus] = useState<string>("pending");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [rejectionModalVisible, setRejectionModalVisible] =
    useState<boolean>(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders(currentStatus);
  }, [currentStatus]);

  const fetchOrders = async (status: string = "") => {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const response = await supplyOrderService.getSupplierOrders(params);
      setOrders(response.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await supplyOrderService.updateOrderStatus(id, status);
      fetchOrders(currentStatus);
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const showRejectionModal = (id: number) => {
    setSelectedOrderId(id);
    setRejectionReason("");
    setRejectionModalVisible(true);
  };

  const handleRejectOrder = async () => {
    if (!selectedOrderId) return;

    try {
      await supplyOrderService.updateOrderStatus(
        selectedOrderId,
        "rejected",
        rejectionReason
      );
      setRejectionModalVisible(false);
      fetchOrders(currentStatus);
    } catch (error) {
      console.error("Error rejecting order:", error);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "gold",
    confirmed: "blue",
    shipped: "purple",
    delivered: "cyan",
    completed: "green",
    cancelled: "red",
    rejected: "red",
  };

  const statusLabels: Record<string, string> = {
    pending: "Chờ xác nhận",
    confirmed: "Đã xác nhận",
    shipped: "Đang giao",
    delivered: "Đã giao",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    rejected: "Từ chối",
  };

  const columns = [
    {
      title: "Mã đơn",
      dataIndex: "id",
      key: "id",
      render: (id: number) => (
        <Link
          to={`/supplier/orders/${id}`}
          className="text-blue-600 hover:underline"
        >
          #{id}
        </Link>
      ),
    },
    {
      title: "Sản phẩm",
      key: "supply_listing",
      render: (text: string, record: Order) => (
        <div className="flex items-center">
          <div className="w-10 h-10 mr-3 overflow-hidden rounded-md">
            {record.supply_listing.image ? (
              <img
                src={record.supply_listing.image}
                alt={record.supply_listing.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">
                No Image
              </div>
            )}
          </div>
          <span className="font-medium">{record.supply_listing.name}</span>
        </div>
      ),
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (price: number) => `${price.toLocaleString("vi-VN")}đ`,
    },
    {
      title: "Tổng tiền",
      dataIndex: "total",
      key: "total",
      render: (total: number) => (
        <span className="font-semibold text-green-600">
          {total.toLocaleString("vi-VN")}đ
        </span>
      ),
    },
    {
      title: "Người mua",
      key: "buyer",
      render: (text: string, record: Order) => (
        <div>
          <div className="font-medium">{record.buyer.name}</div>
          <div className="text-gray-500 text-sm">{record.buyer.phone}</div>
        </div>
      ),
    },
    {
      title: "Ngày đặt",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>
          {statusLabels[status] || status}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (text: string, record: Order) => {
        const actions = [];

        if (record.status === "pending") {
          actions.push(
            <Tooltip title="Xác nhận đơn hàng" key="confirm">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleStatusChange(record.id, "confirmed")}
                className="mr-2"
              />
            </Tooltip>
          );

          actions.push(
            <Tooltip title="Từ chối đơn hàng" key="reject">
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => showRejectionModal(record.id)}
                className="mr-2"
              />
            </Tooltip>
          );
        }

        if (record.status === "confirmed") {
          actions.push(
            <Tooltip title="Đánh dấu đã giao" key="ship">
              <Button
                type="primary"
                icon={<CarOutlined />}
                onClick={() => handleStatusChange(record.id, "delivered")}
                className="mr-2"
              />
            </Tooltip>
          );
        }

        actions.push(
          <Tooltip title="Xem chi tiết" key="view">
            <Link to={`/supplier/orders/${record.id}`}>
              <Button icon={<EyeOutlined />} />
            </Link>
          </Tooltip>
        );

        return actions;
      },
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <Title level={2}>Quản lý đơn hàng</Title>

      <Card className="mb-6">
        <Tabs activeKey={currentStatus || "all"} onChange={setCurrentStatus}>
          <TabPane tab="Tất cả" key="all" />
          <TabPane
            tab={
              <Badge
                count={orders.filter((o) => o.status === "pending").length}
                offset={[10, 0]}
              >
                Chờ xác nhận
              </Badge>
            }
            key="pending"
          />
          <TabPane tab="Đã xác nhận" key="confirmed" />
          <TabPane tab="Đã giao" key="delivered" />
          <TabPane tab="Hoàn thành" key="completed" />
          <TabPane tab="Đã hủy/Từ chối" key="cancelled" />
        </Tabs>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Lý do từ chối đơn hàng"
        visible={rejectionModalVisible}
        onOk={handleRejectOrder}
        onCancel={() => setRejectionModalVisible(false)}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
      >
        <TextArea
          rows={4}
          placeholder="Nhập lý do từ chối đơn hàng"
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default SupplyOrderList;
