import { Form, Input, Typography, Button, Tooltip } from "antd";
import { SectionProps } from "@/components/ProductListing/CreateForm/types";
import { EnvironmentOutlined, LinkOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

const LocationSection: React.FC<SectionProps> = ({
  formValues,
  setFormValues,
  errors,
}) => {
  // Tọa độ từ API
  const latitude = formValues.latitude || "";
  const longitude = formValues.longitude || "";
  const hasCoordinates = latitude && longitude;

  return (
    <div>
      <Title level={4}>Vị trí sản phẩm</Title>
      <Text type="secondary" className="mb-4 block">
        Thông tin được lấy từ cánh đồng đã đăng ký
      </Text>

      <Form layout="vertical" className="mt-4">
        {/* Hiển thị thông tin cánh đồng nếu có */}
        {formValues.pineapple_crop && formValues.pineapple_crop.field_id && (
          <Form.Item label="Cánh đồng / vườn">
            <Input
              prefix={<EnvironmentOutlined />}
              value={`ID: ${formValues.pineapple_crop.field_id}, Giống: ${formValues.pineapple_crop.variety || formValues.product_type}`}
              disabled
              style={{ background: "#fafafa", color: "#222" }}
            />
          </Form.Item>
        )}

        {/* Hiển thị tọa độ */}
        {hasCoordinates && (
          <Form.Item label="Tọa độ">
            <Input
              value={`${latitude}, ${longitude}`}
              disabled
              style={{ background: "#fafafa", color: "#222" }}
            />
            {formValues.google_maps_url && (
              <div className="mt-2">
                <Button 
                  type="link" 
                  icon={<LinkOutlined />} 
                  onClick={() => window.open(formValues.google_maps_url, "_blank")}
                >
                  Xem trên Google Maps
                </Button>
              </div>
            )}
          </Form.Item>
        )}

        {/* Cho phép cập nhật địa chỉ nếu chưa có */}
        <Form.Item 
          label="Tỉnh/Thành phố" 
          validateStatus={errors.province ? "error" : ""}
          help={errors.province}
          required={false} // Đặt là false để không bắt buộc
        >
          <Input
            placeholder="Nhập tỉnh/thành phố"
            value={formValues.province || ""}
            onChange={e => setFormValues({ ...formValues, province: e.target.value })}
          />
        </Form.Item>

        <Form.Item 
          label="Quận/Huyện"
          validateStatus={errors.district ? "error" : ""}
          help={errors.district}
          required={false}
        >
          <Input
            placeholder="Nhập quận/huyện"
            value={formValues.district || ""}
            onChange={e => setFormValues({ ...formValues, district: e.target.value })}
          />
        </Form.Item>

        <Form.Item 
          label="Phường/Xã"
          validateStatus={errors.ward ? "error" : ""}
          help={errors.ward}
          required={false}
        >
          <Input
            placeholder="Nhập phường/xã"
            value={formValues.ward || ""}
            onChange={e => setFormValues({ ...formValues, ward: e.target.value })}
          />
        </Form.Item>

        <Form.Item 
          label="Địa chỉ chi tiết"
          validateStatus={errors.address ? "error" : ""}
          help={errors.address}
          required={false}
        >
          <TextArea
            rows={3}
            placeholder="Nhập địa chỉ chi tiết (nếu cần)"
            value={formValues.address || ""}
            onChange={e => setFormValues({ ...formValues, address: e.target.value })}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default LocationSection;
