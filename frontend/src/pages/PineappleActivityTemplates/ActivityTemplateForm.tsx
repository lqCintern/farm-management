import { Form, Input, Select, InputNumber, Switch, Modal, message, Tabs } from "antd";
import { useEffect, useState } from "react";
import pineappleActivityTemplateService, { PineappleActivityType } from "@/services/farming/pineappleActivityTemplateService";
import TemplateMaterialsManager from "@/components/TemplateMaterials/TemplateMaterialsManager";

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface ActivityTemplateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  template?: any | null;
  stageOptions: { value: string; label: string }[];
  activityTypeOptions: { value: string; label: string }[];
}

// Mapping cho loại hoạt động (activity_type)
const activityTypeOptions = [
  { value: PineappleActivityType.SOIL_PREPARATION, label: "Chuẩn bị đất" },
  { value: PineappleActivityType.SEEDLING_PREPARATION, label: "Chuẩn bị giống & vật tư" },
  { value: PineappleActivityType.PLANTING, label: "Trồng dứa" },
  { value: PineappleActivityType.LEAF_TYING, label: "Buộc lá" },
  { value: PineappleActivityType.FERTILIZING, label: "Bón phân" },
  { value: PineappleActivityType.PESTICIDE, label: "Phun thuốc" },
  { value: PineappleActivityType.SUN_PROTECTION, label: "Che nắng" },
  { value: PineappleActivityType.FRUIT_DEVELOPMENT, label: "Thúc quả" },
  { value: PineappleActivityType.HARVESTING, label: "Thu hoạch" },
  { value: PineappleActivityType.SPROUT_COLLECTION, label: "Tách chồi" },
  { value: PineappleActivityType.FIELD_CLEANING, label: "Dọn vườn" },
  { value: PineappleActivityType.WATERING, label: "Tưới nước" },
  { value: PineappleActivityType.WEEDING, label: "Làm cỏ" },
  { value: PineappleActivityType.OTHER, label: "Khác" }
];

export default function ActivityTemplateForm({
  visible,
  onCancel,
  onSubmit,
  template,
  stageOptions,
  activityTypeOptions
}: ActivityTemplateFormProps) {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("basic");
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const isEditing = !!template?.id;
  
  useEffect(() => {
    if (visible && template) {
      form.setFieldsValue({
        name: template.name,
        description: template.description,
        activity_type: template.activity_type,
        stage: template.stage,
        day_offset: template.day_offset,
        duration_days: template.duration_days,
        is_required: template.is_required || false,
        season_specific: template.season_specific,
      });
      setTemplateId(template.id);
      setIsCreating(false);
    } else if (visible) {
      form.resetFields();
      setTemplateId(null);
      setIsCreating(false);
      // Thiết lập một số giá trị mặc định
      form.setFieldsValue({
        is_required: false,
        day_offset: 0,
        duration_days: 1
      });
    }
  }, [visible, template, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (isEditing) {
        await pineappleActivityTemplateService.updateTemplate(template.id, { template: values });
        message.success("Đã cập nhật mẫu hoạt động thành công");
        onSubmit();
      } else {
        if (isCreating && templateId) {
          // Đã tạo template, user click "Hoàn tất"
          message.success("Đã hoàn tất tạo mẫu hoạt động");
          onSubmit();
        } else {
          // Tạo template mới
          setIsCreating(true);
          const response = await pineappleActivityTemplateService.createTemplate({ template: values });
          
          if (response.data?.id) {
            setTemplateId(response.data.id);
            message.success("Đã tạo mẫu hoạt động thành công. Bạn có thể thêm vật tư cần thiết.");
            // Không đóng modal, để user có thể thêm vật tư
          } else {
            message.success("Đã tạo mẫu hoạt động thành công");
            onSubmit();
          }
        }
      }
    } catch (error) {
      if ((error as any)?.errorFields) {
        // Validation error
        return;
      }
      
      const errorMessage = (error as any)?.response?.data?.error || "Không thể lưu mẫu hoạt động";
      message.error("Lỗi: " + errorMessage);
      console.error("Form submission error:", error);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const handleCancel = () => {
    if (isCreating && templateId) {
      // Nếu đang tạo và đã có templateId, hỏi user có muốn lưu không
      Modal.confirm({
        title: "Xác nhận",
        content: "Bạn có muốn lưu mẫu hoạt động này không?",
        okText: "Lưu",
        cancelText: "Hủy",
        onOk: () => {
          onSubmit();
          onCancel();
        },
        onCancel: () => {
          onCancel();
        }
      });
    } else {
      onCancel();
    }
  };

  const canShowMaterialsTab = isEditing || (isCreating && templateId);

  return (
    <Modal
      title={isEditing ? "Sửa mẫu hoạt động" : "Thêm mẫu hoạt động mới"}
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      width={900}
      okText={isEditing ? "Cập nhật" : (isCreating && templateId ? "Hoàn tất" : "Tạo mới")}
      cancelText="Hủy"
      style={{ top: 20 }}
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="Thông tin cơ bản" key="basic">
          <Form
            form={form}
            layout="vertical"
            name="activity_template_form"
            initialValues={{ is_required: false }}
          >
            <Form.Item
              name="name"
              label="Tên mẫu hoạt động"
              rules={[{ required: true, message: "Vui lòng nhập tên hoạt động" }]}
            >
              <Input placeholder="Ví dụ: Bón phân lần 1" />
            </Form.Item>
            
            <Form.Item
              name="stage"
              label="Giai đoạn"
              rules={[{ required: true, message: "Vui lòng chọn giai đoạn" }]}
            >
              <Select placeholder="Chọn giai đoạn">
                {stageOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="activity_type"
              label="Loại hoạt động"
              rules={[{ required: true, message: "Vui lòng chọn loại hoạt động" }]}
            >
              <Select placeholder="Chọn loại hoạt động">
                {activityTypeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div style={{ display: "flex", gap: "16px" }}>
              <Form.Item
                name="day_offset"
                label="Bắt đầu sau (ngày)"
                rules={[{ required: true, message: "Vui lòng nhập số ngày bắt đầu" }]}
                style={{ flex: 1 }}
                tooltip="Số ngày sau khi bắt đầu giai đoạn. Giá trị âm nghĩa là trước khi bắt đầu giai đoạn."
              >
                <InputNumber style={{ width: '100%' }} placeholder="0" />
              </Form.Item>

              <Form.Item
                name="duration_days"
                label="Kéo dài (ngày)"
                rules={[{ required: true, message: "Vui lòng nhập số ngày kéo dài" }]}
                style={{ flex: 1 }}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="1" />
              </Form.Item>
            </div>

            <div style={{ display: "flex", gap: "16px" }}>
              <Form.Item
                name="is_required"
                label="Bắt buộc"
                valuePropName="checked"
                style={{ flex: 1 }}
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="season_specific"
                label="Mùa vụ cụ thể"
                style={{ flex: 1 }}
                tooltip="Để trống nếu áp dụng cho tất cả các mùa vụ"
              >
                <Select placeholder="Chọn mùa vụ" allowClear>
                  <Option value="Xuân-Hè">Xuân - Hè</Option>
                  <Option value="Thu-Đông">Thu - Đông</Option>
                  <Option value="Đông-Xuân">Đông - Xuân</Option>
                  <Option value="Hè-Thu">Hè - Thu</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              name="description"
              label="Mô tả"
            >
              <TextArea rows={4} placeholder="Nhập mô tả chi tiết về hoạt động..." />
            </Form.Item>
          </Form>
        </TabPane>
        
        <TabPane tab="Vật tư" key="materials">
          <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
            {canShowMaterialsTab ? (
              <TemplateMaterialsManager
                templateId={templateId!}
                templateName={template?.name || form.getFieldValue('name') || 'Template mới'}
                readOnly={false}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                <p>Vui lòng tạo mẫu hoạt động trước, sau đó có thể thêm vật tư cần thiết.</p>
                <p style={{ fontSize: '12px', marginTop: '8px' }}>
                  Sau khi tạo thành công, tab này sẽ cho phép bạn quản lý vật tư.
                </p>
              </div>
            )}
          </div>
        </TabPane>
      </Tabs>
    </Modal>
  );
}
