import { Form, InputNumber, Typography, Row, Col, Divider } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { SectionProps } from "@/components/ProductListing/CreateForm/types";

const { Title, Text } = Typography;

const PricingSection: React.FC<SectionProps> = ({
  formValues,
  setFormValues,
  errors,
}) => {
  // Tính tổng sản lượng dựa trên số lượng và kích thước trung bình
  const calculateTotalWeight = () => {
    const { quantity, min_size, max_size } = formValues;
    if (!quantity || !min_size || !max_size) return null;
    
    const avgSize = (min_size + max_size) / 2;
    return (quantity * avgSize) / 1000; // Chuyển đổi gram thành kg
  };

  const totalWeight = calculateTotalWeight();

  return (
    <div>
      <Title level={4}>Giá cả & Số lượng</Title>
      <Text type="secondary" className="mb-4 block">
        Thông tin về giá mong muốn và số lượng sản phẩm
      </Text>

      <Form layout="vertical" className="mt-4">
        <Form.Item
          label="Số lượng"
          validateStatus={errors.quantity ? "error" : ""}
          help={errors.quantity}
          tooltip={{
            title: "Số lượng sản phẩm có sẵn để bán",
            icon: <InfoCircleOutlined />,
          }}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={1}
            placeholder="Số lượng (VD: 100)"
            value={formValues.quantity || undefined}
            onChange={(value) =>
              setFormValues({
                ...formValues,
                quantity: value !== null ? Number(value) : null,
              })
            }
          />
        </Form.Item>

        <Form.Item
          label="Kích thước trung bình (g)"
          tooltip={{
            title: "Nhập khoảng trọng lượng trung bình mỗi quả",
            icon: <InfoCircleOutlined />,
          }}
        >
          <Row gutter={8} align="middle">
            <Col span={11}>
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                placeholder="Tối thiểu (g)"
                value={formValues.min_size || undefined}
                onChange={(value) =>
                  setFormValues({
                    ...formValues,
                    min_size: value !== null ? Number(value) : undefined,
                  })
                }
              />
            </Col>
            <Col span={2} className="text-center">
              <span>-</span>
            </Col>
            <Col span={11}>
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                placeholder="Tối đa (g)"
                value={formValues.max_size || undefined}
                onChange={(value) =>
                  setFormValues({
                    ...formValues,
                    max_size: value !== null ? Number(value) : undefined,
                  })
                }
              />
            </Col>
          </Row>
        </Form.Item>

        <Form.Item
          label="Giá mong muốn (VNĐ)"
          validateStatus={errors.price_expectation ? "error" : ""}
          help={errors.price_expectation}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={1000}
            step={1000}
            formatter={(value) =>
              `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
            }
            parser={(value) => Number(value!.replace(/₫\s?|(,*)/g, ""))}
            placeholder="Giá mong muốn (VND)"
            value={formValues.price_expectation || undefined}
            onChange={(value) =>
              setFormValues({
                ...formValues,
                price_expectation: value !== null ? Number(value) : null,
              })
            }
          />
        </Form.Item>

        <Divider />
        
        <div className="bg-blue-50 p-3 rounded-md">
          <Text strong>Tổng sản lượng muốn bán:</Text>
          <div className="text-lg font-bold mt-1">
            {totalWeight 
              ? `${totalWeight.toLocaleString()} kg` 
              : "Hãy nhập đủ số lượng và kích thước"}
          </div>
        </div>
      </Form>
    </div>
  );
};

export default PricingSection;
