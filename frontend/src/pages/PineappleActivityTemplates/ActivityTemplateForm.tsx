import { Form, Input, Select, InputNumber, Switch, Modal, message, Tabs, Typography, Card, Divider, Badge } from "antd";
import { useEffect, useState } from "react";
import { 
  PlusOutlined, EditOutlined, FileTextOutlined, 
  CalendarOutlined, ClockCircleOutlined, SettingOutlined,
  ShoppingCartOutlined, InfoCircleOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, FormOutlined, TagsOutlined,
  FieldTimeOutlined, ScheduleOutlined, EnvironmentOutlined,
  DollarOutlined
} from "@ant-design/icons";
import pineappleActivityTemplateService, { PineappleActivityType } from "@/services/farming/pineappleActivityTemplateService";
import TemplateMaterialsManager from "@/components/TemplateMaterials/TemplateMaterialsManager";
import templateMaterialService from '@/services/farming/templateMaterialService';
import "./pineapple-templates.css";

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

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
  const [materialsStats, setMaterialsStats] = useState<any>(null);
  
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

  // Fetch stats khi templateId thay đổi và tab vật tư được mở
  useEffect(() => {
    if ((activeTab === 'materials') && templateId) {
      templateMaterialService.getTemplateMaterialStats(templateId).then(res => {
        if (res.success) {
          setMaterialsStats(res.statistics);
        } else {
          console.error('Failed to fetch materials stats:', res);
        }
      });
    }
  }, [activeTab, templateId]);

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
        title: (
          <div className="flex items-center gap-2">
            <ExclamationCircleOutlined className="text-orange-500" />
            <span>Xác nhận</span>
          </div>
        ),
        content: "Bạn có muốn lưu mẫu hoạt động này không?",
        okText: "Lưu",
        cancelText: "Hủy",
        okButtonProps: {
          style: {
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600
          }
        },
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
      title={
        <div className="flex items-center gap-3">
          {isEditing ? (
            <>
              <EditOutlined className="text-blue-600 text-xl" />
              <div>
                <Title level={4} className="mb-0 text-gray-800">Sửa mẫu hoạt động</Title>
                <Text className="text-gray-500 text-sm">Cập nhật thông tin mẫu hoạt động</Text>
              </div>
            </>
          ) : (
            <>
              <PlusOutlined className="text-green-600 text-xl" />
              <div>
                <Title level={4} className="mb-0 text-gray-800">Thêm mẫu hoạt động mới</Title>
                <Text className="text-gray-500 text-sm">Tạo mẫu hoạt động chuẩn cho quy trình trồng dứa</Text>
              </div>
            </>
          )}
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      onOk={handleSubmit}
      width={1000}
      okText={isEditing ? "Cập nhật" : (isCreating && templateId ? "Hoàn tất" : "Tạo mới")}
      cancelText="Hủy"
      style={{ top: 20 }}
      okButtonProps={{
        style: {
          background: 'linear-gradient(135deg, #10b981, #059669)',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 600,
          padding: '8px 24px',
          height: 'auto'
        },
        className: "btn-primary hover:shadow-lg hover:scale-105"
      }}
      cancelButtonProps={{
        style: {
          borderRadius: '8px',
          border: '2px solid #e5e7eb',
          fontWeight: 500
        },
        className: "hover:border-green-300 hover:text-green-600 hover:scale-105"
      }}
      className="template-form-modal"
    >
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 md:p-4 rounded-xl">
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e5e7eb',
            marginBottom: 0
          }}
          tabBarStyle={{ marginBottom: 0 }}
        >
          <TabPane 
            tab={
              <div className="flex items-center gap-2">
                <FormOutlined className="text-green-600" />
                <span>Thông tin cơ bản</span>
              </div>
            } 
            key="basic"
          >
            <Form
              form={form}
              layout="vertical"
              name="activity_template_form"
              initialValues={{ is_required: false }}
              className="form-section"
              style={{ maxWidth: 900, margin: '0 auto' }}
            >
              {/* Basic Information Card */}
              <Card 
                className="mb-4 hover-lift"
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  padding: '16px 12px',
                  marginBottom: 16
                }}
                bodyStyle={{ padding: '12px 0 0 0' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileTextOutlined className="text-green-600 text-lg" />
                  <Title level={5} className="mb-0 text-gray-800">Thông tin chung</Title>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="name"
                    label={<span className="font-semibold text-gray-700">Tên mẫu hoạt động <span className="text-red-500">*</span></span>}
                    rules={[{ required: true, message: "Vui lòng nhập tên hoạt động" }]}
                  >
                    <Input 
                      placeholder="Ví dụ: Bón phân lần 1" 
                      style={{
                        borderRadius: 10,
                        border: '2px solid #e5e7eb',
                        minHeight: 44,
                        fontSize: 16,
                        padding: '10px 16px'
                      }}
                      className="hover:border-green-300 focus:border-green-500"
                    />
                  </Form.Item>
                  <Form.Item
                    name="description"
                    label={<span className="font-semibold text-gray-700">Mô tả</span>}
                  >
                    <TextArea 
                      rows={2} 
                      placeholder="Nhập mô tả chi tiết về hoạt động..." 
                      style={{
                        borderRadius: 10,
                        border: '2px solid #e5e7eb',
                        minHeight: 44,
                        fontSize: 16,
                        padding: '10px 16px'
                      }}
                      className="hover:border-green-300 focus:border-green-500"
                    />
                  </Form.Item>
                </div>
              </Card>

              {/* Stage and Activity Type Card */}
              <Card 
                className="mb-4 hover-lift"
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  padding: '16px 12px',
                  marginBottom: 16
                }}
                bodyStyle={{ padding: '12px 0 0 0' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TagsOutlined className="text-blue-600 text-lg" />
                  <Title level={5} className="mb-0 text-gray-800">Phân loại hoạt động</Title>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="stage"
                    label={<span className="font-semibold text-gray-700">Giai đoạn <span className="text-red-500">*</span></span>}
                    rules={[{ required: true, message: "Vui lòng chọn giai đoạn" }]}
                  >
                    <Select 
                      placeholder="Chọn giai đoạn"
                      style={{
                        borderRadius: 10,
                        border: '2px solid #e5e7eb',
                        height: 48,
                        minHeight: 44,
                        fontSize: 17,
                        padding: '6px 16px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      dropdownStyle={{ fontSize: 17, minHeight: 44 }}
                      className="hover:border-green-300 focus:border-green-500"
                    >
                      {stageOptions.map(option => (
                        <Option key={option.value} value={option.value} style={{ fontSize: 17, minHeight: 44, height: 44, display: 'flex', alignItems: 'center' }}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="activity_type"
                    label={<span className="font-semibold text-gray-700">Loại hoạt động <span className="text-red-500">*</span></span>}
                    rules={[{ required: true, message: "Vui lòng chọn loại hoạt động" }]}
                  >
                    <Select 
                      placeholder="Chọn loại hoạt động"
                      style={{
                        borderRadius: 10,
                        border: '2px solid #e5e7eb',
                        height: 48,
                        minHeight: 44,
                        fontSize: 17,
                        padding: '6px 16px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      dropdownStyle={{ fontSize: 17, minHeight: 44 }}
                      className="hover:border-green-300 focus:border-green-500"
                    >
                      {activityTypeOptions.map(option => (
                        <Option key={option.value} value={option.value} style={{ fontSize: 17, minHeight: 44, height: 44, display: 'flex', alignItems: 'center' }}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </div>
              </Card>

              {/* Timing Card */}
              <Card 
                className="mb-4 hover-lift"
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  padding: '16px 12px',
                  marginBottom: 16
                }}
                bodyStyle={{ padding: '12px 0 0 0' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ClockCircleOutlined className="text-orange-600 text-lg" />
                  <Title level={5} className="mb-0 text-gray-800">Thời gian thực hiện</Title>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="day_offset"
                    label={<span className="font-semibold text-gray-700">Bắt đầu sau (ngày) <span className="text-red-500">*</span></span>}
                    rules={[{ required: true, message: "Vui lòng nhập số ngày bắt đầu" }]}
                    tooltip={{
                      title: "Số ngày sau khi bắt đầu giai đoạn. Giá trị âm nghĩa là trước khi bắt đầu giai đoạn.",
                      icon: <InfoCircleOutlined />
                    }}
                  >
                    <InputNumber 
                      style={{ 
                        width: '100%',
                        borderRadius: 10,
                        border: '2px solid #e5e7eb',
                        minHeight: 44,
                        fontSize: 16,
                        padding: '10px 16px'
                      }} 
                      placeholder="0"
                      className="hover:border-green-300 focus:border-green-500"
                    />
                  </Form.Item>
                  <Form.Item
                    name="duration_days"
                    label={<span className="font-semibold text-gray-700">Kéo dài (ngày) <span className="text-red-500">*</span></span>}
                    rules={[{ required: true, message: "Vui lòng nhập số ngày kéo dài" }]}
                  >
                    <InputNumber 
                      min={1} 
                      style={{ 
                        width: '100%',
                        borderRadius: 10,
                        border: '2px solid #e5e7eb',
                        minHeight: 44,
                        fontSize: 16,
                        padding: '10px 16px'
                      }} 
                      placeholder="1"
                      className="hover:border-green-300 focus:border-green-500"
                    />
                  </Form.Item>
                </div>
              </Card>

              {/* Settings Card */}
              <Card 
                className="hover-lift"
                style={{
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  padding: '16px 12px',
                  marginBottom: 0
                }}
                bodyStyle={{ padding: '12px 0 0 0' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <SettingOutlined className="text-purple-600 text-lg" />
                  <Title level={5} className="mb-0 text-gray-800">Cài đặt bổ sung</Title>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="is_required"
                    label={<span className="font-semibold text-gray-700">Bắt buộc</span>}
                    valuePropName="checked"
                  >
                    <Switch 
                      style={{
                        backgroundColor: '#e5e7eb',
                        minHeight: 36
                      }}
                      className="hover:scale-110"
                    />
                  </Form.Item>
                  <Form.Item
                    name="season_specific"
                    label={<span className="font-semibold text-gray-700">Mùa vụ cụ thể</span>}
                    tooltip={{
                      title: "Để trống nếu áp dụng cho tất cả các mùa vụ",
                      icon: <InfoCircleOutlined />
                    }}
                  >
                    <Select 
                      placeholder="Chọn mùa vụ" 
                      allowClear
                      style={{
                        borderRadius: 10,
                        border: '2px solid #e5e7eb',
                        minHeight: 44,
                        fontSize: 16,
                        padding: '6px 16px'
                      }}
                      dropdownStyle={{ fontSize: 16, minHeight: 44 }}
                      className="hover:border-green-300 focus:border-green-500"
                    >
                      <Option value="Xuân-Hè">Xuân - Hè</Option>
                      <Option value="Thu-Đông">Thu - Đông</Option>
                      <Option value="Đông-Xuân">Đông - Xuân</Option>
                      <Option value="Hè-Thu">Hè - Thu</Option>
                    </Select>
                  </Form.Item>
                </div>
              </Card>
            </Form>
          </TabPane>
          
          <TabPane 
            tab={
              <div className="flex items-center gap-2">
                <ShoppingCartOutlined className="text-orange-600" />
                <span>Vật tư</span>
                {canShowMaterialsTab && (
                  <Badge count="✓" style={{ backgroundColor: '#10b981' }} />
                )}
              </div>
            } 
            key="materials"
          >
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              {canShowMaterialsTab ? (
                <>
                  {/* Summary bar */}
                  <div style={{
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center',
                    marginBottom: 12,
                    background: '#f8fafc',
                    border: '1.5px solid #e5e7eb',
                    borderRadius: 10,
                    padding: '10px 18px',
                    fontSize: 16,
                    fontWeight: 500
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ShoppingCartOutlined style={{ color: '#3b82f6', fontSize: 18 }} /> Tổng vật tư: <b>{materialsStats?.total_materials ?? 0}</b>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <DollarOutlined style={{ color: '#f59e0b', fontSize: 18 }} /> Chi phí: <b>{(materialsStats?.cost_estimate ?? 0).toLocaleString()} VNĐ</b>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {materialsStats?.is_feasible ? (
                        <CheckCircleOutlined style={{ color: '#10b981', fontSize: 18 }} />
                      ) : (
                        <ExclamationCircleOutlined style={{ color: '#ef4444', fontSize: 18 }} />
                      )}
                      <span style={{ color: materialsStats?.is_feasible ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {materialsStats?.is_feasible ? 'Khả thi' : 'Không khả thi'}
                      </span>
                    </span>
                  </div>
                  {/* Bảng vật tư */}
                  <div>
                    <TemplateMaterialsManager
                      templateId={templateId!}
                      templateName={template?.name || form.getFieldValue('name') || 'Template mới'}
                      readOnly={false}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-12 empty-state">
                  <ShoppingCartOutlined className="text-6xl text-gray-300 mb-4" />
                  <Title level={4} className="text-gray-600 mb-2">
                    Chưa thể quản lý vật tư
                  </Title>
                  <Text className="text-gray-500 block mb-4">
                    Vui lòng tạo mẫu hoạt động trước, sau đó có thể thêm vật tư cần thiết.
                  </Text>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <InfoCircleOutlined />
                      <Text className="text-sm">
                        Sau khi tạo thành công, tab này sẽ cho phép bạn quản lý vật tư.
                      </Text>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabPane>
        </Tabs>
      </div>
    </Modal>
  );
}
