import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Card,
  Typography,
  Button,
  Form,
  Input,
  Select,
  InputNumber,
  Divider,
  Row,
  Col,
  Steps,
  message,
  Space,
  Alert,
  Avatar,
} from "antd";
import {
  ShoppingCartOutlined,
  UserOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import supplyOrderService from "@/services/supplyOrderService";
import { SupplyListing as OriginalSupplyListing } from "@/services/supplyListingService";

// Extended interface with supplier property
interface SupplyListing extends OriginalSupplyListing {
  supplier?: {
    name?: string;
    phone?: string;
  };
}

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

interface LocationState {
  listingId: number;
  quantity: number;
  listing: SupplyListing;
}

const OrderCheckout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Kiểm tra nếu không có dữ liệu state từ trang chi tiết
  useEffect(() => {
    if (!state || !state.listing) {
      message.error("Thông tin đặt hàng không hợp lệ");
      navigate("/supply-listings");
    } else {
      // Điền thông tin mặc định vào form
      form.setFieldsValue({
        quantity: state.quantity || 1,
      });
    }
  }, [state, form, navigate]);

  const handleSubmit = async (values: any) => {
    if (!state?.listingId) return;

    setLoading(true);
    try {
      const orderData = {
        supply_listing_id: state.listingId,
        supply_order: {
          quantity: values.quantity,
          note: values.note,
          delivery_province: values.province,
          delivery_district: values.district,
          delivery_ward: values.ward,
          delivery_address: values.address,
          contact_phone: values.phone,
          payment_method: values.payment_method,
          name: listing.name,
          category: listing.category,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          price: listing.price,
          status: "pending", // Add a default status
          unit: listing.unit, // Use the unit from the listing
        },
      };

      const response = await supplyOrderService.createOrder(orderData);
      message.success("Đặt hàng thành công!");
      navigate(`/orders/${response.data.id}`);
    } catch (error) {
      console.error("Error creating order:", error);
      message.error("Đặt hàng thất bại. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  if (!state || !state.listing) {
    return null;
  }

  const { listing } = state;
  const totalAmount = listing.price * (state.quantity || 1);

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <Title level={2}>Thanh toán đơn hàng</Title>

        <Steps current={currentStep} className="mb-8">
          <Step title="Thông tin giao hàng" icon={<UserOutlined />} />
          <Step title="Thanh toán" icon={<CreditCardOutlined />} />
          <Step title="Hoàn tất" icon={<CheckCircleOutlined />} />
        </Steps>

        <Row gutter={24}>
          <Col span={16}>
            <Card className="mb-4">
              <Title level={4}>Thông tin giao hàng</Title>
              <Divider />

              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="quantity"
                      label="Số lượng"
                      rules={[
                        { required: true, message: "Vui lòng nhập số lượng" },
                        {
                          type: "number",
                          min: 1,
                          max: listing.quantity,
                          message: `Số lượng phải từ 1 đến ${listing.quantity}`,
                        },
                      ]}
                    >
                      <InputNumber
                        min={1}
                        max={listing.quantity}
                        style={{ width: "100%" }}
                        addonAfter={listing.unit}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="phone"
                      label="Số điện thoại liên hệ"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập số điện thoại",
                        },
                        {
                          pattern: /^[0-9]{10}$/,
                          message: "Số điện thoại không hợp lệ",
                        },
                      ]}
                    >
                      <Input
                        prefix={<PhoneOutlined />}
                        placeholder="0987654321"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="province"
                      label="Tỉnh/Thành phố"
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn tỉnh/thành phố",
                        },
                      ]}
                    >
                      <Select placeholder="Chọn tỉnh/thành phố">
                        <Option value="Hà Nội">Hà Nội</Option>
                        <Option value="Hồ Chí Minh">Hồ Chí Minh</Option>
                        <Option value="Đà Nẵng">Đà Nẵng</Option>
                        {/* Add more provinces */}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="district"
                      label="Quận/Huyện"
                      rules={[
                        { required: true, message: "Vui lòng chọn quận/huyện" },
                      ]}
                    >
                      <Select placeholder="Chọn quận/huyện">
                        <Option value="Cầu Giấy">Cầu Giấy</Option>
                        <Option value="Hai Bà Trưng">Hai Bà Trưng</Option>
                        <Option value="Đống Đa">Đống Đa</Option>
                        {/* Add more districts */}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="ward"
                      label="Phường/Xã"
                      rules={[
                        { required: true, message: "Vui lòng chọn phường/xã" },
                      ]}
                    >
                      <Select placeholder="Chọn phường/xã">
                        <Option value="Dịch Vọng">Dịch Vọng</Option>
                        <Option value="Mai Dịch">Mai Dịch</Option>
                        <Option value="Nghĩa Đô">Nghĩa Đô</Option>
                        {/* Add more wards */}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="address"
                  label="Địa chỉ chi tiết"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập địa chỉ chi tiết",
                    },
                  ]}
                >
                  <Input
                    prefix={<HomeOutlined />}
                    placeholder="Số nhà, đường, tổ/xóm..."
                  />
                </Form.Item>

                <Form.Item name="note" label="Ghi chú đơn hàng">
                  <TextArea
                    rows={3}
                    placeholder="Thời gian giao hàng, hướng dẫn giao hàng..."
                  />
                </Form.Item>

                <Divider />
                <Title level={4}>Phương thức thanh toán</Title>

                <Form.Item
                  name="payment_method"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn phương thức thanh toán",
                    },
                  ]}
                  initialValue="cod"
                >
                  <Select>
                    <Option value="cod">Thanh toán khi nhận hàng (COD)</Option>
                    <Option value="bank_transfer">
                      Chuyển khoản ngân hàng
                    </Option>
                    <Option value="momo">Ví MoMo</Option>
                    <Option value="zalopay">ZaloPay</Option>
                  </Select>
                </Form.Item>

                <Alert
                  message="Lưu ý"
                  description="Đơn hàng sẽ được giao đến địa chỉ của bạn trong vòng 2-5 ngày làm việc, tùy vào khoảng cách."
                  type="info"
                  showIcon
                  className="mb-4"
                />

                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      loading={loading}
                      icon={<CheckCircleOutlined />}
                    >
                      Đặt hàng
                    </Button>
                    <Button onClick={() => navigate(-1)} size="large">
                      Quay lại
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col span={8}>
            <Card className="mb-4">
              <Title level={4}>Đơn hàng của bạn</Title>
              <Divider />

              <div className="flex items-center mb-4">
                <img
                  src={listing.main_image || "https://via.placeholder.com/80"}
                  alt={listing.name}
                  className="w-20 h-20 object-cover rounded mr-3"
                />
                <div>
                  <Text strong className="block">
                    {listing.name}
                  </Text>
                  <Text type="secondary">{listing.category}</Text>
                </div>
              </div>

              <div className="flex justify-between mb-2">
                <Text>Đơn giá:</Text>
                <Text>
                  {listing.price.toLocaleString()} đ/{listing.unit}
                </Text>
              </div>

              <div className="flex justify-between mb-2">
                <Text>Số lượng:</Text>
                <Text>
                  {state.quantity || 1} {listing.unit}
                </Text>
              </div>

              <Divider />

              <div className="flex justify-between mb-2">
                <Text strong>Tổng tiền:</Text>
                <Text strong className="text-lg text-red-600">
                  {totalAmount.toLocaleString()} đ
                </Text>
              </div>

              <Paragraph type="secondary" className="text-xs mt-4">
                * Giá chưa bao gồm phí vận chuyển. Phí vận chuyển sẽ được nhà
                cung cấp thông báo sau khi đơn hàng được xác nhận.
              </Paragraph>
            </Card>

            <Card>
              <Title level={5}>Thông tin nhà cung cấp</Title>
              <Divider />

              <div className="flex items-center mb-3">
                <Avatar icon={<UserOutlined />} className="mr-2" />
                <Text strong>{listing.supplier?.name || "Nhà cung cấp"}</Text>
              </div>

              {listing.supplier?.phone && (
                <div className="flex items-center mb-3">
                  <PhoneOutlined className="mr-2" />
                  <Text>{listing.supplier.phone}</Text>
                </div>
              )}

              {(listing.province || listing.district) && (
                <div className="flex items-center mb-3">
                  <EnvironmentOutlined className="mr-2" />
                  <Text>
                    {[listing.province, listing.district]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default OrderCheckout;
