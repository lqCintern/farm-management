import { Form, InputNumber, Typography } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { SectionProps } from "@/components/ProductListing/CreateForm/types";

const { Title, Text } = Typography;

const PricingSection: React.FC<SectionProps> = ({
  formValues,
  setFormValues,
  errors,
}) => {
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
            title: "Trọng lượng trung bình của mỗi đơn vị sản phẩm (gram)",
            icon: <InfoCircleOutlined />,
          }}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0.01}
            step={0.01}
            placeholder="Cân nặng trung bình mỗi đơn vị (gram)"
            value={formValues.average_size || undefined}
            onChange={(value) =>
              setFormValues({
                ...formValues,
                average_size: value !== null ? Number(value) : null,
              })
            }
          />
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
      </Form>
    </div>
  );
};

export default PricingSection;
