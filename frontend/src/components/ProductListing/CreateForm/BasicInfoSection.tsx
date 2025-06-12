import { Form, Input, Typography, Card, Tag, Descriptions } from "antd";
import { SectionProps } from "@/components/ProductListing/CreateForm/types";
import fieldService from "@/services/farming/fieldService";
import { useEffect } from "react";

const { Title, Text } = Typography;
const { TextArea } = Input;

const BasicInfoSection: React.FC<SectionProps> = ({
  formValues,
  setFormValues,
  errors,
}) => {
  // Khai báo crop từ formValues
  const crop = formValues.pineapple_crop;
  
  // Log để debug
  console.log("Crop data in BasicInfoSection:", crop);
  
  // Lấy thông tin từ pineapple_crop với API mới
  const variety = crop?.variety || formValues.product_type || "Không xác định";
  const fieldArea = crop?.field_area || 0;
  const planting_density = crop?.planting_density || 0;
  
  // Tính số cây dứa ước tính dựa trên diện tích và mật độ trồng
  const estimatedPlants = Math.round(fieldArea * planting_density / 10000);

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

        {/* Hiển thị thông tin vụ mùa - ngay cả khi crop không có data đầy đủ */}
        <Form.Item label="Thông tin vụ mùa">
          <Card 
            size="small" 
            className="bg-gray-50"
            bordered={false}
          >
            {crop ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-800">
                    {crop.name || "Chưa có tên vụ mùa"}
                  </div>
                  <Tag color={
                    crop.current_stage === "harvesting" ? "green" : 
                    crop.current_stage === "flowering" ? "blue" : 
                    "orange"
                  }>
                    {crop.current_stage || "Không xác định"}
                  </Tag>
                </div>
                
                <Descriptions size="small" column={1} colon={false} className="mt-2">
                  <Descriptions.Item label="Giống">
                    <span className="font-medium">{variety}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày trồng">
                    {crop.planting_date || "Chưa xác định"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Dự kiến thu hoạch">
                    {crop.harvest_date || "Chưa xác định"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    {crop.status || "Không xác định"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Diện tích">
                    {fieldArea.toLocaleString()} m²
                  </Descriptions.Item>
                  <Descriptions.Item label="Mật độ">
                    {planting_density.toLocaleString()} cây/ha
                  </Descriptions.Item>
                  <Descriptions.Item label="Ước tính">
                    {estimatedPlants.toLocaleString()} cây
                  </Descriptions.Item>
                </Descriptions>
              </>
            ) : (
              <div className="text-center py-2 text-gray-500">
                Không có thông tin vụ mùa
              </div>
            )}
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
