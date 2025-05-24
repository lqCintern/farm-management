import { useEffect, useState } from "react";
import { 
  Card, Descriptions, Tag, Button, Spin, message, Divider, Modal 
} from "antd";
import { 
  EditOutlined, DeleteOutlined, CheckCircleOutlined, ArrowLeftOutlined 
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import pineappleActivityTemplateService, { 
  PineappleActivityTemplate,
} from "@/services/farming/pineappleActivityTemplateService";

export default function ActivityTemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<PineappleActivityTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyModalVisible, setApplyModalVisible] = useState(false);

  // Mapping for enum values
  const stageNames = {
    preparation: "Chuẩn bị đất & mật độ trồng",
    seedling_preparation: "Chuẩn bị giống & vật tư",
    planting: "Trồng dứa",
    leaf_tying: "Buộc lá (tránh chính vụ)",
    first_fertilizing: "Bón phân thúc lần 1",
    second_fertilizing: "Bón phân thúc lần 2",
    flower_treatment: "Xử lý ra hoa",
    sun_protection: "Buộc tránh nắng / Che lưới đen",
    fruit_development: "Bón phân thúc quả lớn",
    harvesting: "Thu hoạch",
    sprout_collection: "Tách chồi giống",
    field_cleaning: "Dọn vườn"
  };

  const activityTypeNames = {
    soil_preparation: "Chuẩn bị đất",
    planting: "Trồng cây",
    fertilizing: "Bón phân",
    watering: "Tưới nước",
    pesticide: "Phun thuốc",
    pruning: "Tỉa cây",
    weeding: "Làm cỏ",
    harvesting: "Thu hoạch",
    other: "Khác"
  };

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const numericId = id ? parseInt(id, 10) : null;
        if (!numericId) {
          throw new Error("Invalid template ID");
        }
        const response = await pineappleActivityTemplateService.getTemplateById(numericId);
        setTemplate(response.data);
      } catch (error) {
        message.error("Không thể tải thông tin mẫu hoạt động");
        navigate("/pineapple-activity-templates");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  }, [id, navigate]);

  const handleDelete = () => {
    Modal.confirm({
      title: "Xác nhận xóa mẫu hoạt động",
      content: "Bạn có chắc muốn xóa mẫu hoạt động này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const numericId = id ? parseInt(id, 10) : null;
          if (numericId === null) {
            throw new Error("Invalid template ID");
          }
          await pineappleActivityTemplateService.deleteTemplate(numericId);
          message.success("Đã xóa mẫu hoạt động");
          navigate("/pineapple-activity-templates");
        } catch (error) {
          message.error("Không thể xóa mẫu hoạt động");
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate("/pineapple-activity-templates")}
        >
          Quay lại
        </Button>
        
        <div>
          {template?.user_id && (
            <>
              <Button 
                icon={<EditOutlined />} 
                onClick={() => navigate(`/pineapple-activity-templates/${id}/edit`)}
                className="mr-2"
              >
                Sửa
              </Button>
              <Button 
                icon={<DeleteOutlined />} 
                danger
                onClick={handleDelete}
                className="mr-2"
              >
                Xóa
              </Button>
            </>
          )}
          <Button
            icon={<CheckCircleOutlined />}
            type="primary"
            onClick={() => setApplyModalVisible(true)}
          >
            Áp dụng
          </Button>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">
        {template?.name}
        {!template?.user_id && <Tag color="blue" className="ml-2">Mẫu mặc định</Tag>}
      </h2>

      <Divider />

      <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 }}>
        <Descriptions.Item label="Giai đoạn">
          <Tag color="green">{template?.stage ? stageNames[template.stage.toString() as keyof typeof stageNames] || template.stage : "N/A"}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Loại hoạt động">
          <Tag color="blue">{template?.activity_type ? activityTypeNames[template.activity_type.toString() as keyof typeof activityTypeNames] || template.activity_type : "N/A"}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Bắt đầu sau">
          {template?.day_offset} ngày
        </Descriptions.Item>
        <Descriptions.Item label="Kéo dài">
          {template?.duration_days} ngày
        </Descriptions.Item>
        <Descriptions.Item label="Bắt buộc">
          {template?.is_required ? (
            <Tag color="red">Bắt buộc</Tag>
          ) : (
            <Tag color="default">Tùy chọn</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Mùa vụ áp dụng">
          {template?.season_specific ? (
            <Tag color="orange">{template.season_specific}</Tag>
          ) : (
            <span className="text-gray-500">Tất cả mùa vụ</span>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả" span={2}>
          {template?.description || <span className="text-gray-500">Không có mô tả</span>}
        </Descriptions.Item>
      </Descriptions>
      
      {/* Apply modal would be similar to the one in the main component */}
    </Card>
  );
}
