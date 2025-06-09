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
  Tabs,
  Statistic,
  Row,
  Col,
  Badge,
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
  ClockCircleOutlined,
  TagOutlined,
  BarChartOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { formatCurrency, formatDate } from "@/utils/formatters";
import { createOrFindConversation } from "@/services/marketplace/conversationService";
import CreateOrderForm from "@/components/ProductOrder/CreateOrderForm";
import { getUserProfile } from '@/services/users/authService';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;
const { TabPane } = Tabs;

export default function ProductListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [listing, setListing] = useState<ProductListing | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("1");

  // Thêm state để theo dõi lỗi ảnh
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  // Kiểm tra vai trò người dùng (sẽ được thay thế bằng auth context)
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await getProductListingById(parseInt(id));
        console.log("Product listing API response:", response);

        // Đảm bảo cấu trúc dữ liệu nhất quán
        if (typeof response !== "object" || response === null) {
          throw new Error("Invalid response from API");
        }

        const typedResponse = response as {
          product_listing: ProductListing;
          seller: { user_name: string; fullname: string };
          product_images?: any[];
        };

        let productData = typedResponse.product_listing;

        // Nếu product_images có trong response nhưng không có trong product_listing
        if (!productData.product_images && typedResponse.product_images) {
          productData = {
            ...productData,
            product_images: typedResponse.product_images,
          };
        }

        // Đảm bảo product_images luôn là mảng
        if (!productData.product_images) {
          productData.product_images = [];
        }

        // Thiết lập thông tin người bán từ response
        if (typedResponse.seller) {
          productData.seller_detail = typedResponse.seller;
        }

        setListing(productData);
      } catch (err: any) {
        console.error("Failed to fetch product listing:", err);
        setError(err.message || "Failed to load product listing details");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  // Lấy thông tin người dùng khi component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const profile = await getUserProfile();
        const userType = (profile as { user_type: string }).user_type;
        const userId = (profile as { user_id: number }).user_id;
        
        setUserRole(userType);
        setCurrentUserId(userId);
        
        // Kiểm tra quyền sở hữu nếu listing đã được tải
        if (listing && userId === listing.user_id) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };
    
    fetchUserInfo();
  }, []);

  // Cập nhật isOwner mỗi khi listing thay đổi
  useEffect(() => {
    if (listing && currentUserId) {
      setIsOwner(currentUserId === listing.user_id);
    }
  }, [listing, currentUserId]);

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

  const renderBuyerActions = () => {
    if (userRole === "trader" && !isOwner) {
      return (
        <Card className="mb-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={() => setOrderModalVisible(true)}
              block
            >
              Đặt mua sản phẩm
            </Button>
            <Button
              icon={<MessageOutlined />}
              size="large"
              onClick={handleStartConversation}
              loading={chatLoading}
              block
            >
              Nhắn tin với người bán
            </Button>
          </div>
        </Card>
      );
    }
    return null;
  };

  // Hàm hiển thị ảnh giữ nguyên
  const getImageUrl = (image: any, index: number): string => {
    // Nếu ảnh đã bị lỗi trước đó
    if (imageErrors[index]) {
      return "/images/placeholder-pineapple.jpg";
    }

    // Xử lý các trường hợp khác nhau
    if (typeof image === "string") {
      return image;
    }

    if (image && typeof image === "object") {
      // Nếu image là object với thuộc tính image_url
      if ("image_url" in image && image.image_url) {
        return image.image_url;
      }
      // Nếu image là object với thuộc tính url
      if ("url" in image && image.url) {
        return image.url;
      }
    }

    // Fallback cho ảnh mặc định
    return "/images/placeholder-pineapple.jpg";
  };

  // Hàm render bản đồ Google Maps
  const renderGoogleMap = () => {
    if (listing?.latitude && listing?.longitude) {
      return (
        <div className="mt-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium mb-1">Vị trí sản phẩm</p>
                <p className="text-gray-600 text-sm">
                  {`${listing.latitude.toString().substring(0, 8)}, ${listing.longitude.toString().substring(0, 8)}`}
                </p>
              </div>
              <a
                href={
                  listing.google_maps_url ||
                  `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
              >
                <EnvironmentOutlined /> Xem trên Google Maps
              </a>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Hiển thị trạng thái loading
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Hiển thị lỗi
  if (error || !listing) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {error || "Không tìm thấy thông tin sản phẩm"}
        </div>
      </div>
    );
  }

  // Thông tin chi tiết về mùa vụ dứa (từ pineapple_crop)
  const renderCropDetails = () => {
    if (listing.pineapple_crop) {
      const crop = listing.pineapple_crop;
      return (
        <Card title="Thông tin mùa vụ" className="mt-4 shadow-sm">
          <Descriptions column={{ xs: 1, sm: 2 }} bordered>
            <Descriptions.Item label="Giống dứa">
              {crop.variety || "Không có thông tin"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày trồng">
              {formatDate(crop.planting_date) || "Không có thông tin"}
            </Descriptions.Item>
            <Descriptions.Item label="Giai đoạn hiện tại">
              <Badge
                status={
                  crop.current_stage === "harvesting"
                    ? "success"
                    : "processing"
                }
                text={
                  crop.current_stage === "harvesting"
                    ? "Đang thu hoạch"
                    : crop.current_stage
                }
              />
            </Descriptions.Item>
            <Descriptions.Item label="Mã vườn/ruộng">
              {crop.field_id || "Không có thông tin"}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      );
    }
    return null;
  };

  // Renderer chính đã được đơn giản hóa
  return (
    <div className="container mx-auto p-4">
      {/* Mobile navigation tabs - chỉ hiển thị trên mobile */}
      <div className="md:hidden mb-4">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Thông tin" key="1" />
          <TabPane tab="Chi tiết" key="2" />
        </Tabs>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Hình ảnh và thông tin chính */}
        <div className="lg:col-span-2">
          {/* Carousel hình ảnh */}
          <Card className="shadow-sm mb-6">
            {listing.product_images && listing.product_images.length > 0 ? (
              <div className="relative">
                <Carousel autoplay className="bg-gray-100 rounded-lg overflow-hidden">
                  {listing.product_images.map((image, index) => (
                    <div key={index} className="h-80 md:h-96">
                      <img
                        src={getImageUrl(image, index)}
                        alt={`${listing.title} - Hình ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          setImageErrors((prev) => ({...prev, [index]: true}));
                          (e.target as HTMLImageElement).src = "/images/placeholder-pineapple.jpg";
                        }}
                      />
                    </div>
                  ))}
                </Carousel>
                <div className="absolute top-2 right-2">
                  <Badge count={listing.product_images.length} overflowCount={99} />
                </div>
              </div>
            ) : listing.thumbnail ? (
              <div className="h-80 md:h-96 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={listing.thumbnail}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/placeholder-pineapple.jpg";
                  }}
                />
              </div>
            ) : (
              <div className="bg-gray-200 h-80 md:h-96 flex items-center justify-center rounded-lg">
                <Text type="secondary">Không có hình ảnh</Text>
              </div>
            )}

            {/* Thông tin cơ bản và quan trọng nhất */}
            <div className="mt-6">
              <div className="flex items-center justify-between flex-wrap">
                <Title level={2} className="mb-2">{listing.title}</Title>
                <Title level={3} className="text-red-500 m-0">
                  {formatCurrency(listing.price_expectation || 0)}
                </Title>
              </div>

              {/* Thẻ tags quan trọng */}
              <div className="flex flex-wrap items-center gap-2 my-3">
                <Tag color="green">{listing.product_type}</Tag>
                <Tag color={listing.status === 1 ? "blue" : "red"}>
                  {listing.status === 1 ? "Đang bán" : "Đã ẩn"}
                </Tag>
                {listing.pineapple_crop?.current_stage && (
                  <Tag color="purple">
                    Giai đoạn: {listing.pineapple_crop.current_stage === "harvesting" ? "Đang thu hoạch" : listing.pineapple_crop.current_stage}
                  </Tag>
                )}
              </div>
              
              {/* Thông số chính - được làm nổi bật */}
              <Row gutter={[16, 16]} className="my-4">
                <Col span={8}>
                  <Card size="small" className="text-center">
                    <Statistic 
                      title="Số lượng" 
                      value={listing.quantity || "N/A"}
                      valueStyle={{ color: '#3f8600' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" className="text-center">
                    <Statistic 
                      title="Kích thước TB" 
                      value={listing.average_size ? `${listing.average_size}g` : "N/A"}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small" className="text-center">
                    <Statistic 
                      title="Trọng lượng" 
                      value={listing.total_weight ? `${listing.total_weight}kg` : "N/A"}
                      valueStyle={{ color: '#cf1322' }}
                    />
                  </Card>
                </Col>
              </Row>
              
              {/* Thời gian thu hoạch - thông tin quan trọng cho cả farmer và trader */}
              <div className="bg-green-50 p-3 rounded-lg mb-4">
                <div className="flex items-center text-green-800">
                  <ClockCircleOutlined className="text-xl mr-2" />
                  <div>
                    <p className="font-medium mb-1">Thời gian thu hoạch</p>
                    <p>
                      {listing.harvest_start_date && listing.harvest_end_date
                        ? `${formatDate(listing.harvest_start_date)} - ${formatDate(listing.harvest_end_date)}`
                        : "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Mô tả sản phẩm - chỉ hiển thị nếu có */}
              {listing.description && (
                <div className="mb-4">
                  <Title level={5}>Mô tả</Title>
                  <Paragraph className="text-gray-600 whitespace-pre-line">
                    {listing.description}
                  </Paragraph>
                </div>
              )}
              
              {/* Vị trí */}
              {(listing.latitude && listing.longitude) && (
                <div className="mt-3">
                  <a
                    href={
                      listing.google_maps_url ||
                      `https://www.google.com/maps?q=${listing.latitude},${listing.longitude}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
                  >
                    <EnvironmentOutlined /> Xem vị trí trên bản đồ
                  </a>
                </div>
              )}
            </div>
          </Card>
          
          {/* Tab 2: Thông tin chi tiết - chỉ hiển thị khi chọn tab hoặc trên desktop */}
          {(activeTab === "2" || window.innerWidth >= 768) && (
            <>
              {/* Thông tin mùa vụ - quan trọng cho farmer */}
              {listing.pineapple_crop && (
                <Card title="Thông tin mùa vụ" className="shadow-sm mb-6" size="small">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500">Giống dứa</p>
                      <p className="font-medium">{listing.pineapple_crop.variety || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ngày trồng</p>
                      <p className="font-medium">{formatDate(listing.pineapple_crop.planting_date) || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Giai đoạn</p>
                      <p className="font-medium">
                        {listing.pineapple_crop.current_stage === "harvesting" ? "Đang thu hoạch" : listing.pineapple_crop.current_stage || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Mã ruộng</p>
                      <p className="font-medium">{listing.pineapple_crop.field_id || "N/A"}</p>
                    </div>
                  </div>
                </Card>
              )}
              
              {/* Các thông số khác - gọn gàng hơn */}
              <Card title="Thông số khác" className="shadow-sm mb-6" size="small">
                <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                  {listing.estimated_weight && (
                    <div>
                      <p className="text-gray-500">Trọng lượng ước tính</p>
                      <p className="font-medium">{listing.estimated_weight} kg</p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-gray-500">Ngày đăng</p>
                    <p className="font-medium">{formatDate(listing.created_at || "")}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500">Cập nhật lần cuối</p>
                    <p className="font-medium">{formatDate(listing.updated_at || "")}</p>
                  </div>
                  
                  <div>
                    <p className="text-gray-500">Lượt xem / Tin nhắn</p>
                    <p className="font-medium">{listing.view_count || 0} / {listing.message_count || 0}</p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
        
        {/* Right column - tách riêng theo role và action */}
        <div className="lg:col-span-1">
          {/* Phần dành cho người mua */}
          {!isOwner && (
            <Card className="mb-6 shadow-sm">
              <div className="flex flex-col gap-4">
                {/* Thông tin người bán - rút gọn */}
                <div className="flex items-center gap-3 mb-2">
                  <Avatar size={48} className="bg-green-500">
                    {listing.seller_name?.charAt(0) || "U"}
                  </Avatar>
                  <div>
                    <Title level={5} className="mb-0">
                      {listing.seller_detail?.fullname || listing.seller_name}
                    </Title>
                    <Text type="secondary">Người bán</Text>
                  </div>
                </div>
                
                <Divider className="my-3" />
                
                {/* Các nút hành động chính */}
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => setOrderModalVisible(true)}
                  block
                >
                  Đặt mua sản phẩm
                </Button>
                <Button
                  icon={<MessageOutlined />}
                  size="large"
                  onClick={handleStartConversation}
                  loading={chatLoading}
                  block
                >
                  Nhắn tin với người bán
                </Button>
                
                {/* Thông tin giá - rút gọn */}
                <div className="mt-3 bg-gray-50 p-4 rounded-lg">
                  <Title level={4} className="mb-2">Giá đề xuất</Title>
                  <Title level={2} className="text-red-500 m-0">
                    {formatCurrency(listing.price_expectation || 0)}
                  </Title>
                  <Text className="block text-gray-500 mt-2">
                    {listing.quantity && listing.average_size ? 
                      `Cho ${listing.quantity} trái dứa ${listing.average_size}g` : 
                      ""}
                  </Text>
                </div>
              </div>
            </Card>
          )}
          
          {/* Phần dành cho chủ sản phẩm */}
          {isOwner && (
            <div>
              <Card title="Tóm tắt sản phẩm" className="shadow-sm mb-6">
                <div className="space-y-3">
                  <Statistic 
                    title="Lượt xem" 
                    value={listing.view_count || 0} 
                    prefix={<EyeOutlined />}
                  />
                  <Statistic 
                    title="Tin nhắn" 
                    value={listing.message_count || 0} 
                    prefix={<MessageOutlined />}
                  />
                  <Statistic 
                    title="Đơn hàng" 
                    value={listing.order_count || 0} 
                    prefix={<ShoppingCartOutlined />}
                  />
                </div>
              </Card>
                
              <Card title="Quản lý sản phẩm" className="shadow-sm mb-6">
                <Space direction="vertical" style={{ width: "100%" }} size="middle">
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    block
                    onClick={handleEdit}
                  >
                    Chỉnh sửa sản phẩm
                  </Button>
                  <Button
                    icon={listing.status === 1 ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    block
                    loading={statusLoading}
                    onClick={handleToggleStatus}
                  >
                    {listing.status === 1 ? "Ẩn sản phẩm" : "Hiển thị sản phẩm"}
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
            </div>
          )}
        </div>
      </div>

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
