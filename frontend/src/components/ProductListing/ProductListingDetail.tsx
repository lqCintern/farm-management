import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getProductListingById,
  ProductListing,
  toggleProductListingStatus,
} from "@/services/marketplace/productListingsService";
import {
  Card,
  Typography,
  Descriptions,
  Carousel,
  Button,
  Tag,
  message,
  Modal,
  Divider,
  Space,
  Avatar,
} from "antd";
import {
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  MessageOutlined,
  ExclamationCircleOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { createOrFindConversation } from "@/services/marketplace/conversationService";
import CreateOrderForm from "@/components/ProductOrder/CreateOrderForm";

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

export default function ProductListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [listing, setListing] = useState<ProductListing | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = (await getProductListingById(parseInt(id))) as {
          product_listing: ProductListing;
        };
        setListing(response.product_listing);
      } catch (err: any) {
        console.error("Failed to fetch product listing:", err);
        setError(err.message || "Failed to load product listing details");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleEdit = () => {
    navigate(`/products/${id}/edit`);
  };

  const handleToggleStatus = async () => {
    if (!id || !listing) return;

    const newStatus = listing.status === 1 ? 3 : 1; // 1: active, 3: hidden
    const statusText = newStatus === 1 ? "hiển thị" : "ẩn";

    confirm({
      title: `Xác nhận ${statusText} sản phẩm`,
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn ${statusText} sản phẩm này không?`,
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setStatusLoading(true);
          const statusMapping: { [key: number]: "activate" | "hide" } = {
            1: "activate",
            3: "hide",
          };
          await toggleProductListingStatus(
            parseInt(id),
            statusMapping[newStatus]
          );
          message.success(`Đã ${statusText} sản phẩm thành công`);
          setListing({
            ...listing,
            status: newStatus,
          });
        } catch (error) {
          console.error("Error toggling status:", error);
          message.error("Đã có lỗi xảy ra");
        } finally {
          setStatusLoading(false);
        }
      },
    });
  };

  const handleDelete = () => {
    if (!id) return;

    confirm({
      title: "Xác nhận xóa sản phẩm",
      icon: <ExclamationCircleOutlined />,
      content:
        "Khi xóa, bạn không thể khôi phục sản phẩm này. Bạn có chắc chắn muốn xóa không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          // Thực hiện xóa sản phẩm
          // await deleteProductListing(parseInt(id));
          message.success("Đã xóa sản phẩm thành công");
          navigate("/my-products");
        } catch (error) {
          console.error("Error deleting product:", error);
          message.error("Đã có lỗi xảy ra khi xóa sản phẩm");
        }
      },
    });
  };

  const handleStartConversation = async () => {
    if (!listing?.user_id) {
      message.error("Không thể nhắn tin do thiếu thông tin người bán");
      return;
    }

    try {
      setChatLoading(true);

      // Sử dụng service để tạo/tìm cuộc hội thoại
      const result = await createOrFindConversation(
        id || "", // ID của sản phẩm
        listing.user_id, // ID của người bán
        "Xin chào, tôi quan tâm đến sản phẩm của bạn!" // Tin nhắn mặc định
      );

      // Nếu thành công, chuyển đến trang chat
      if (result.conversation_id) {
        message.success("Đã bắt đầu cuộc trò chuyện");
        navigate(`/chat`); // Điều chỉnh đường dẫn theo ứng dụng của bạn
      } else {
        throw new Error("Không nhận được ID cuộc trò chuyện");
      }
    } catch (error) {
      console.error("Lỗi khi tạo cuộc trò chuyện:", error);
      message.error("Không thể bắt đầu cuộc trò chuyện. Vui lòng thử lại sau.");
    } finally {
      setChatLoading(false);
    }
  };

  const userRole = "trader"; // Giả lập vai trò người dùng, thay thế bằng giá trị thực tế từ context hoặc props

  const renderBuyerActions = () => {
    if (userRole === "trader") {
      return (
        <Button
          type="primary"
          size="large"
          icon={<ShoppingCartOutlined />}
          onClick={() => setOrderModalVisible(true)}
          className="mt-4"
          block
        >
          Đặt mua sản phẩm
        </Button>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {error || "Không tìm thấy thông tin sản phẩm"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="overflow-hidden shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Images Section */}
          <div className="md:col-span-2">
            {listing.product_images && listing.product_images.length > 0 ? (
              <Carousel
                autoplay
                className="bg-gray-100 rounded-lg overflow-hidden"
              >
                {listing.product_images.map((image, index) => (
                  <div key={index} className="h-80 md:h-96">
                    <img
                      src={image.image_url}
                      alt={`${listing.title} - Hình ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </Carousel>
            ) : (
              <div className="bg-gray-200 h-80 md:h-96 flex items-center justify-center rounded-lg">
                <Text type="secondary">Không có hình ảnh</Text>
              </div>
            )}

            {/* Product Details */}
            <div className="mt-6">
              <Title level={2}>{listing.title}</Title>

              <div className="flex flex-wrap items-center gap-2 mt-2 mb-4">
                <Tag color="green">{listing.product_type}</Tag>
                <Tag color={listing.status === 1 ? "blue" : "red"}>
                  {listing.status === 1 ? "Đang bán" : "Đã ẩn"}
                </Tag>
                {listing.quantity && (
                  <Tag color="volcano">Số lượng: {listing.quantity}</Tag>
                )}
              </div>

              <Divider />

              <Title level={4} className="text-red-500">
                {formatCurrency(listing.price_expectation || 0)}
              </Title>

              <Divider />

              <Title level={5}>Mô tả sản phẩm</Title>
              <Paragraph className="text-gray-600 whitespace-pre-line">
                {listing.description || "Không có mô tả chi tiết"}
              </Paragraph>

              <Divider />

              <Title level={5}>Thông tin chi tiết</Title>
              <Descriptions column={{ xs: 1, sm: 2 }} bordered>
                <Descriptions.Item label="Loại sản phẩm">
                  {listing.product_type}
                </Descriptions.Item>
                <Descriptions.Item label="Số lượng">
                  {listing.quantity || "Chưa cập nhật"}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian thu hoạch">
                  {listing.harvest_start_date && listing.harvest_end_date
                    ? `${formatDate(listing.harvest_start_date)} - ${formatDate(
                        listing.harvest_end_date
                      )}`
                    : "Chưa cập nhật"}
                </Descriptions.Item>
                <Descriptions.Item label="Vị trí">
                  {listing.province && listing.district && listing.ward
                    ? `${listing.ward}, ${listing.district}, ${listing.province}`
                    : "Chưa cập nhật"}
                </Descriptions.Item>
              </Descriptions>
            </div>
            <div className="mt-4">
              {/* Chỉ hiển thị nút khi người xem không phải người bán */}
              {/* Replace currentUser with a valid user object */}
              {false && (
                <Button
                  type="primary"
                  icon={<MessageOutlined />}
                  loading={chatLoading}
                  onClick={handleStartConversation}
                  className="w-full"
                >
                  Nhắn tin với người bán
                </Button>
              )}
            </div>
          </div>

          {/* Seller & Actions Section */}
          <div>
            <Card title="Thông tin người bán" className="shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <Avatar size={48} className="bg-green-500">
                  {listing.seller_name?.charAt(0) || "U"}
                </Avatar>
                <div>
                  <Title level={5} className="mb-0">
                    {listing.seller_name || "Người bán chưa cập nhật tên"}
                  </Title>
                  <Text type="secondary">Thành viên</Text>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <PhoneOutlined />
                  <Text>
                    {listing.seller_name || "Chưa cập nhật số điện thoại"}
                  </Text>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <EnvironmentOutlined />
                  <Text>{listing.address || "Chưa cập nhật địa chỉ"}</Text>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarOutlined />
                  <Text>Ngày đăng: {formatDate(listing.created_at || "")}</Text>
                </div>
              </div>

              {/* Actions */}
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  block
                  onClick={handleEdit}
                >
                  Chỉnh sửa
                </Button>
                <Button
                  icon={
                    listing.status === 1 ? (
                      <EyeInvisibleOutlined />
                    ) : (
                      <EyeOutlined />
                    )
                  }
                  block
                  loading={statusLoading}
                  onClick={handleToggleStatus}
                >
                  {listing.status === 1 ? "Ẩn sản phẩm" : "Hiển thị sản phẩm"}
                </Button>
                <Button
                  icon={<MessageOutlined />}
                  block
                  onClick={handleStartConversation} // Gọi hàm bắt đầu cuộc hội thoại
                >
                  Nhắn tin
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  block
                  onClick={handleDelete}
                >
                  Xóa sản phẩm
                </Button>
              </Space>
            </Card>

            {/* Buyer Action - Đặt mua sản phẩm */}
            {renderBuyerActions()}
          </div>
        </div>
      </Card>

      {/* Đặt hàng - Modal Form */}
      {orderModalVisible && (
        <CreateOrderForm
          visible={orderModalVisible}
          onClose={() => setOrderModalVisible(false)}
          productListing={listing}
        />
      )}
    </div>
  );
}
