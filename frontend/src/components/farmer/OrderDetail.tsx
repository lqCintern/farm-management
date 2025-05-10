import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Descriptions,
  Tag,
  Divider,
  Steps,
  Space,
  Modal,
  Rate,
  Input,
  message,
  Image,
  Row,
  Col,
  Timeline,
  Spin,
  Alert,
  Breadcrumb,
  Avatar,
} from "antd";
import {
  ShoppingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  CommentOutlined,
  StarOutlined,
  LeftOutlined,
  RightOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import supplyOrderService, { SupplyOrder } from "@/services/supplyOrderService";
import reviewService from "@/services/reviewService";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Step } = Steps;
const { confirm } = Modal;

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<SupplyOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewModalVisible, setReviewModalVisible] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(5);
  const [reviewContent, setReviewContent] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    if (id) {
      fetchOrderDetail(parseInt(id, 10));
    }
  }, [id]);

  const fetchOrderDetail = async (orderId: number) => {
    setLoading(true);
    try {
      const response = await supplyOrderService.getFarmerOrderById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error("Error fetching order details:", error);
      message.error("Không thể tải thông tin đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = () => {
    if (!id) return;

    confirm({
      title: "Xác nhận hủy đơn hàng",
      icon: <ExclamationCircleOutlined />,
      content: "Bạn có chắc chắn muốn hủy đơn hàng này không?",
      okText: "Xác nhận hủy",
      okType: "danger",
      cancelText: "Không",
      onOk: async () => {
        try {
          await supplyOrderService.cancelOrder(parseInt(id, 10));
          message.success("Hủy đơn hàng thành công");
          fetchOrderDetail(parseInt(id, 10));
        } catch (error) {
          console.error("Error cancelling order:", error);
          message.error("Không thể hủy đơn hàng");
        }
      },
    });
  };

  const handleCompleteOrder = () => {
    if (!id) return;

    confirm({
      title: "Xác nhận đã nhận hàng",
      icon: <CheckCircleOutlined style={{ color: "green" }} />,
      content: "Bạn xác nhận đã nhận được hàng và thanh toán cho nhà cung cấp?",
      okText: "Đã nhận hàng",
      cancelText: "Chưa nhận",
      onOk: async () => {
        try {
          await supplyOrderService.completeOrder(parseInt(id, 10));
          message.success("Xác nhận đã nhận hàng thành công");
          fetchOrderDetail(parseInt(id, 10));
          setReviewModalVisible(true);
        } catch (error) {
          console.error("Error completing order:", error);
          message.error("Không thể xác nhận đã nhận hàng");
        }
      },
    });
  };

  const handleReviewSubmit = async () => {
    if (!id || !order) return;

    setSubmittingReview(true);
    try {
      await reviewService.createReview({
        supply_order_id: parseInt(id, 10),
        review: {
          rating,
          content: reviewContent,
        },
      });

      message.success("Đánh giá thành công");
      setReviewModalVisible(false);
      fetchOrderDetail(parseInt(id, 10));
    } catch (error) {
      console.error("Error submitting review:", error);
      message.error("Không thể gửi đánh giá");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getOrderStatusStep = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "confirmed":
        return 1;
      case "shipped":
        return 2;
      case "delivered":
        return 3;
      case "completed":
        return 4;
      case "cancelled":
      case "rejected":
        return -1;
      default:
        return 0;
    }
  };

  const getOrderStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: "blue", text: "Chờ xác nhận" },
      confirmed: { color: "cyan", text: "Đã xác nhận" },
      shipped: { color: "geekblue", text: "Đang giao hàng" },
      delivered: { color: "volcano", text: "Đã giao hàng" },
      completed: { color: "green", text: "Hoàn thành" },
      cancelled: { color: "red", text: "Đã hủy" },
      rejected: { color: "magenta", text: "Bị từ chối" },
    };

    const statusInfo = statusMap[status] || {
      color: "default",
      text: "Không xác định",
    };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPaymentMethodText = (method: string) => {
    const methodMap: Record<string, string> = {
      cod: "Thanh toán khi nhận hàng (COD)",
      bank_transfer: "Chuyển khoản ngân hàng",
      momo: "Ví MoMo",
      zalopay: "ZaloPay",
    };

    return methodMap[method] || method;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <Title level={3}>Không tìm thấy thông tin đơn hàng</Title>
        <Button type="primary" onClick={() => navigate("/orders")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item>
            <a href="/orders">Quản lý đơn hàng</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Chi tiết đơn hàng #{order.id}</Breadcrumb.Item>
        </Breadcrumb>

        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <Title level={3} className="mb-1">
                Đơn hàng #{order.id}
              </Title>
              <Text type="secondary">
                Ngày đặt: {formatDate(order.created_at)}
              </Text>
            </div>

            <div className="flex items-center">
              <Text className="mr-2">Trạng thái:</Text>
              {getOrderStatusTag(order.status)}
            </div>
          </div>

          {/* Hiển thị lý do từ chối nếu đơn hàng bị từ chối */}
          {order.status === "rejected" && order.rejection_reason && (
            <Alert
              message="Đơn hàng bị từ chối"
              description={`Lý do: ${order.rejection_reason}`}
              type="error"
              showIcon
              className="mb-4"
            />
          )}

          {/* Hiển thị các bước đơn hàng */}
          {order.status !== "cancelled" && order.status !== "rejected" && (
            <Steps current={getOrderStatusStep(order.status)} className="mb-8">
              <Step
                title="Đặt hàng"
                description="Chờ xác nhận"
                icon={<ShoppingOutlined />}
              />
              <Step
                title="Xác nhận"
                description="Nhà cung cấp xác nhận"
                icon={<CheckCircleOutlined />}
              />
              <Step
                title="Giao hàng"
                description="Đang giao hàng"
                icon={<RightOutlined />}
              />
              <Step
                title="Đã giao"
                description="Chờ xác nhận"
                icon={<InboxOutlined />}
              />
              <Step
                title="Hoàn thành"
                description="Đã nhận hàng"
                icon={<CheckCircleOutlined />}
              />
            </Steps>
          )}

          <Row gutter={[24, 24]}>
            <Col span={16}>
              <Card title="Thông tin sản phẩm" bordered={false}>
                <div className="flex items-center mb-4">
                  <Image
                    src={
                      order.supply_listing_id
                        ? `https://example.com/supply-listings/${order.supply_listing_id}/image`
                        : "https://via.placeholder.com/100"
                    }
                    alt={order.name}
                    width={100}
                    height={100}
                    className="object-cover rounded mr-4"
                  />
                  <div>
                    <Title level={5}>{order.name}</Title>
                    <Tag color="blue">{order.category}</Tag>
                    <div className="mt-2">
                      {/* <Text className="block">
                        Đơn giá:{" "}
                        <Text strong>{order.price.toLocaleString()} đ</Text>/
                        {order.supply_listing_id.unit}
                      </Text> */}
                      <Text className="block">
                        Số lượng: <Text strong>{order.quantity}</Text>{" "}
                        {order.unit}
                      </Text>
                      <Text className="block">
                        Thành tiền:{" "}
                        <Text strong className="text-red-600">
                          {(order.price * order.quantity).toLocaleString()} đ
                        </Text>
                      </Text>
                    </div>
                  </div>
                </div>

                {order.note && (
                  <div className="mt-4">
                    <Title level={5}>Ghi chú:</Title>
                    <Paragraph>{order.note}</Paragraph>
                  </div>
                )}
              </Card>

              <Card
                title="Thông tin giao hàng"
                bordered={false}
                className="mt-4"
              >
                <Descriptions layout="vertical" column={1}>
                  <Descriptions.Item label="Số điện thoại">
                    <PhoneOutlined className="mr-2" />
                    {order.contact_phone}
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ giao hàng">
                    <EnvironmentOutlined className="mr-2" />
                    {`${order.delivery_address}, ${order.delivery_ward}, ${order.delivery_district}, ${order.delivery_province}`}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phương thức thanh toán">
                    <CreditCardOutlined className="mr-2" />
                    {getPaymentMethodText(order.payment_method)}
                  </Descriptions.Item>
                  {/* <Descriptions.Item label="Trạng thái thanh toán">
                    {order.is_paid ? (
                      <Tag color="green">Đã thanh toán</Tag>
                    ) : (
                      <Tag color="orange">Chưa thanh toán</Tag>
                    )}
                  </Descriptions.Item> */}
                </Descriptions>
              </Card>
            </Col>

            <Col span={8}>
              <Card title="Nhà cung cấp" bordered={false}>
                <div className="mb-3">
                  <Avatar size={64} icon={<UserOutlined />} className="mb-2" />
                  <Title level={5}>{order.name}</Title>
                </div>

                <Descriptions layout="vertical" column={1}>
                  <Descriptions.Item label="Số điện thoại">
                    <PhoneOutlined className="mr-2" />
                  </Descriptions.Item>
                </Descriptions>
                {/* 
                {order.status === "completed" && !order.has_review && (
                  <Button
                    type="primary"
                    icon={<StarOutlined />}
                    onClick={() => setReviewModalVisible(true)}
                    className="mt-4 w-full"
                  >
                    Đánh giá nhà cung cấp
                  </Button>
                )} */}
                {/* 
                {order.has_review && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <Text strong>Bạn đã đánh giá đơn hàng này</Text>
                  </div>
                )} */}
              </Card>

              <Card title="Thao tác" bordered={false} className="mt-4">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button
                    type="primary"
                    ghost
                    icon={<LeftOutlined />}
                    onClick={() => navigate("/orders")}
                    block
                  >
                    Quay lại danh sách
                  </Button>

                  {order.status === "pending" && (
                    <Button
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={handleCancelOrder}
                      block
                    >
                      Hủy đơn hàng
                    </Button>
                  )}

                  {order.status === "delivered" && (
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={handleCompleteOrder}
                      block
                    >
                      Xác nhận đã nhận hàng
                    </Button>
                  )}

                  {(order.status === "completed" ||
                    order.status === "delivered") && (
                    <Button
                      icon={<ShoppingOutlined />}
                      onClick={() =>
                        navigate(`/supply-listings/${order.supply_listing_id}`)
                      }
                      block
                    >
                      Mua lại
                    </Button>
                  )}
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Modal đánh giá */}
      <Modal
        title="Đánh giá nhà cung cấp"
        visible={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setReviewModalVisible(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submittingReview}
            onClick={handleReviewSubmit}
            disabled={reviewContent.length < 5}
          >
            Gửi đánh giá
          </Button>,
        ]}
      >
        <div className="py-4">
          <div className="mb-4">
            <Text>Vui lòng đánh giá nhà cung cấp:</Text>
            <div className="flex justify-center my-4">
              <Rate value={rating} onChange={setRating} allowHalf />
            </div>
          </div>

          <div className="mb-4">
            <Text>Nhận xét của bạn:</Text>
            <TextArea
              rows={4}
              value={reviewContent}
              onChange={(e) => setReviewContent(e.target.value)}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm và nhà cung cấp..."
              className="mt-2"
            />
            {reviewContent.length < 5 && (
              <Text type="danger" className="mt-1 block">
                Vui lòng nhập ít nhất 5 ký tự
              </Text>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetail;
