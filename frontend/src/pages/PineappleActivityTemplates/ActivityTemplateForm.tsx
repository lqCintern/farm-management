import { Form, Input, Select, InputNumber, Switch, Modal, message } from "antd";
import { useEffect } from "react";
import pineappleActivityTemplateService from "@/services/farming/pineappleActivityTemplateService";

const { Option } = Select;
const { TextArea } = Input;

interface ActivityTemplateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  template?: any | null;
  stageOptions: { value: string; label: string }[];
  activityTypeOptions: { value: string; label: string }[];
}

export default function ActivityTemplateForm({
  visible,
  onCancel,
  onSubmit,
  template,
  stageOptions,
  activityTypeOptions
}: ActivityTemplateFormProps) {
  const [form] = Form.useForm();
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
    } else if (visible) {
      form.resetFields();
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
      } else {
        await pineappleActivityTemplateService.createTemplate({ template: values });
        message.success("Đã tạo mẫu hoạt động thành công");
      }
      
      onSubmit();
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

  return (
    <Modal
      title={isEditing ? "Sửa mẫu hoạt động" : "Thêm mẫu hoạt động mới"}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      width={700}
      okText={isEditing ? "Cập nhật" : "Tạo mới"}
      cancelText="Hủy"
    >
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
    </Modal>
  );
}
