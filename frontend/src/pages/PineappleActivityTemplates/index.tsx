import { useState, useEffect } from "react";
import { 
  Table, Button, Space, Tag, Select, Input, Modal, 
  message, Tooltip, Badge, Tabs, Card, Typography
} from "antd";
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  CopyOutlined, CheckCircleOutlined, FilterOutlined,
  ShoppingCartOutlined
} from "@ant-design/icons";
import pineappleActivityTemplateService, { 
  PineappleTemplateParams, 
  PineappleActivityTemplate,
  PineappleStage,
  PineappleActivityType 
} from "@/services/farming/pineappleActivityTemplateService";
import { getPineappleCrops } from "@/services/farming/pineappleCropService";
import templateMaterialService from "@/services/farming/templateMaterialService";
import ActivityTemplateForm from "./ActivityTemplateForm";
import MaterialsOverview from "@/components/TemplateMaterials/MaterialsOverview";

const { Option } = Select;
const { Search } = Input;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

// Mapping cho giai đoạn (stage)
const stageOptions = [
  { value: PineappleStage.PREPARATION, label: "Chuẩn bị đất & mật độ trồng" },
  { value: PineappleStage.SEEDLING_PREPARATION, label: "Chuẩn bị giống & vật tư" },
  { value: PineappleStage.PLANTING, label: "Trồng dứa" },
  { value: "leaf_tying", label: "Buộc lá (tránh chính vụ)" },
  { value: "first_fertilizing", label: "Bón phân thúc lần 1" },
  { value: "second_fertilizing", label: "Bón phân thúc lần 2" },
  { value: "flower_treatment", label: "Xử lý ra hoa" },
  { value: "sun_protection", label: "Buộc tránh nắng / Che lưới đen" },
  { value: "fruit_development", label: "Bón phân thúc quả lớn" },
  { value: "harvesting", label: "Thu hoạch" },
  { value: "sprout_collection", label: "Tách chồi giống" },
  { value: "field_cleaning", label: "Dọn vườn" }
];

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

export default function PineappleActivityTemplates() {
  // State
  const [templates, setTemplates] = useState<PineappleActivityTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredStage, setFilteredStage] = useState<number | string | null>(null);
  const [filteredType, setFilteredType] = useState<number | string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formVisible, setFormVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PineappleActivityTemplate | null>(null);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [cropsLoading, setCropsLoading] = useState(false);
  const [materialsStats, setMaterialsStats] = useState<Record<number, any>>({});

  // Fetch dữ liệu
  useEffect(() => {
    fetchTemplates();
  }, [filteredStage, filteredType]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params: PineappleTemplateParams = {};
      if (filteredStage) params.stage = filteredStage;
      if (filteredType) params.activity_type = filteredType;
      
      const response = await pineappleActivityTemplateService.getTemplates(params);
      const templatesData = response.data || [];
      setTemplates(templatesData);
      
      // Fetch materials stats for each template
      const stats: Record<number, any> = {};
      for (const template of templatesData) {
        if (template.id) {
          try {
            const statsResponse = await templateMaterialService.getTemplateMaterialStats(template.id);
            stats[template.id] = statsResponse.stats;
          } catch (error) {
            console.error(`Error fetching stats for template ${template.id}:`, error);
            stats[template.id] = { total_materials: 0, total_estimated_cost: 0 };
          }
        }
      }
      setMaterialsStats(stats);
    } catch (error) {
      message.error("Không thể tải danh sách mẫu hoạt động");
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCrops = async () => {
    try {
      setCropsLoading(true);
      const response = await getPineappleCrops();
      console.log("Crops API response:", response);
      console.log("Crops items:", response.items);
      if (response.items && response.items.length > 0) {
        console.log("First crop:", response.items[0]);
        console.log("First crop field_area:", response.items[0].field_area);
      }
      setCrops(response.items || []);
    } catch (error) {
      message.error("Không thể tải danh sách vụ dứa");
      console.error("Error fetching crops:", error);
    } finally {
      setCropsLoading(false);
    }
  };

  // Xử lý các thao tác
  const handleEdit = (template: PineappleActivityTemplate) => {
    setEditingTemplate(template);
    setFormVisible(true);
  };

interface DeleteTemplateError {
    response?: {
        data?: {
            error?: string;
        };
    };
}

const handleDelete = async (id: number): Promise<void> => {
    Modal.confirm({
        title: "Xác nhận xóa mẫu hoạt động",
        content: "Bạn có chắc muốn xóa mẫu hoạt động này không?",
        okText: "Xóa",
        okType: "danger",
        cancelText: "Hủy",
        onOk: async () => {
            try {
                await pineappleActivityTemplateService.deleteTemplate(id);
                message.success("Đã xóa mẫu hoạt động");
                fetchTemplates();
            } catch (error) {
                const err = error as DeleteTemplateError;
                message.error("Không thể xóa mẫu hoạt động: " + (err.response?.data?.error || "Lỗi không xác định"));
            }
        }
    });
};

const handleApply = (templateId: number): void => {
    setSelectedTemplateId(templateId);
    setApplyModalVisible(true);
    fetchCrops();
};

  const handleFormSubmit = () => {
    fetchTemplates();
    setFormVisible(false);
    setEditingTemplate(null);
  };
  
const getStageLabel = (stage: number): string => {
    // Chuyển đổi từ số sang tên giai đoạn
    switch(stage) {
        case PineappleStage.PREPARATION: return "Chuẩn bị đất & mật độ trồng";
        case PineappleStage.SEEDLING_PREPARATION: return "Chuẩn bị giống & vật tư";
        case PineappleStage.PLANTING: return "Trồng dứa";
        case PineappleStage.LEAF_TYING: return "Buộc lá (tránh chính vụ)";
        case PineappleStage.FIRST_FERTILIZING: return "Bón phân thúc lần 1";
        case PineappleStage.SECOND_FERTILIZING: return "Bón phân thúc lần 2";
        case PineappleStage.FLOWER_TREATMENT: return "Xử lý ra hoa";
        case PineappleStage.SUN_PROTECTION: return "Buộc tránh nắng / Che lưới đen";
        case PineappleStage.FRUIT_DEVELOPMENT: return "Bón phân thúc quả lớn";
        case PineappleStage.HARVESTING: return "Thu hoạch";
        case PineappleStage.SPROUT_COLLECTION: return "Tách chồi giống";
        case PineappleStage.FIELD_CLEANING: return "Dọn vườn";
        default: return `Giai đoạn ${stage}`;
    }
};
  
const getActivityTypeLabel = (type: number): string => {
    // Chuyển đổi từ số sang tên loại hoạt động
    switch(type) {
        case PineappleActivityType.SOIL_PREPARATION: return "Chuẩn bị đất";
        case PineappleActivityType.SEEDLING_PREPARATION: return "Chuẩn bị giống & vật tư";
        case PineappleActivityType.PLANTING: return "Trồng dứa";
        case PineappleActivityType.LEAF_TYING: return "Buộc lá";
        case PineappleActivityType.FERTILIZING: return "Bón phân";
        case PineappleActivityType.PESTICIDE: return "Phun thuốc";
        case PineappleActivityType.SUN_PROTECTION: return "Che nắng";
        case PineappleActivityType.FRUIT_DEVELOPMENT: return "Thúc quả";
        case PineappleActivityType.HARVESTING: return "Thu hoạch";
        case PineappleActivityType.SPROUT_COLLECTION: return "Tách chồi";
        case PineappleActivityType.FIELD_CLEANING: return "Dọn vườn";
        case PineappleActivityType.WATERING: return "Tưới nước";
        case PineappleActivityType.WEEDING: return "Làm cỏ";
        case PineappleActivityType.OTHER: return "Khác";
        default: return `Loại ${type}`;
    }
};

  // Columns for the table
interface ColumnRecord {
    id: number;
    name: string;
    stage: string;
    activity_type: number;
    day_offset: number;
    duration_days: number;
    is_required: boolean;
    season_specific?: string;
    user_id?: number | null;
}

const columns = [
    {
        title: "Tên hoạt động",
        dataIndex: "name",
        key: "name",
        render: (text: string, record?: ColumnRecord) => (
            <div style={{ display: "flex", alignItems: "center" }}>
                {!record?.user_id && (
                    <Badge color="blue" style={{ marginRight: 8 }} />
                )}
                <span>{text}</span>
            </div>
        )
    },
    {
        title: "Giai đoạn",
        dataIndex: "stage",
        key: "stage",
        render: (stage: number) => <Tag color="green">{getStageLabel(stage)}</Tag>
    },
    {
        title: "Loại hoạt động",
        dataIndex: "activity_type",
        key: "activity_type",
        render: (type: number) => <Tag color="blue">{getActivityTypeLabel(type)}</Tag>
    },
    {
        title: "Vật tư",
        key: "materials",
        render: (_: any, record: ColumnRecord) => {
            const stats = materialsStats[record.id];
            if (!stats || stats.total_materials === 0) {
                return <span style={{ color: '#999' }}>Chưa có vật tư</span>;
            }
            return (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <ShoppingCartOutlined style={{ color: '#1890ff' }} />
                        <span>{stats.total_materials} vật tư</span>
                    </div>
                    {stats.total_estimated_cost > 0 && (
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            ~{stats.total_estimated_cost.toLocaleString()} VNĐ
                        </div>
                    )}
                </div>
            );
        }
    },
    {
        title: "Bắt đầu sau (ngày)",
        dataIndex: "day_offset",
        key: "day_offset",
        render: (days: number) => (
            <span>{days < 0 ? `${Math.abs(days)} ngày trước` : `${days} ngày sau`}</span>
        )
    },
    {
        title: "Kéo dài (ngày)",
        dataIndex: "duration_days", 
        key: "duration_days",
    },
    {
        title: "Bắt buộc",
        dataIndex: "is_required",
        key: "is_required",
        render: (isRequired: boolean) => (
            isRequired ? (
                <Tag color="red">Bắt buộc</Tag>
            ) : (
                <Tag color="default">Tùy chọn</Tag>
            )
        )
    },
    {
        title: "Mùa vụ",
        dataIndex: "season_specific",
        key: "season_specific",
        render: (season?: string) => (
            season ? <Tag color="orange">{season}</Tag> : <span>Tất cả mùa vụ</span>
        )
    },
    {
        title: "Hành động",
        key: "action",
        render: (_: any, record: ColumnRecord | undefined) => {
            if (!record) return null;
            
            return (
                <Space size="small">
                    {record.user_id && (
                        <>
                            <Tooltip title="Sửa">
                                <Button 
                                    icon={<EditOutlined />} 
                                    onClick={() => handleEdit({ ...record, stage: Number(record.stage), user_id: record.user_id ?? undefined })}
                                    type="text"
                                    size="small"
                                />
                            </Tooltip>
                            <Tooltip title="Xóa">
                                <Button 
                                    icon={<DeleteOutlined />} 
                                    onClick={() => handleDelete(record.id)}
                                    type="text"
                                    danger
                                    size="small"
                                />
                            </Tooltip>
                        </>
                    )}
                    {!record.user_id && (
                        <Tooltip title="Sao chép để tạo mẫu mới">
                            <Button 
                                icon={<CopyOutlined />} 
                                onClick={() => handleEdit({...record, id: undefined, stage: Number(record.stage), user_id: record.user_id ?? undefined})}
                                type="text"
                                size="small"
                            />
                        </Tooltip>
                    )}
                    <Tooltip title="Áp dụng cho vụ dứa">
                        <Button 
                            icon={<CheckCircleOutlined />} 
                            onClick={() => handleApply(record.id)}
                            type="text"
                            size="small"
                        />
                    </Tooltip>
                </Space>
            );
        },
    },
];

  const filteredTemplates = templates
    .filter(template => {
      if (activeTab === "default" && template.user_id) return false;
      if (activeTab === "custom" && !template.user_id) return false;

      return template.name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .map(template => ({
      ...template,
      id: template.id ?? 0, // Ensure id is always a number
      stage: String(template.stage), // Convert stage to string
      is_required: template.is_required ?? false, // Ensure is_required is always a boolean
    }));

  return (
    <Card className="bg-white rounded-lg shadow">
      <div className="mb-4">
        <Title level={3}>Quản lý Quy Trình Trồng Dứa Chung</Title>
        <Text type="secondary">
          Tạo và quản lý các mẫu hoạt động chuẩn cho quy trình trồng dứa, giúp áp dụng nhanh chóng cho các vụ mùa
        </Text>
      </div>

      {/* Filter controls */}
      <div className="mb-4 p-4 border rounded bg-gray-50">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <Text strong>Giai đoạn</Text>
            <Select 
              placeholder="Tất cả giai đoạn"
              style={{ width: 220 }}
              onChange={setFilteredStage}
              allowClear
            >
              {stageOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <Text strong>Loại hoạt động</Text>
            <Select 
              placeholder="Tất cả loại"
              style={{ width: 180 }}
              onChange={setFilteredType}
              allowClear
            >
              {activityTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </div>

          <div style={{ flex: 1, minWidth: 200 }}>
            <Search 
              placeholder="Tìm kiếm theo tên..."
              onSearch={(value) => setSearchTerm(value)}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
              allowClear
            />
          </div>

          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingTemplate(null);
              setFormVisible(true);
            }}
          >
            Thêm mẫu mới
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Tất cả mẫu" key="all" />
        <TabPane tab="Mẫu mặc định" key="default" />
        <TabPane tab="Mẫu tùy chỉnh" key="custom" />
        <TabPane tab="Tổng quan vật tư" key="materials-overview" />
      </Tabs>

      {/* Content based on active tab */}
      {activeTab === "materials-overview" ? (
        <MaterialsOverview
          templateIds={templates.map(t => t.id!).filter(Boolean)}
          onRefresh={fetchTemplates}
        />
      ) : (
        <>
          {/* Table chú giải */}
          <div className="mb-4 flex items-center text-sm">
            <Badge color="blue" className="mr-1" />
            <span className="mr-4">Mẫu mặc định</span>
            <span className="mr-2 text-gray-500">Ghi chú:</span>
            <span className="text-gray-500">Mẫu mặc định không thể sửa/xóa nhưng có thể sao chép để tạo mẫu riêng</span>
          </div>

          {/* Table */}
          <Table 
            columns={columns} 
            dataSource={filteredTemplates}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            rowClassName={(record) => !record.user_id ? "bg-blue-50" : ""}
            locale={{ emptyText: "Không có mẫu hoạt động nào" }}
          />
        </>
      )}

      {/* Form modal */}
      <ActivityTemplateForm
        visible={formVisible}
        onCancel={() => {
          setFormVisible(false);
          setEditingTemplate(null);
        }}
        onSubmit={handleFormSubmit}
        template={editingTemplate}
        stageOptions={stageOptions.map(option => ({ ...option, value: String(option.value) }))}
        activityTypeOptions={activityTypeOptions.map(option => ({ ...option, value: String(option.value) }))}
      />

      {/* Apply template modal */}
      <Modal
        title="Áp dụng mẫu hoạt động"
        open={applyModalVisible}
        onCancel={() => setApplyModalVisible(false)}
        onOk={async () => {
          if (!selectedCropId) {
            message.error("Vui lòng chọn vụ dứa");
            return;
          }

          try {
            await pineappleActivityTemplateService.applyToCrop({
              template_id: selectedTemplateId || 0, // Đảm bảo không bao giờ null
              crop_id: selectedCropId
            });
            message.success("Đã áp dụng mẫu hoạt động thành công");
            setApplyModalVisible(false);
          } catch (error) {
            const err = error as { response?: { data?: { error?: string } } };
            message.error("Không thể áp dụng mẫu hoạt động: " + (err.response?.data?.error || "Lỗi không xác định"));
          }
        }}
        okButtonProps={{ loading: cropsLoading }}
        width={600}
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 font-medium">Chọn vụ dứa để áp dụng mẫu hoạt động này:</p>
            <Select
              placeholder="Chọn vụ dứa"
              style={{ width: '100%' }}
              onChange={setSelectedCropId}
              loading={cropsLoading}
            >
              {crops.map(crop => (
                <Option key={crop.id} value={crop.id}>
                  {crop.name || `Vụ dứa #${crop.id}`}
                </Option>
              ))}
            </Select>
          </div>

          {/* Hiển thị thông tin crop được chọn */}
          {selectedCropId && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="font-medium mb-2">Thông tin vụ dứa:</div>
              {(() => {
                const selectedCrop = crops.find(c => c.id === selectedCropId);
                if (!selectedCrop) return null;
                
                const fieldAreaHa = selectedCrop.field_area ? (selectedCrop.field_area / 10000) : 0;
                
                return (
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Tên:</span> {selectedCrop.name || `Vụ dứa #${selectedCrop.id}`}</div>
                    <div><span className="font-medium">Giống:</span> {selectedCrop.variety || 'Không xác định'}</div>
                    <div><span className="font-medium">Diện tích:</span> {selectedCrop.field_area?.toLocaleString()} m² ({fieldAreaHa.toFixed(4)} ha)</div>
                    <div><span className="font-medium">Giai đoạn hiện tại:</span> {selectedCrop.current_stage || 'Không xác định'}</div>
                    <div><span className="font-medium">Trạng thái:</span> {selectedCrop.status || 'Không xác định'}</div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Hiển thị thông tin template được chọn */}
          {selectedTemplateId && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <div className="font-medium mb-2">Thông tin mẫu hoạt động:</div>
              {(() => {
                const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
                if (!selectedTemplate) return null;
                
                return (
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Tên:</span> {selectedTemplate.name}</div>
                    <div><span className="font-medium">Giai đoạn:</span> {getStageLabel(Number(selectedTemplate.stage))}</div>
                    <div><span className="font-medium">Loại hoạt động:</span> {getActivityTypeLabel(selectedTemplate.activity_type)}</div>
                    <div><span className="font-medium">Thời gian:</span> {selectedTemplate.duration_days} ngày</div>
                    {(selectedTemplate as any).materials && (selectedTemplate as any).materials.length > 0 && (
                      <div>
                        <span className="font-medium">Vật tư:</span>
                        <div className="mt-1 space-y-1">
                          {(selectedTemplate as any).materials.map((material: any, index: number) => (
                            <div key={index} className="text-xs bg-white px-2 py-1 rounded border">
                              {material.name}: {material.quantity} {material.unit}/ha
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Thông báo về tính toán vật tư */}
          {selectedCropId && selectedTemplateId && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-green-800">
                  <div className="font-medium mb-1">Tính toán vật tư theo diện tích</div>
                  <div>Số lượng vật tư sẽ được tính toán dựa trên diện tích thực tế của cánh đồng và làm tròn lên.</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Card>
  );
}
