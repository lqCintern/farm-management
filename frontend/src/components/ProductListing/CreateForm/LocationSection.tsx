import { Form, Input, Typography, Card, Descriptions } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { SectionProps } from "@/components/ProductListing/CreateForm/types";

const { Title, Text } = Typography;

const LocationSection: React.FC<SectionProps> = ({
  formValues,
  setFormValues,
  errors,
}) => {
  // Lấy thông tin field từ formValues
  const fieldName = formValues.fieldName || "Chưa chọn cánh đồng";
  const fieldId = formValues.field_id;

  return (
    <div>
      <Title level={4}>Thông tin địa điểm</Title>
      <Text type="secondary" className="mb-4 block">
        Thông tin về vị trí thu hoạch sản phẩm
      </Text>

      <Form layout="vertical" className="mt-4">
        {/* Field Info Card */}
        <Card size="small" className="mb-4 bg-gray-50" bordered={false}>
          <Descriptions size="small" column={1} className="mb-2">
            <Descriptions.Item label="Tên cánh đồng">
              <span className="font-medium">{fieldName}</span>
            </Descriptions.Item>
            <Descriptions.Item label="ID cánh đồng">
              {fieldId}
            </Descriptions.Item>

          </Descriptions>

          {formValues.coordinates && formValues.coordinates.length > 0 && (
            <div className="mt-2">
              <a
                href={formValues.google_maps_url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-500 hover:underline flex items-center"
              >
                <EnvironmentOutlined className="mr-1" /> Xem vị trí trên Google
                Maps
              </a>
            </div>
          )}
        </Card>

        {/* Additional Location Note */}
        <Form.Item label="Ghi chú về địa điểm (tuỳ chọn)">
          <Input.TextArea
            rows={3}
            placeholder="Nhập ghi chú về địa điểm (hướng dẫn đường đi, đặc điểm nhận biết...)"
            value={formValues.locationNote || ""}
            onChange={(e) =>
              setFormValues({
                ...formValues,
                locationNote: e.target.value,
              })
            }
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default LocationSection;
