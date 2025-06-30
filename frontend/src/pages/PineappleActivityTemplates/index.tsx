import { useState, useEffect } from "react";
import { 
  Table, Button, Space, Tag, Select, Input, Modal, 
  message, Tooltip, Badge, Tabs, Card, Typography
} from "antd";
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  CopyOutlined, CheckCircleOutlined, FilterOutlined,
  ShoppingCartOutlined, SearchOutlined, ReloadOutlined,
  FileTextOutlined, SettingOutlined, RocketOutlined,
  CalendarOutlined, ClockCircleOutlined, StarOutlined,
  UserOutlined, TeamOutlined, FireOutlined
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
import "./pineapple-templates.css";

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

// Thêm mapping icon và màu cho stage/type - sử dụng string keys
const stageMeta: Record<string, { icon: string; color: string }> = {
  preparation: { icon: '🌱', color: '#52c41a' },
  seedling_preparation: { icon: '🌿', color: '#1890ff' },
  planting: { icon: '🌺', color: '#722ed1' },
  leaf_tying: { icon: '🍃', color: '#13c2c2' },
  first_fertilizing: { icon: '💧', color: '#fa8c16' },
  second_fertilizing: { icon: '🌱', color: '#fa541c' },
  flower_treatment: { icon: '🌸', color: '#eb2f96' },
  sun_protection: { icon: '☀️', color: '#fadb14' },
  fruit_development: { icon: '🍍', color: '#a0d911' },
  harvesting: { icon: '✂️', color: '#faad14' },
  sprout_collection: { icon: '🌱', color: '#52c41a' },
  field_cleaning: { icon: '🧹', color: '#8c8c8c' }
};

const typeMeta: Record<string, { icon: string; color: string }> = {
  soil_preparation: { icon: '🌱', color: '#52c41a' },
  seedling_preparation: { icon: '🌿', color: '#1890ff' },
  planting: { icon: '🌺', color: '#722ed1' },
  leaf_tying: { icon: '🍃', color: '#13c2c2' },
  fertilizing: { icon: '💧', color: '#fa8c16' },
  pesticide: { icon: '🧪', color: '#fa541c' },
  sun_protection: { icon: '☀️', color: '#fadb14' },
  fruit_development: { icon: '🍍', color: '#a0d911' },
  harvesting: { icon: '✂️', color: '#faad14' },
  sprout_collection: { icon: '🌱', color: '#52c41a' },
  field_cleaning: { icon: '🧹', color: '#8c8c8c' },
  watering: { icon: '💧', color: '#1890ff' },
  weeding: { icon: '🌿', color: '#52c41a' },
  other: { icon: '📋', color: '#8c8c8c' }
};

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
            if (statsResponse.success) {
              stats[template.id] = statsResponse.statistics;
            } else {
              console.error(`Failed to fetch stats for template ${template.id}:`, statsResponse);
              stats[template.id] = { total_materials: 0, total_estimated_cost: 0 };
            }
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
  
  const getStageLabel = (stage: string | number): string => {
    // Chuyển đổi từ string/number sang tên giai đoạn
    const stageStr = String(stage);
    switch(stageStr) {
      case 'preparation': return "Chuẩn bị đất & mật độ trồng";
      case 'seedling_preparation': return "Chuẩn bị giống & vật tư";
      case 'planting': return "Trồng dứa";
      case 'leaf_tying': return "Buộc lá (tránh chính vụ)";
      case 'first_fertilizing': return "Bón phân thúc lần 1";
      case 'second_fertilizing': return "Bón phân thúc lần 2";
      case 'flower_treatment': return "Xử lý ra hoa";
      case 'sun_protection': return "Buộc tránh nắng / Che lưới đen";
      case 'fruit_development': return "Bón phân thúc quả lớn";
      case 'harvesting': return "Thu hoạch";
      case 'sprout_collection': return "Tách chồi giống";
      case 'field_cleaning': return "Dọn vườn";
      default: return `Giai đoạn ${stageStr}`;
    }
  };
  
  const getActivityTypeLabel = (type: string | number): string => {
    // Chuyển đổi từ string/number sang tên loại hoạt động
    const typeStr = String(type);
    switch(typeStr) {
      case 'soil_preparation': return "Chuẩn bị đất";
      case 'seedling_preparation': return "Chuẩn bị giống & vật tư";
      case 'planting': return "Trồng dứa";
      case 'leaf_tying': return "Buộc lá";
      case 'fertilizing': return "Bón phân";
      case 'pesticide': return "Phun thuốc";
      case 'sun_protection': return "Che nắng";
      case 'fruit_development': return "Thúc quả";
      case 'harvesting': return "Thu hoạch";
      case 'sprout_collection': return "Tách chồi";
      case 'field_cleaning': return "Dọn vườn";
      case 'watering': return "Tưới nước";
      case 'weeding': return "Làm cỏ";
      case 'other': return "Khác";
      default: return `Loại ${typeStr}`;
    }
  };

  // Columns for the table
  interface ColumnRecord {
    id: number;
    name: string;
    stage: string;
    activity_type: string;
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
      render: (text: string, record: ColumnRecord) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!record?.user_id && (
            <Badge color="blue" style={{ marginRight: 8 }} />
          )}
          <span className="font-semibold text-gray-900">{text}</span>
        </div>
      )
    },
    {
      title: "Giai đoạn",
      dataIndex: "stage",
      key: "stage",
      render: (stage: string | number) => {
        const stageStr = String(stage);
        const meta = stageMeta[stageStr] || { icon: '📋', color: '#8c8c8c' };
        return (
          <Tag 
            style={{ 
              fontWeight: 500, 
              fontSize: 14,
              border: `2px solid ${meta.color}`,
              color: meta.color,
              backgroundColor: 'transparent',
              borderRadius: '8px',
              padding: '4px 8px'
            }}
          >
            <span style={{ marginRight: 4 }}>{meta.icon}</span>{getStageLabel(stageStr)}
          </Tag>
        );
      }
    },
    {
      title: "Loại hoạt động",
      dataIndex: "activity_type",
      key: "activity_type",
      render: (type: string | number) => {
        const typeStr = String(type);
        const meta = typeMeta[typeStr] || { icon: '📋', color: '#8c8c8c' };
        return (
          <Tag 
            style={{ 
              fontWeight: 500, 
              fontSize: 14,
              border: `2px solid ${meta.color}`,
              color: meta.color,
              backgroundColor: 'transparent',
              borderRadius: '8px',
              padding: '4px 8px'
            }}
          >
            <span style={{ marginRight: 4 }}>{meta.icon}</span>{getActivityTypeLabel(typeStr)}
          </Tag>
        );
      }
    },
    {
      title: "Vật tư",
      key: "materials",
      render: (_: any, record: ColumnRecord) => {
        const stats = materialsStats[record.id];
        if (!stats || stats.total_materials === 0) {
          return <span style={{ color: '#bbb', fontStyle: 'italic' }}>Chưa có vật tư</span>;
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShoppingCartOutlined style={{ color: '#1890ff' }} />
            <span className="font-medium text-blue-900">{stats.total_materials} vật tư</span>
            {stats.total_estimated_cost > 0 && (
              <span style={{ fontSize: 12, color: '#666', marginLeft: 4 }}>
                ~{stats.total_estimated_cost.toLocaleString()} VNĐ
              </span>
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
        <span className="text-gray-700 font-medium">{days < 0 ? `${Math.abs(days)} ngày trước` : `${days} ngày sau`}</span>
      )
    },
    {
      title: "Kéo dài (ngày)",
      dataIndex: "duration_days",
      key: "duration_days",
      render: (days: number) => <span className="text-gray-700">{days}</span>
    },
    {
      title: "Bắt buộc",
      dataIndex: "is_required",
      key: "is_required",
      render: (isRequired: boolean) => (
        isRequired ? (
          <Tag 
            style={{ 
              fontWeight: 500,
              border: '2px solid #ff4d4f',
              color: '#ff4d4f',
              backgroundColor: 'transparent',
              borderRadius: '8px',
              padding: '4px 8px'
            }}
          >
            Bắt buộc
          </Tag>
        ) : (
          <Tag 
            style={{ 
              fontWeight: 500,
              border: '2px solid #d9d9d9',
              color: '#666',
              backgroundColor: 'transparent',
              borderRadius: '8px',
              padding: '4px 8px'
            }}
          >
            Tùy chọn
          </Tag>
        )
      )
    },
    {
      title: "Mùa vụ",
      dataIndex: "season_specific",
      key: "season_specific",
      render: (season?: string) => (
        season ? (
          <Tag 
            style={{ 
              border: '2px solid #fa8c16',
              color: '#fa8c16',
              backgroundColor: 'transparent',
              borderRadius: '8px',
              padding: '4px 8px'
            }}
          >
            {season}
          </Tag>
        ) : (
          <span className="text-gray-400">Tất cả mùa vụ</span>
        )
      )
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: ColumnRecord) => {
        if (!record) return null;
        return (
          <Space size="small">
            {record.user_id && (
              <>
                <Tooltip title="Sửa">
                  <Button 
                    icon={<EditOutlined />} 
                    onClick={() => handleEdit({ ...record, stage: String(record.stage), user_id: record.user_id ?? undefined })}
                    type="text"
                    size="small"
                    style={{ 
                      color: '#1677ff',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      border: '1px solid #e5e7eb'
                    }}
                    className="action-btn hover:bg-blue-50 hover:border-blue-300 hover:scale-110 hover:shadow-md"
                  />
                </Tooltip>
                <Tooltip title="Xóa">
                  <Button 
                    icon={<DeleteOutlined />} 
                    onClick={() => handleDelete(record.id)}
                    type="text"
                    danger
                    size="small"
                    style={{ 
                      color: '#ff4d4f',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease',
                      border: '1px solid #e5e7eb'
                    }}
                    className="action-btn hover:bg-red-50 hover:border-red-300 hover:scale-110 hover:shadow-md"
                  />
                </Tooltip>
              </>
            )}
            {!record.user_id && (
              <Tooltip title="Sao chép để tạo mẫu mới">
                <Button 
                  icon={<CopyOutlined />} 
                  onClick={() => handleEdit({...record, id: undefined, stage: String(record.stage), user_id: record.user_id ?? undefined})}
                  type="text"
                  size="small"
                  style={{ 
                    color: '#52c41a',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    border: '1px solid #e5e7eb'
                  }}
                  className="action-btn hover:bg-green-50 hover:border-green-300 hover:scale-110 hover:shadow-md"
                />
              </Tooltip>
            )}
            <Tooltip title="Áp dụng cho vụ dứa">
              <Button 
                icon={<CheckCircleOutlined />} 
                onClick={() => handleApply(record.id)}
                type="text"
                size="small"
                style={{ 
                  color: '#13c2c2',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  border: '1px solid #e5e7eb'
                }}
                className="action-btn hover:bg-cyan-50 hover:border-cyan-300 hover:scale-110 hover:shadow-md"
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
      activity_type: String(template.activity_type), // Convert activity_type to string
      is_required: template.is_required ?? false, // Ensure is_required is always a boolean
    }));

  // Table custom row class - chỉ dùng border thay vì background
  const rowClassName = (record: ColumnRecord) =>
    !record.user_id
      ? 'border-l-4 border-l-blue-500 hover:bg-blue-50 transition-all duration-200'
      : 'border-l-4 border-l-transparent hover:bg-gray-50 transition-all duration-200';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-100">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Quản lý Quy Trình Trồng Dứa
              </h1>
              <p className="text-gray-600 mt-1">
                Tạo và quản lý các mẫu hoạt động chuẩn cho quy trình trồng dứa
              </p>
            </div>
            
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => {
                setEditingTemplate(null);
                setFormVisible(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: 600,
                transition: 'all 0.3s ease'
              }}
              className="btn-primary hover:shadow-lg hover:scale-105"
            >
              Thêm mẫu mới
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filter */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-6 border border-green-100">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1">
              <Text strong className="block mb-2 text-gray-700">Tìm kiếm</Text>
              <Search
                placeholder="Tìm kiếm theo tên mẫu..."
                prefix={<SearchOutlined className="text-gray-400" />}
                onSearch={(value) => setSearchTerm(value)}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb',
                  transition: 'all 0.3s ease'
                }}
                className="hover:border-green-300 focus:border-green-500"
                allowClear
              />
            </div>

            <div>
              <Text strong className="block mb-2 text-gray-700">Giai đoạn</Text>
              <Select
                placeholder="Tất cả giai đoạn"
                style={{ 
                  width: 250,
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb'
                }}
                onChange={setFilteredStage}
                allowClear
                className="hover:border-green-300 focus:border-green-500"
              >
                {stageOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <Text strong className="block mb-2 text-gray-700">Loại hoạt động</Text>
              <Select
                placeholder="Tất cả loại"
                style={{ 
                  width: 200,
                  borderRadius: '12px',
                  border: '2px solid #e5e7eb'
                }}
                onChange={setFilteredType}
                allowClear
                className="hover:border-green-300 focus:border-green-500"
              >
                {activityTypeOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </div>

            <Button
              icon={<ReloadOutlined />}
              onClick={fetchTemplates}
              loading={loading}
              style={{
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                transition: 'all 0.3s ease'
              }}
              className="hover:border-green-300 hover:text-green-600 hover:scale-105"
            />
          </div>

          {/* Clear filters */}
          {(filteredStage || filteredType || searchTerm) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Button
                type="text"
                onClick={() => {
                  setFilteredStage(null);
                  setFilteredType(null);
                  setSearchTerm("");
                }}
                style={{
                  color: '#6b7280',
                  transition: 'all 0.3s ease'
                }}
                className="hover:text-green-600 hover:scale-105"
              >
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb'
            }}
          >
            <TabPane tab="Tất cả mẫu" key="all" />
            <TabPane tab="Mẫu mặc định" key="default" />
            <TabPane tab="Mẫu tùy chỉnh" key="custom" />
            <TabPane tab="Tổng quan vật tư" key="materials-overview" />
          </Tabs>
        </div>

        {/* Content based on active tab */}
        {activeTab === "materials-overview" ? (
          <div className="bg-white rounded-xl shadow-sm border border-green-100 p-6">
            <MaterialsOverview
              templateIds={templates.map(t => t.id!).filter(Boolean)}
              onRefresh={fetchTemplates}
            />
          </div>
        ) : (
          <>
            {/* Table chú giải */}
            <div className="mb-4 flex items-center text-sm bg-white rounded-lg p-4 border border-green-100">
              <Badge color="blue" className="mr-1" />
              <span className="mr-4 font-medium">Mẫu mặc định</span>
              <span className="mr-2 text-gray-500">Ghi chú:</span>
              <span className="text-gray-500">Mẫu mặc định không thể sửa/xóa nhưng có thể sao chép để tạo mẫu riêng</span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden">
              <Table 
                columns={columns} 
                dataSource={filteredTemplates}
                rowKey="id"
                loading={loading}
                pagination={{ 
                  pageSize: 10,
                  style: {
                    padding: '16px',
                    backgroundColor: 'white'
                  }
                }}
                rowClassName={rowClassName}
                locale={{
                  emptyText: (
                    <div className="py-12 text-center text-gray-400">
                      <span style={{ fontSize: 48 }}>🍍</span>
                      <div className="mt-4 text-lg font-medium">Không có mẫu hoạt động nào</div>
                      <div className="mt-2">Bắt đầu tạo mẫu đầu tiên của bạn</div>
                    </div>
                  )
                }}
                style={{
                  borderRadius: '12px'
                }}
              />
            </div>
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
          title={
            <div className="flex items-center space-x-2">
              <RocketOutlined className="text-green-600" />
              <span>Áp dụng mẫu hoạt động</span>
            </div>
          }
          open={applyModalVisible}
          onCancel={() => setApplyModalVisible(false)}
          onOk={async () => {
            if (!selectedCropId) {
              message.error("Vui lòng chọn vụ dứa");
              return;
            }

            try {
              await pineappleActivityTemplateService.applyToCrop({
                template_id: selectedTemplateId || 0,
                crop_id: selectedCropId
              });
              message.success("Đã áp dụng mẫu hoạt động thành công");
              setApplyModalVisible(false);
            } catch (error) {
              const err = error as { response?: { data?: { error?: string } } };
              message.error("Không thể áp dụng mẫu hoạt động: " + (err.response?.data?.error || "Lỗi không xác định"));
            }
          }}
          okButtonProps={{ 
            loading: cropsLoading,
            style: {
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600
            }
          }}
          width={700}
        >
          <div className="space-y-6">
            <div>
              <Text strong className="block mb-3">Chọn vụ dứa để áp dụng mẫu hoạt động:</Text>
              <Select
                placeholder="Chọn vụ dứa"
                style={{ width: '100%' }}
                onChange={setSelectedCropId}
                loading={cropsLoading}
                size="large"
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
              <div className="border rounded-lg p-4 bg-green-50 border-green-200 material-stats">
                <div className="flex items-center space-x-2 mb-3">
                  <FireOutlined className="text-green-600 floating-icon" />
                  <Text strong>Thông tin vụ dứa</Text>
                </div>
                {(() => {
                  const selectedCrop = crops.find(c => c.id === selectedCropId);
                  if (!selectedCrop) return null;
                  
                  const fieldAreaHa = selectedCrop.field_area ? (selectedCrop.field_area / 10000) : 0;
                  
                  return (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><Text strong>Tên:</Text> {selectedCrop.name || `Vụ dứa #${selectedCrop.id}`}</div>
                      <div><Text strong>Giống:</Text> {selectedCrop.variety || 'Không xác định'}</div>
                      <div><Text strong>Diện tích:</Text> {selectedCrop.field_area?.toLocaleString()} m² ({fieldAreaHa.toFixed(4)} ha)</div>
                      <div><Text strong>Giai đoạn hiện tại:</Text> {selectedCrop.current_stage || 'Không xác định'}</div>
                      <div><Text strong>Trạng thái:</Text> {selectedCrop.status || 'Không xác định'}</div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Hiển thị thông tin template được chọn */}
            {selectedTemplateId && (
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200 template-info">
                <div className="flex items-center space-x-2 mb-3">
                  <FileTextOutlined className="text-blue-600 floating-icon" />
                  <Text strong>Thông tin mẫu hoạt động</Text>
                </div>
                {(() => {
                  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
                  if (!selectedTemplate) return null;
                  
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><Text strong>Tên:</Text> {selectedTemplate.name}</div>
                        <div><Text strong>Giai đoạn:</Text> {getStageLabel(selectedTemplate.stage)}</div>
                        <div><Text strong>Loại hoạt động:</Text> {getActivityTypeLabel(selectedTemplate.activity_type)}</div>
                        <div><Text strong>Thời gian:</Text> {selectedTemplate.duration_days} ngày</div>
                      </div>
                      
                      {(selectedTemplate as any).materials && (selectedTemplate as any).materials.length > 0 && (
                        <div>
                          <Text strong className="block mb-2">Vật tư:</Text>
                          <div className="space-y-2">
                            {(selectedTemplate as any).materials.map((material: any, index: number) => (
                              <div key={index} className="bg-white px-3 py-2 rounded border text-sm info-card">
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
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <CheckCircleOutlined className="text-green-500 text-xl mr-3 mt-1" />
                  <div>
                    <Text strong className="block mb-1 text-green-800">Tính toán vật tư theo diện tích</Text>
                    <Text className="text-green-700">
                      Số lượng vật tư sẽ được tính toán dựa trên diện tích thực tế của cánh đồng và làm tròn lên.
                    </Text>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
