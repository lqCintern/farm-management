import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  message,
  Modal,
  Dropdown,
  Menu,
  Image,
  Tooltip,
  Badge,
  Statistic,
  Row,
  Col,
  Divider,
  Empty,
  Form,
  InputNumber,
  Upload,
  DatePicker,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
  StopOutlined,
  MoreOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import supplyListingService, {
  SupplyListing,
} from "@/services/supply_chain/supplyListingService";
import type { UploadProps } from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;
const { TextArea } = Input;

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

const statusColors: Record<string, string> = {
  active: "green",
  sold_out: "red",
  inactive: "default",
};

const initialFormValues = {
  name: "",
  category: "fertilizer",
  price: 0,
  unit: "kg",
  quantity: 0,
  status: "active",
  description: "",
  brand: "",
  manufacturer: "",
  province: "",
  district: "",
  ward: "",
  address: "",
};

const SupplyListingsManagement: React.FC = () => {
  const [listings, setListings] = useState<SupplyListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"ascend" | "descend">("descend");
  const [stats, setStats] = useState({
    totalListings: 0,
    activeListings: 0,
    totalSales: 0,
    totalRevenue: 0,
  });

  // Modal và form state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("Thêm vật tư mới");
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  useEffect(() => {
    fetchListings();
  }, []);

  // Lấy danh sách vật tư
  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await supplyListingService.getSupplierListings();
      const data = response.data || [];
      setListings(data);

      // Tính toán thống kê từ dữ liệu
      calculateStats(data);
    } catch (error) {
      console.error("Error fetching listings:", error);
      message.error("Không thể tải danh sách vật tư");
    } finally {
      setLoading(false);
    }
  };

  // Tính toán thống kê
  const calculateStats = (data: SupplyListing[]) => {
    const activeListings = data.filter(
      (item) => item.status === "active"
    ).length;
    const totalSales = data.reduce(
      (sum, item) => sum + (item.order_count || 0),
      0
    );
    const totalRevenue = data.reduce(
      (sum, item) => sum + item.price * (item.order_count || 0),
      0
    );

    setStats({
      totalListings: data.length,
      activeListings,
      totalSales,
      totalRevenue,
    });
  };

  // Xử lý thay đổi trạng thái
  const handleChangeStatus = async (id: number, status: string) => {
    try {
      await supplyListingService.changeStatus(id, status);
      message.success("Đã thay đổi trạng thái vật tư");
      fetchListings();
    } catch (error) {
      console.error("Error changing status:", error);
      message.error("Không thể thay đổi trạng thái vật tư");
    }
  };

  // Xử lý xóa vật tư
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
          message.success("Đã xóa vật tư");
          fetchListings();
        } catch (error) {
          console.error("Error deleting listing:", error);
          message.error("Không thể xóa vật tư");
        }
      },
    });
  };

  // Hiển thị modal tạo mới
  const showCreateModal = () => {
    setCurrentId(null);
    setModalTitle("Thêm vật tư mới");
    form.resetFields();
    setFileList([]);
    setModalVisible(true);
  };

  // Hiển thị modal chỉnh sửa
  const showEditModal = async (id: number) => {
    setCurrentId(id);
    setModalTitle("Cập nhật vật tư");
    setLoading(true);

    try {
      const response = await supplyListingService.getListingById(id);
      const listing = response.data;

      form.setFieldsValue({
        ...listing,
        manufacturing_date: listing.manufacturing_date
          ? dayjs(listing.manufacturing_date)
          : null,
        expiry_date: listing.expiry_date ? dayjs(listing.expiry_date) : null,
      });

      // Set file list if there are images
      if (listing.images && listing.images.length > 0) {
        setFileList(
          listing.images.map((img: any, index: number) => ({
            uid: `-${index}`,
            name: `image-${index}.jpg`,
            status: "done",
            url: img.url,
            thumbUrl: img.url,
          }))
        );
      } else if (listing.main_image) {
        setFileList([
          {
            uid: "-1",
            name: "main-image.jpg",
            status: "done",
            url: listing.main_image,
            thumbUrl: listing.main_image,
          },
        ]);
      } else {
        setFileList([]);
      }

      setModalVisible(true);
    } catch (error) {
      console.error("Error fetching listing details:", error);
      message.error("Không thể tải thông tin vật tư");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý submit form
  const handleSubmit = async (values: any) => {
    setLoading(true);

    try {
      const formData = new FormData();

      // Add supply listing data
      const supplyListing = {
        ...values,
        manufacturing_date: values.manufacturing_date
          ? values.manufacturing_date.format("YYYY-MM-DD")
          : null,
        expiry_date: values.expiry_date
          ? values.expiry_date.format("YYYY-MM-DD")
          : null,
      };

      formData.append("supply_listing", JSON.stringify(supplyListing));

      // Add images if any
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("images[]", file.originFileObj);
        }
      });

      if (currentId) {
        // Update existing listing
        const updatedListing = {
          ...values,
          manufacturing_date: values.manufacturing_date
            ? values.manufacturing_date.format("YYYY-MM-DD")
            : null,
          expiry_date: values.expiry_date
            ? values.expiry_date.format("YYYY-MM-DD")
            : null,
        };
        await supplyListingService.updateListing(currentId, updatedListing);
        message.success("Cập nhật vật tư thành công");
      } else {
        // Create new listing
        const newListing: SupplyListing = {
          ...values,
          manufacturing_date: values.manufacturing_date
            ? values.manufacturing_date.format("YYYY-MM-DD")
            : null,
          expiry_date: values.expiry_date
            ? values.expiry_date.format("YYYY-MM-DD")
            : null,
          images: fileList.map((file) => file.originFileObj || file.url),
        };
        await supplyListingService.createListing(newListing);
        message.success("Tạo vật tư mới thành công");
      }

      setModalVisible(false);
      fetchListings();
    } catch (error) {
      console.error("Error saving listing:", error);
      message.error("Không thể lưu thông tin vật tư");
    } finally {
      setLoading(false);
    }
  };

  // Upload props for images
  const uploadProps: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([...fileList, file]);
      return false;
    },
    fileList,
  };

  // Lọc dữ liệu
  const filteredListings = listings
    .filter(
      (item) =>
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.brand &&
          item.brand.toLowerCase().includes(searchText.toLowerCase())) ||
        (item.description &&
          item.description.toLowerCase().includes(searchText.toLowerCase()))
    )
    .filter((item) => !categoryFilter || item.category === categoryFilter)
    .filter((item) => !statusFilter || item.status === statusFilter)
    .sort((a, b) => {
      if (sortField === "price") {
        return sortOrder === "ascend" ? a.price - b.price : b.price - a.price;
      } else if (sortField === "quantity") {
        return sortOrder === "ascend"
          ? a.quantity - b.quantity
          : b.quantity - a.quantity;
      } else if (sortField === "name") {
        return sortOrder === "ascend"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortField === "order_count") {
        const aCount = a.order_count || 0;
        const bCount = b.order_count || 0;
        return sortOrder === "ascend" ? aCount - bCount : bCount - aCount;
      } else {
        // Mặc định: sắp xếp theo ngày tạo
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortOrder === "ascend" ? dateA - dateB : dateB - dateA;
      }
    });

  // Định nghĩa cột cho bảng
  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: SupplyListing) => (
        <div className="flex items-center">
          <div className="w-12 h-12 mr-4 flex-shrink-0">
            <Image
              src={
                record.main_image ||
                "https://via.placeholder.com/48?text=No+Image"
              }
              alt={text}
              width={48}
              height={48}
              className="object-cover rounded"
              preview={false}
            />
          </div>
          <div>
            <span
              className="font-medium cursor-pointer text-blue-600 hover:underline"
              onClick={() =>
                record.id !== undefined && showEditModal(record.id)
              }
            >
              {text}
            </span>
            <div className="text-xs text-gray-500">#{record.id}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Danh mục",
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
      render: (price: number, record: SupplyListing) => (
        <div>
          <Text strong>
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(price)}
          </Text>
          <div className="text-xs text-gray-500">/{record.unit}</div>
        </div>
      ),
    },
    {
      title: "Tồn kho",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity: number, record: SupplyListing) => (
        <div>
          <Text
            type={
              quantity > 10 ? undefined : quantity > 0 ? "warning" : "danger"
            }
          >
            {quantity}
          </Text>{" "}
          {record.unit}
        </div>
      ),
    },
    {
      title: "Đã bán",
      dataIndex: "order_count",
      key: "order_count",
      render: (count: number) => (
        <Badge
          count={count || 0}
          showZero
          color={count > 0 ? "#1890ff" : "#d9d9d9"}
          style={{ backgroundColor: count > 0 ? "#1890ff" : "#d9d9d9" }}
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      responsive: ["md" as const],
      render: (date: string) => (
        <span>{new Date(date).toLocaleDateString("vi-VN")}</span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: SupplyListing) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="edit"
                icon={<EditOutlined />}
                onClick={() =>
                  record.id !== undefined && showEditModal(record.id)
                }
              >
                Chỉnh sửa
              </Menu.Item>

              <Menu.Divider />

              <Menu.SubMenu
                key="status"
                title="Thay đổi trạng thái"
                icon={<FilterOutlined />}
              >
                {record.status !== "active" && (
                  <Menu.Item
                    key="active"
                    icon={<CheckCircleOutlined />}
                    onClick={() =>
                      record.id !== undefined &&
                      handleChangeStatus(record.id, "active")
                    }
                  >
                    Đánh dấu đang bán
                  </Menu.Item>
                )}

                {record.status !== "sold_out" && (
                  <Menu.Item
                    key="sold_out"
                    icon={<StopOutlined />}
                    onClick={() =>
                      record.id !== undefined &&
                      handleChangeStatus(record.id, "sold_out")
                    }
                  >
                    Đánh dấu hết hàng
                  </Menu.Item>
                )}

                {record.status !== "inactive" && (
                  <Menu.Item
                    key="inactive"
                    icon={<StopOutlined />}
                    onClick={() =>
                      record.id !== undefined &&
                      handleChangeStatus(record.id, "inactive")
                    }
                  >
                    Ngừng kinh doanh
                  </Menu.Item>
                )}
              </Menu.SubMenu>

              <Menu.Divider />

              <Menu.Item
                key="delete"
                icon={<DeleteOutlined />}
                danger
                onClick={() =>
                  record.id !== undefined && handleDelete(record.id)
                }
              >
                Xóa
              </Menu.Item>
            </Menu>
          }
          trigger={["click"]}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Tiêu đề trang */}
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Quản lý vật tư nông nghiệp</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={showCreateModal}
        >
          Thêm vật tư mới
        </Button>
      </div>

      {/* Thống kê tổng quan */}
      <Row gutter={16} className="mb-6">
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng vật tư"
              value={stats.totalListings}
              prefix={<FilterOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đang bán"
              value={stats.activeListings}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đã bán"
              value={stats.totalSales}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title="Doanh thu"
              value={stats.totalRevenue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#13c2c2" }}
              formatter={(value) =>
                `${new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(value as number)}`
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Thanh tìm kiếm và lọc */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
          <div className="w-full md:w-auto">
            <Input
              placeholder="Tìm kiếm vật tư..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full md:w-80"
              allowClear
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Select
              placeholder="Loại vật tư"
              allowClear
              style={{ width: 150 }}
              onChange={(value) => setCategoryFilter(value)}
              value={categoryFilter}
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: 150 }}
              onChange={(value) => setStatusFilter(value)}
              value={statusFilter}
            >
              {Object.entries(statusLabels).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>

            <Select
              placeholder="Sắp xếp theo"
              style={{ width: 150 }}
              value={sortField}
              onChange={(value) => setSortField(value)}
            >
              <Option value="created_at">Ngày tạo</Option>
              <Option value="price">Giá</Option>
              <Option value="quantity">Tồn kho</Option>
              <Option value="order_count">Lượt bán</Option>
              <Option value="name">Tên</Option>
            </Select>

            <Tooltip
              title={
                sortOrder === "ascend" ? "Sắp xếp tăng dần" : "Sắp xếp giảm dần"
              }
            >
              <Button
                icon={
                  sortOrder === "ascend" ? (
                    <SortAscendingOutlined />
                  ) : (
                    <SortDescendingOutlined />
                  )
                }
                onClick={() =>
                  setSortOrder(sortOrder === "ascend" ? "descend" : "ascend")
                }
              />
            </Tooltip>
          </div>
        </div>
      </Card>

      {/* Bảng danh sách vật tư */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredListings.map((item) => ({
            ...item,
            key: item.id,
          }))}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} vật tư`,
          }}
          rowClassName="hover:bg-gray-50"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    Chưa có vật tư nào.{" "}
                    <Button type="link" onClick={showCreateModal}>
                      Thêm vật tư mới
                    </Button>
                  </span>
                }
              />
            ),
          }}
        />
      </Card>

      {/* Modal Form */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={initialFormValues}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Form.Item
                name="name"
                label="Tên vật tư"
                rules={[
                  { required: true, message: "Vui lòng nhập tên vật tư" },
                ]}
              >
                <Input placeholder="Nhập tên vật tư" />
              </Form.Item>
            </div>

            <Form.Item
              name="category"
              label="Danh mục"
              rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
            >
              <Select placeholder="Chọn danh mục">
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <Option key={value} value={value}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label="Trạng thái"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
            >
              <Select placeholder="Chọn trạng thái">
                {Object.entries(statusLabels).map(([value, label]) => (
                  <Option key={value} value={value}>
                    {label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="price"
              label="Giá (VNĐ)"
              rules={[{ required: true, message: "Vui lòng nhập giá" }]}
            >
              <InputNumber
                min={0}
                style={{ width: "100%" }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
              />
            </Form.Item>

            <div className="flex gap-2">
              <Form.Item
                name="quantity"
                label="Số lượng"
                rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
                className="flex-1"
              >
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                name="unit"
                label="Đơn vị"
                rules={[{ required: true, message: "Vui lòng nhập đơn vị" }]}
                className="flex-1"
              >
                <Input placeholder="kg, gói, chai..." />
              </Form.Item>
            </div>

            <Form.Item name="brand" label="Thương hiệu">
              <Input placeholder="Thương hiệu" />
            </Form.Item>

            <Form.Item name="manufacturer" label="Nhà sản xuất">
              <Input placeholder="Nhà sản xuất" />
            </Form.Item>

            <Form.Item name="manufacturing_date" label="Ngày sản xuất">
              <DatePicker placeholder="Chọn ngày" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="expiry_date" label="Hạn sử dụng">
              <DatePicker placeholder="Chọn ngày" style={{ width: "100%" }} />
            </Form.Item>

            <div className="md:col-span-2">
              <Form.Item name="description" label="Mô tả">
                <TextArea
                  rows={4}
                  placeholder="Mô tả chi tiết về sản phẩm..."
                />
              </Form.Item>
            </div>

            <Form.Item
              name="province"
              label="Tỉnh/Thành phố"
              rules={[
                { required: true, message: "Vui lòng nhập tỉnh/thành phố" },
              ]}
            >
              <Input placeholder="Tỉnh/Thành phố" />
            </Form.Item>

            <Form.Item
              name="district"
              label="Quận/Huyện"
              rules={[{ required: true, message: "Vui lòng nhập quận/huyện" }]}
            >
              <Input placeholder="Quận/Huyện" />
            </Form.Item>

            <Form.Item
              name="ward"
              label="Phường/Xã"
              rules={[{ required: true, message: "Vui lòng nhập phường/xã" }]}
            >
              <Input placeholder="Phường/Xã" />
            </Form.Item>

            <Form.Item
              name="address"
              label="Địa chỉ cụ thể"
              rules={[
                { required: true, message: "Vui lòng nhập địa chỉ cụ thể" },
              ]}
            >
              <Input placeholder="Số nhà, tên đường..." />
            </Form.Item>

            <div className="md:col-span-2">
              <Form.Item label="Hình ảnh" name="images">
                <Upload {...uploadProps} listType="picture-card" multiple>
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                  </div>
                </Upload>
              </Form.Item>
            </div>
          </div>

          <Divider />

          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalVisible(false)}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {currentId ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplyListingsManagement;
