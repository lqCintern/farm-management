import { Form, Input, Typography, Card } from "antd";
import { SectionProps } from "@/components/ProductListing/CreateForm/types";

const { Title, Text } = Typography;
const { TextArea } = Input;

const BasicInfoSection: React.FC<SectionProps> = ({
  formValues,
  setFormValues,
  errors,
}) => {
  return (
    <div>
      <Title level={4}>Thông tin cơ bản</Title>
      <Text type="secondary" className="mb-4 block">
        Vui lòng nhập các thông tin cơ bản về sản phẩm của bạn
      </Text>

      <Form layout="vertical" className="mt-4">
        <Form.Item
          label="Tiêu đề"
          required
          validateStatus={errors.title ? "error" : ""}
          help={errors.title}
        >
          <Input
            placeholder="Nhập tên sản phẩm (VD: Dứa Queen tươi ngon vụ mới)"
            value={formValues.title}
            onChange={(e) =>
              setFormValues({ ...formValues, title: e.target.value })
            }
          />
        </Form.Item>

        <Form.Item label="Giống dứa">
          <Card 
            size="small" 
            className="bg-gray-50"
            bordered={false}
          >
            <div className="font-medium text-gray-800">{formValues.variety || "Không xác định"}</div>
            <Text type="secondary" className="text-xs">
              Thông tin được lấy từ giống dứa {formValues.variety} của bạn
            </Text>
          </Card>
        </Form.Item>

        <Form.Item label="Mô tả">
          <TextArea
            rows={4}
            placeholder="Mô tả chi tiết về sản phẩm của bạn"
            value={formValues.description || ""}
            onChange={(e) =>
              setFormValues({ ...formValues, description: e.target.value })
            }
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default BasicInfoSection;