import { Form, Input, Typography } from "antd";
import { SectionProps } from "@/components/ProductListing/CreateForm/types";
import { EnvironmentOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

// Hàm tính điểm trung tâm từ các tọa độ
const calculateCenter = (coordinates: Array<{lat: number, lng: number}>) => {
  if (!coordinates || coordinates.length === 0) return { lat: 0, lng: 0 };
  
  const totalLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0);
  const totalLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0);
  
  return {
    lat: totalLat / coordinates.length,
    lng: totalLng / coordinates.length
  };
};

const LocationSection: React.FC<SectionProps> = ({
  formValues,
  setFormValues,
  errors,
}) => {
  // Tính tọa độ trung tâm từ field
  const center = calculateCenter(formValues.coordinates || []);
  
  return (
    <div>
      <Title level={4}>Vị trí bán hàng</Title>
      <Text type="secondary" className="mb-4 block">
        Thông tin được lấy tự động từ vườn/cánh đồng của bạn
      </Text>

      <Form layout="vertical" className="mt-4">
        <Form.Item 
          label="Tên vườn/cánh đồng"
          required
        >
          <Input
            prefix={<EnvironmentOutlined />}
            value={formValues.fieldName || ""}
            disabled
            style={{ background: "#fafafa", color: "#222" }}
          />
        </Form.Item>

        <Form.Item label="Tọa độ trung tâm">
          <Input
            value={center ? `${center.lat.toFixed(6)}, ${center.lng.toFixed(6)}` : ""}
            disabled
            style={{ background: "#fafafa", color: "#222" }}
          />
        </Form.Item>

        <Form.Item label="Mô tả vị trí">
          <TextArea
            rows={4}
            placeholder="Mô tả thêm về vị trí, đặc điểm nhận diện hoặc các lưu ý khi tới vườn (đường nhỏ, không cho xe lớn vào,...)"
            value={formValues.locationNote || ""}
            onChange={(e) =>
              setFormValues({ ...formValues, locationNote: e.target.value })
            }
          />
          <Text type="secondary">
            Thông tin này giúp người mua dễ dàng tìm thấy vườn của bạn
          </Text>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LocationSection;
