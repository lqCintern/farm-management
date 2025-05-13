import React, { useEffect, useState } from "react";
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
} from "antd";
import supplyListingService from "@/services/supply_chain/supplyListingService";

const { Title, Text } = Typography;

const SupplyListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
          <a href="/supply-listings">Vật tư nông nghiệp</a>
        </Breadcrumb.Item>
        <Breadcrumb.Item>{listing.name}</Breadcrumb.Item>
      </Breadcrumb>

      {/* Product Info */}
      <Card>
        <Row gutter={[24, 24]}>
          {/* Product Image */}
          <Col xs={24} md={12}>
            <Image
              src={listing.main_image || "https://via.placeholder.com/500"}
              alt={listing.name}
              className="object-cover w-full"
              width="100%"
              height={400}
            />
          </Col>

          {/* Product Details */}
          <Col xs={24} md={12}>
            <Title level={4}>{listing.name}</Title>
            <Text strong>Giá: </Text>
            <Text type="danger">
              {new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(listing.price)}
            </Text>
            <div className="mt-4">
              <Text>{listing.description || "Không có mô tả"}</Text>
            </div>
            <Button
              type="primary"
              className="mt-4"
              onClick={() =>
                navigate(`/checkout`, { state: { listingId: listing.id } })
              }
            >
              Mua ngay
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default SupplyListingDetail;
