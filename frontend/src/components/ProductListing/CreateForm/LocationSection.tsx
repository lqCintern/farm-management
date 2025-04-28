import { Form, Select, Input, Typography } from "antd";
import { useEffect, useState } from "react";
import { SectionProps } from "@/components/ProductListing/CreateForm/types";

const { Title, Text } = Typography;
const { Option } = Select;

// Giả lập dữ liệu - trong thực tế cần lấy từ API
const provinces = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
];

const districts: Record<string, string[]> = {
  "Hà Nội": ["Ba Đình", "Hoàn Kiếm", "Hai Bà Trưng", "Đống Đa"],
  "TP. Hồ Chí Minh": ["Quận 1", "Quận 2", "Quận 3", "Quận Bình Thạnh"],
  "Đà Nẵng": ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn"],
  "Hải Phòng": ["Hồng Bàng", "Ngô Quyền", "Lê Chân", "Hải An"],
  "Cần Thơ": ["Ninh Kiều", "Bình Thủy", "Cái Răng", "Ô Môn"],
};

const wards: Record<string, string[]> = {
  "Ba Đình": ["Phúc Xá", "Trúc Bạch", "Vĩnh Phúc"],
  "Quận 1": ["Bến Nghé", "Bến Thành", "Cầu Kho"],
  // Thêm dữ liệu cho các quận/huyện khác
};

const LocationSection: React.FC<SectionProps> = ({
  formValues,
  setFormValues,
  errors,
}) => {
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [wardOptions, setWardOptions] = useState<string[]>([]);

  // Cập nhật danh sách quận/huyện khi chọn tỉnh/thành
  useEffect(() => {
    if (formValues.province) {
      setDistrictOptions(districts[formValues.province] || []);
      setFormValues({ ...formValues, district: "", ward: "" });
    }
  }, [formValues.province]);

  // Cập nhật danh sách phường/xã khi chọn quận/huyện
  useEffect(() => {
    if (formValues.district) {
      setWardOptions(wards[formValues.district] || []);
      setFormValues({ ...formValues, ward: "" });
    }
  }, [formValues.district]);

  return (
    <div>
      <Title level={4}>Vị trí bán hàng</Title>
      <Text type="secondary" className="mb-4 block">
        Chọn vị trí nông sản/vật nuôi của bạn
      </Text>

      <Form layout="vertical" className="mt-4">
        <Form.Item
          label="Tỉnh/Thành phố"
          required
          validateStatus={errors.province ? "error" : ""}
          help={errors.province}
        >
          <Select
            placeholder="Chọn tỉnh/thành phố"
            value={formValues.province || undefined}
            onChange={(value) =>
              setFormValues({ ...formValues, province: value })
            }
          >
            {provinces.map((province) => (
              <Option key={province} value={province}>
                {province}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Quận/Huyện"
          required
          validateStatus={errors.district ? "error" : ""}
          help={errors.district}
        >
          <Select
            placeholder="Chọn quận/huyện"
            value={formValues.district || undefined}
            onChange={(value) =>
              setFormValues({ ...formValues, district: value })
            }
            disabled={!formValues.province}
          >
            {districtOptions.map((district) => (
              <Option key={district} value={district}>
                {district}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Phường/Xã"
          required
          validateStatus={errors.ward ? "error" : ""}
          help={errors.ward}
        >
          <Select
            placeholder="Chọn phường/xã"
            value={formValues.ward || undefined}
            onChange={(value) => setFormValues({ ...formValues, ward: value })}
            disabled={!formValues.district}
          >
            {wardOptions.map((ward) => (
              <Option key={ward} value={ward}>
                {ward}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Địa chỉ cụ thể">
          <Input
            placeholder="Số nhà, đường, thôn xóm,..."
            value={formValues.address || ""}
            onChange={(e) =>
              setFormValues({ ...formValues, address: e.target.value })
            }
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default LocationSection;
