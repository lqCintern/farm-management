import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Spin,
  Image,
  Row,
  Col,
  Breadcrumb,
  message,
  Descriptions,
  Tag,
  Space,
  Divider,
  InputNumber,
  Statistic,
  Tooltip,
} from "antd";
import supplyListingService from "@/services/supply_chain/supplyListingService";
import { formatCurrency } from "@/utils/formatters";
import { ShoppingCartOutlined, HeartOutlined, InfoCircleOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

const SupplyListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (id) {
      fetchListing(parseInt(id, 10));
    }
  }, [id]);

  const fetchListing = async (listingId: number) => {
    setLoading(true);
    try {
      const response = await supplyListingService.getListingById(listingId);
      setListing(response.data);
    } catch (error) {
      console.error("Error fetching listing:", error);
      message.error("Không thể tải thông tin vật tư");
    } finally {
      setLoading(false);
    }
  };

  // Tính tổng tiền
  const totalPrice = useMemo(() => {
    if (!listing) return 0;
    return listing.price * quantity;
  }, [listing, quantity]);

  // Xử lý thêm vào giỏ hàng
  const handleAddToCart = () => {
    message.success(`Đã thêm ${quantity} ${listing.unit} ${listing.name} vào giỏ hàng`);
    // Gọi API thêm vào giỏ hàng ở đây
  };

  // Xử lý mua ngay
  const handleBuyNow = () => {
    navigate(`/checkout`, { 
      state: { 
        listingId: listing.id,
        quantity: quantity,
        totalPrice: totalPrice
      } 
    });
  };

  // Hiển thị trạng thái vật tư
  const getStatusTag = (status: number) => {
    switch (status) {
      case 1:
        return <Tag color="green">Đang bán</Tag>;
      case 2:
        return <Tag color="orange">Sắp hết hàng</Tag>;
      case 0:
        return <Tag color="red">Hết hàng</Tag>;
      default:
        return <Tag color="default">Không xác định</Tag>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-20">
        <Title level={3}>Không tìm thấy thông tin vật tư</Title>
        <Button type="primary" onClick={() => navigate("/supply-listings")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item>
          <a href="/">Trang chủ</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <a href="/supply-listings">Vật tư nông nghiệp</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{listing.name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Product Info */}
      <Card>
        <Row gutter={[24, 24]}>
          {/* Product Image */}
          <Col xs={24} md={10}>
            <Image
              src={listing.main_image || "https://via.placeholder.com/500"}
              alt={listing.name}
              className="object-cover w-full rounded-lg"
              width="100%"
              height={400}
              fallback="data:image/png;base64,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"
            />
            {listing.supply_images && listing.supply_images.length > 1 && (
              <div className="mt-4 flex space-x-2 overflow-auto">
                {listing.supply_images.slice(0, 5).map((image: any, index: number) => (
                  <Image
                    key={index}
                    src={image.image_url}
                    alt={`${listing.name}-${index}`}
                    className="object-cover rounded-md cursor-pointer"
                    width={80}
                    height={80}
                  />
                ))}
              </div>
            )}
          </Col>

          {/* Product Details */}
          <Col xs={24} md={14}>
            <div className="flex justify-between items-center">
              <Title level={3} className="mb-1">{listing.name}</Title>
              {getStatusTag(listing.status)}
            </div>
            
            {/* Cải thiện hiển thị giá */}
            <div className="flex items-baseline gap-2 my-4">
              <Statistic 
                value={listing.price} 
                formatter={(value) => (
                  <span className="text-green-600 font-semibold">
                    {formatCurrency(Number(value))}
                  </span>
                )}
              />
              <span className="text-gray-500">/ {listing.unit || "đơn vị"}</span>
            </div>
            
            <Divider />
            
            <Descriptions column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }} className="mb-4">
              {listing.brand && (
                <Descriptions.Item label="Thương hiệu">{listing.brand}</Descriptions.Item>
              )}
              {listing.manufacturer && (
                <Descriptions.Item label="Nhà sản xuất">{listing.manufacturer}</Descriptions.Item>
              )}
              {listing.manufacturing_date && (
                <Descriptions.Item label="Ngày sản xuất">
                  {new Date(listing.manufacturing_date).toLocaleDateString('vi-VN')}
                </Descriptions.Item>
              )}
              {listing.expiry_date && (
                <Descriptions.Item label="Hạn sử dụng">
                  {new Date(listing.expiry_date).toLocaleDateString('vi-VN')}
                </Descriptions.Item>
              )}
              {listing.category && (
                <Descriptions.Item label="Phân loại">
                  {typeof listing.category === 'number' 
                    ? getCategoryName(listing.category)
                    : listing.category}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Kho hàng">
                {listing.quantity} {listing.unit || "đơn vị"}
              </Descriptions.Item>
              {listing.location && (
                <Descriptions.Item label="Xuất xứ">
                  {listing.location}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />
            
            <Paragraph className="text-gray-700 mb-6">
              {listing.description || "Không có mô tả chi tiết về sản phẩm này."}
            </Paragraph>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center">
                <Text strong className="mr-4">Số lượng:</Text>
                <InputNumber 
                  min={1} 
                  max={listing.quantity} 
                  defaultValue={1}
                  onChange={(value) => setQuantity(value || 1)}
                  className="w-20"
                />
              </div>
              
              <div className="flex items-center">
                <Text type="secondary" className="mr-2">
                  Còn lại: {listing.quantity} {listing.unit || "đơn vị"}
                </Text>
                <Tooltip title="Số lượng có thể thay đổi">
                  <InfoCircleOutlined className="text-gray-400" />
                </Tooltip>
              </div>
            </div>

            {/* Thêm hiển thị tổng tiền */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <Text strong>Thành tiền:</Text>
                <Statistic
                  value={totalPrice}
                  precision={0}
                  valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
                  formatter={(value) => formatCurrency(Number(value))}
                  className="mb-0"
                />
              </div>
            </div>
            
            <Space size="middle">
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                onClick={handleAddToCart}
              >
                Thêm vào giỏ hàng
              </Button>
              <Button
                type="default"
                size="large"
                onClick={handleBuyNow}
              >
                Mua ngay
              </Button>
            </Space>

            <div className="mt-6">
              <Text type="secondary" className="text-sm">
                Người bán: {listing.seller?.fullname || "N/A"}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>
      
      {/* Mô tả chi tiết */}
      {listing.details && (
        <Card title="Chi tiết sản phẩm" className="mt-4">
          <div dangerouslySetInnerHTML={{ __html: listing.details }} />
        </Card>
      )}
    </div>
  );
};

// Helper function để hiển thị tên danh mục từ mã số
const getCategoryName = (categoryCode: number) => {
  const categories: Record<number, string> = {
    1: "Phân bón",
    2: "Thuốc bảo vệ thực vật",
    3: "Hạt giống",
    4: "Công cụ & dụng cụ",
    5: "Máy móc & thiết bị",
    6: "Vật tư khác"
  };
  
  return categories[categoryCode] || "Khác";
};

export default SupplyListingDetail;