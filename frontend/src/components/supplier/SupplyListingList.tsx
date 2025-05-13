import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Select,
  Tooltip,
  Badge,
  Card,
  Typography,
  Dropdown,
  Menu,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import supplyListingService, {
  SupplyListing,
} from "@/services/supply_chain/supplyListingService";

const { Title } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const SupplyListingList: React.FC = () => {
  const [listings, setListings] = useState<SupplyListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await supplyListingService.getSupplierListings();
      setListings(response.data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await supplyListingService.changeStatus(id, status);
      fetchListings();
    } catch (error) {
      console.error("Error changing status:", error);
    }
  };

  const handleDelete = (id: number) => {
    confirm({
      title: "Bạn có chắc chắn muốn xóa vật tư này?",
      icon: <ExclamationCircleOutlined />,
      content: "Dữ liệu sẽ bị xóa vĩnh viễn và không thể khôi phục.",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await supplyListingService.deleteListing(id);
          fetchListings();
        } catch (error) {
          console.error("Error deleting listing:", error);
        }
      },
    });
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch = listing.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      !categoryFilter || listing.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const statusColors: Record<string, string> = {
    active: "green",
    sold_out: "red",
    inactive: "gray",
  };

  const categoryLabels: Record<string, string> = {
    fertilizer: "Phân bón",
    pesticide: "Thuốc BVTV",
    seed: "Hạt giống",
    tool: "Công cụ",
    other: "Khác",
  };

  const columns = [
    {
      title: "Hình ảnh",
      key: "image",
      render: (text: string, record: SupplyListing) => (
        <div className="w-12 h-12 overflow-hidden rounded-md">
          {record.main_image ? (
            <img
              src={record.main_image}
              alt={record.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Tên vật tư",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: SupplyListing) => (
        <Link
          to={`/supplier/listings/${record.id}`}
          className="text-blue-600 hover:underline"
        >
          {text}
        </Link>
      ),
    },
    {
      title: "Loại",
      dataIndex: "category",
      key: "category",
      render: (category: string) => (
        <Tag color="blue">{categoryLabels[category] || category}</Tag>
      ),
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (price: number) =>
        `${price.toLocaleString("vi-VN")}đ/${
          listings.find((l) => l.price === price)?.unit || "đơn vị"
        }`,
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity: number, record: SupplyListing) =>
        `${quantity} ${record.unit}`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>
          {{
            active: "Đang bán",
            sold_out: "Hết hàng",
            inactive: "Không hoạt động",
          }[status] || status}
        </Tag>
      ),
    },
    {
      title: "Đơn hàng",
      dataIndex: "order_count",
      key: "order_count",
      render: (count: number) => (
        <Badge count={count} showZero color="#1890ff" overflowCount={99} />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (text: string, record: SupplyListing) => (
        <Space size="middle">
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="1">
                  <Link to={`/supplier/listings/${record.id}`}>
                    <EyeOutlined /> Xem chi tiết
                  </Link>
                </Menu.Item>
                <Menu.Item key="2">
                  <Link to={`/supplier/listings/${record.id}/edit`}>
                    <EditOutlined /> Chỉnh sửa
                  </Link>
                </Menu.Item>
                <Menu.Divider />
                <Menu.SubMenu key="sub1" title="Trạng thái">
                  <Menu.Item
                    key="3"
                    onClick={() => handleStatusChange(record.id!, "active")}
                  >
                    Đang bán
                  </Menu.Item>
                  <Menu.Item
                    key="4"
                    onClick={() => handleStatusChange(record.id!, "sold_out")}
                  >
                    Hết hàng
                  </Menu.Item>
                  <Menu.Item
                    key="5"
                    onClick={() => handleStatusChange(record.id!, "inactive")}
                  >
                    Không hoạt động
                  </Menu.Item>
                </Menu.SubMenu>
                <Menu.Divider />
                <Menu.Item
                  key="6"
                  danger
                  onClick={() => handleDelete(record.id!)}
                >
                  <DeleteOutlined /> Xóa
                </Menu.Item>
              </Menu>
            }
            trigger={["click"]}
          >
            <Button type="text">...</Button>
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="mb-6 flex justify-between items-center">
        <Title level={2}>Quản lý vật tư nông nghiệp</Title>
        <Link to="/supplier/listings/new">
          <Button type="primary" icon={<PlusOutlined />} size="large">
            Đăng vật tư mới
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <Input
            placeholder="Tìm theo tên vật tư"
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
            allowClear
          />
          <Select
            placeholder="Lọc theo danh mục"
            style={{ minWidth: 150 }}
            onChange={(value) => setCategoryFilter(value)}
            allowClear
            value={categoryFilter}
          >
            <Option value="fertilizer">Phân bón</Option>
            <Option value="pesticide">Thuốc BVTV</Option>
            <Option value="seed">Hạt giống</Option>
            <Option value="tool">Công cụ</Option>
            <Option value="other">Khác</Option>
          </Select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={filteredListings}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default SupplyListingList;
