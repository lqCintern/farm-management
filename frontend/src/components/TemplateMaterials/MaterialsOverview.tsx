import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Progress, Typography, Alert,
  Table, Tag, Tooltip, Button, Space, Empty, Badge
} from 'antd';
import {
  ShoppingCartOutlined, DollarOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined, WarningOutlined, ReloadOutlined,
  BarChartOutlined, InboxOutlined, SafetyOutlined, FileTextOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import templateMaterialService, {
  TemplateMaterialStats
} from '@/services/farming/templateMaterialService';
import { formatCurrency } from '@/utils/formatters';
import './template-materials.css';

const { Title, Text } = Typography;

interface MaterialsOverviewProps {
  templateIds: number[];
  onRefresh?: () => void;
}

interface TemplateMaterialSummary {
  template_id: number;
  template_name: string;
  total_materials: number;
  total_estimated_cost: number;
  is_feasible: boolean;
  missing_materials_count: number;
  insufficient_materials_count: number;
  activity_type?: number;
  materials?: Array<{
    id: number;
    material_name: string;
    quantity: number;
    unit: string;
  }>;
  insufficient_materials?: Array<{
    material_name: string;
    required: number;
    available: string | number;
    unit: string;
    reason: string;
  }>;
}

// Các activity_type bắt buộc vật tư (phải đồng bộ với backend)
const MATERIAL_REQUIRED_ACTIVITIES = [4, 5, 7]; // fertilizing, pesticide, fruit_development

export default function MaterialsOverview({
  templateIds,
  onRefresh
}: MaterialsOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TemplateMaterialSummary[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalTemplates: 0,
    templatesWithMaterials: 0,
    totalMaterials: 0,
    totalEstimatedCost: 0,
    feasibleTemplates: 0,
    totalMissingMaterials: 0,
    totalInsufficientMaterials: 0
  });

  useEffect(() => {
    fetchMaterialsSummary();
  }, [templateIds]);

  const fetchMaterialsSummary = async () => {
    try {
      setLoading(true);
      const summaries: TemplateMaterialSummary[] = [];
      let totalMaterials = 0;
      let totalEstimatedCost = 0;
      let feasibleTemplates = 0;
      let totalMissingMaterials = 0;
      let totalInsufficientMaterials = 0;

      for (const templateId of templateIds) {
        try {
          // Gọi API với cấu trúc response mới
          const response = await templateMaterialService.getTemplateMaterialStats(templateId);
          
          // Kiểm tra success
          if (!response.success) {
            console.error(`API call failed for template ${templateId}:`, response);
            continue;
          }

          const stats = response.statistics;

          // Debug log để kiểm tra giá trị
          console.log(`Template ${templateId} stats:`, stats);
          console.log(`Template ${templateId} cost_estimate:`, stats.cost_estimate, typeof stats.cost_estimate);
          console.log(`Template ${templateId} feasibility:`, stats.feasibility);
          console.log(`Template ${templateId} feasible:`, stats.feasibility?.feasible);
          console.log(`Template ${templateId} insufficient_materials:`, stats.feasibility?.insufficient_materials);

          // Xử lý cost_estimate có thể là string hoặc number
          const costEstimate = stats.cost_estimate !== null && stats.cost_estimate !== undefined 
            ? Number(stats.cost_estimate) 
            : 0;

          // Lấy thông tin materials từ stats.by_category
          const materials: Array<{id: number; material_name: string; quantity: number; unit: string}> = [];
          if (stats.by_category) {
            Object.values(stats.by_category).forEach((categoryData: any) => {
              if (categoryData.materials) {
                materials.push(...categoryData.materials);
              }
            });
          }

          const summary: TemplateMaterialSummary = {
            template_id: templateId,
            template_name: `Template #${templateId}`,
            total_materials: stats.total_materials,
            total_estimated_cost: costEstimate,
            is_feasible: stats.feasibility?.feasible || false,
            missing_materials_count: stats.feasibility?.insufficient_materials?.length || 0,
            insufficient_materials_count: stats.feasibility?.insufficient_materials?.length || 0,
            materials: materials,
            insufficient_materials: stats.feasibility?.insufficient_materials || []
          };

          console.log(`Template ${templateId} summary:`, summary);

          summaries.push(summary);
          totalMaterials += stats.total_materials;
          totalEstimatedCost += costEstimate;
          if (stats.feasibility?.feasible) feasibleTemplates++;
          totalMissingMaterials += stats.feasibility?.insufficient_materials?.length || 0;
          totalInsufficientMaterials += stats.feasibility?.insufficient_materials?.length || 0;
        } catch (error) {
          console.error(`Error fetching data for template ${templateId}:`, error);
        }
      }

      console.log('Final totalEstimatedCost:', totalEstimatedCost);
      console.log('Final summaries:', summaries);

      setSummary(summaries);
      setOverallStats({
        totalTemplates: templateIds.length,
        templatesWithMaterials: summaries.filter(s => s.total_materials > 0).length,
        totalMaterials,
        totalEstimatedCost,
        feasibleTemplates,
        totalMissingMaterials,
        totalInsufficientMaterials
      });
    } catch (error) {
      console.error('Error fetching materials summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: (
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-blue-600" />
          <span>Template</span>
        </div>
      ),
      dataIndex: 'template_name',
      key: 'template_name',
      render: (name: string, record: TemplateMaterialSummary) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <FileTextOutlined className="text-white text-sm" />
          </div>
          <div>
            <Link to={`/activity-templates/${record.template_id}`} style={{ textDecoration: 'none' }}>
              <Text strong className="text-blue-600 hover:text-blue-800 transition-colors">{name}</Text>
            </Link>
            <div className="text-xs text-gray-500 mt-1">
              ID: {record.template_id}
            </div>
          </div>
        </div>
      )
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <InboxOutlined className="text-green-600" />
          <span>Vật tư</span>
        </div>
      ),
      dataIndex: 'total_materials',
      key: 'total_materials',
      render: (count: number, record: TemplateMaterialSummary) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <InboxOutlined className="text-white text-sm" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Text strong className="text-lg text-gray-800">{count}</Text>
              <Text className="text-sm text-gray-500">vật tư</Text>
            </div>
            {record.materials && record.materials.length > 0 && (
              <div className="space-y-1">
                {record.materials.slice(0, 2).map((material, index) => (
                  <div key={index} className="flex items-center gap-1 text-xs">
                    <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                    <Tooltip title={`Xem chi tiết ${material.material_name} trong kho`}>
                      <Link 
                        to={`/farmer/inventory/${material.id}`} 
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        target="_blank"
                      >
                        {material.material_name}
                      </Link>
                    </Tooltip>
                    <Text className="text-gray-500">({material.quantity} {material.unit})</Text>
                  </div>
                ))}
                {record.materials.length > 2 && (
                  <div className="text-xs text-gray-400">
                    +{record.materials.length - 2} vật tư khác
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <DollarOutlined className="text-orange-600" />
          <span>Chi phí ước tính</span>
        </div>
      ),
      dataIndex: 'total_estimated_cost',
      key: 'total_estimated_cost',
      render: (cost: number) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
            <DollarOutlined className="text-white text-sm" />
          </div>
          <Text strong className="text-lg text-gray-800">
            {formatCurrency(cost || 0)}
          </Text>
        </div>
      )
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <SafetyOutlined className="text-purple-600" />
          <span>Tính khả thi</span>
        </div>
      ),
      key: 'feasibility',
      render: (_: any, record: TemplateMaterialSummary & { activity_type?: number }) => {
        if (record.total_materials === 0) {
          if (record.activity_type === undefined || !MATERIAL_REQUIRED_ACTIVITIES.includes(record.activity_type)) {
            return (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                  <CheckCircleOutlined className="text-white text-sm" />
                </div>
                <Tag 
                  style={{ 
                    border: '2px solid #52c41a',
                    color: '#52c41a',
                    backgroundColor: 'transparent',
                    borderRadius: '8px',
                    fontWeight: 500
                  }}
                >
                  Không yêu cầu vật tư
                </Tag>
              </div>
            );
          }
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <ExclamationCircleOutlined className="text-white text-sm" />
              </div>
              <Tag 
                style={{ 
                  border: '2px solid #ff4d4f',
                  color: '#ff4d4f',
                  backgroundColor: 'transparent',
                  borderRadius: '8px',
                  fontWeight: 500
                }}
              >
                Thiếu vật tư
              </Tag>
            </div>
          );
        }
        return record.is_feasible ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <CheckCircleOutlined className="text-white text-sm" />
            </div>
            <Tag 
              style={{ 
                border: '2px solid #52c41a',
                color: '#52c41a',
                backgroundColor: 'transparent',
                borderRadius: '8px',
                fontWeight: 500
              }}
            >
              Khả thi
            </Tag>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <ExclamationCircleOutlined className="text-white text-sm" />
            </div>
            <Tag 
              style={{ 
                border: '2px solid #ff4d4f',
                color: '#ff4d4f',
                backgroundColor: 'transparent',
                borderRadius: '8px',
                fontWeight: 500
              }}
            >
              Không khả thi
            </Tag>
          </div>
        );
      }
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <WarningOutlined className="text-red-600" />
          <span>Vật tư thiếu</span>
        </div>
      ),
      key: 'missing_materials',
      render: (_: any, record: TemplateMaterialSummary & { activity_type?: number }) => {
        if (record.total_materials === 0 && (record.activity_type === undefined || !MATERIAL_REQUIRED_ACTIVITIES.includes(record.activity_type))) {
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                <CheckCircleOutlined className="text-white text-sm" />
              </div>
              <Text className="text-gray-500">Không áp dụng</Text>
            </div>
          );
        }
        if (record.insufficient_materials_count === 0) {
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircleOutlined className="text-white text-sm" />
              </div>
              <Tag 
                style={{ 
                  border: '2px solid #52c41a',
                  color: '#52c41a',
                  backgroundColor: 'transparent',
                  borderRadius: '8px',
                  fontWeight: 500
                }}
              >
                Đầy đủ
              </Tag>
            </div>
          );
        }
        
        // Hiển thị danh sách vật tư thiếu với thông tin chi tiết
        return (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <WarningOutlined className="text-white text-sm" />
            </div>
            <div>
              <Tag 
                style={{ 
                  border: '2px solid #ff4d4f',
                  color: '#ff4d4f',
                  backgroundColor: 'transparent',
                  borderRadius: '8px',
                  fontWeight: 500,
                  marginBottom: '8px'
                }}
              >
                {record.insufficient_materials_count} vật tư không đủ
              </Tag>
              {record.insufficient_materials && record.insufficient_materials.length > 0 && (
                <div className="space-y-1">
                  {record.insufficient_materials.slice(0, 3).map((material, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs">
                      <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                      <Tooltip title={`Cần: ${material.required} ${material.unit}, Có: ${material.available} ${material.unit}`}>
                        <span className="text-red-600 font-medium">
                          {material.material_name}
                        </span>
                      </Tooltip>
                      <Text className="text-gray-500">
                        ({material.required} &gt; {material.available} {material.unit})
                      </Text>
                    </div>
                  ))}
                  {record.insufficient_materials.length > 3 && (
                    <div className="text-xs text-gray-400">
                      +{record.insufficient_materials.length - 3} vật tư khác
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-lift" style={{
          background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
          border: 'none',
          borderRadius: '12px'
        }}>
          <div className="flex items-center justify-between text-white">
            <div>
              <Text className="text-blue-100 text-sm font-medium">Tổng số mẫu</Text>
              <div className="text-2xl font-bold">{overallStats.totalTemplates}</div>
              <Text className="text-blue-100 text-xs">
                Có vật tư: {overallStats.templatesWithMaterials}
              </Text>
            </div>
            <FileTextOutlined className="text-3xl text-blue-200 floating-icon" />
          </div>
        </Card>

        <Card className="hover-lift" style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          border: 'none',
          borderRadius: '12px'
        }}>
          <div className="flex items-center justify-between text-white">
            <div>
              <Text className="text-green-100 text-sm font-medium">Tổng số vật tư</Text>
              <div className="text-2xl font-bold">{overallStats.totalMaterials}</div>
            </div>
            <InboxOutlined className="text-3xl text-green-200 floating-icon" />
          </div>
        </Card>

        <Card className="hover-lift" style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none',
          borderRadius: '12px'
        }}>
          <div className="flex items-center justify-between text-white">
            <div>
              <Text className="text-orange-100 text-sm font-medium">Tổng chi phí</Text>
              <div className="text-2xl font-bold">{formatCurrency(overallStats.totalEstimatedCost || 0)}</div>
            </div>
            <DollarOutlined className="text-3xl text-orange-200 floating-icon" />
          </div>
        </Card>

        <Card className="hover-lift" style={{
          background: overallStats.feasibleTemplates === overallStats.templatesWithMaterials 
            ? 'linear-gradient(135deg, #10b981, #059669)'
            : 'linear-gradient(135deg, #f59e0b, #d97706)',
          border: 'none',
          borderRadius: '12px'
        }}>
          <div className="flex items-center justify-between text-white">
            <div>
              <Text className="text-white text-sm font-medium">Số mẫu khả thi</Text>
              <div className="text-2xl font-bold">{overallStats.feasibleTemplates}</div>
              <Text className="text-white text-xs">
                / {overallStats.templatesWithMaterials} mẫu có vật tư
              </Text>
            </div>
            <SafetyOutlined className="text-3xl text-white floating-icon" />
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {overallStats.totalMissingMaterials > 0 && (
        <Alert
          message={
            <div className="flex items-center gap-2">
              <WarningOutlined className="text-orange-500" />
              <span className="font-semibold">Có vật tư thiếu</span>
            </div>
          }
          description={
            <div className="mt-3">
              <Text className="text-gray-700">
                {overallStats.totalMissingMaterials} vật tư thiếu hoàn toàn và {overallStats.totalInsufficientMaterials} vật tư không đủ số lượng trong {overallStats.templatesWithMaterials - overallStats.feasibleTemplates} templates.
              </Text>
            </div>
          }
          type="warning"
          showIcon={false}
          style={{ 
            marginBottom: 16,
            borderRadius: '12px',
            border: '2px solid #f59e0b'
          }}
          className="hover-lift"
        />
      )}

      {/* Toolbar */}
      <Card className="hover-lift" style={{
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <BarChartOutlined className="text-purple-600 text-xl" />
            <Title level={4} className="mb-0 text-gray-800">Chi tiết vật tư theo template</Title>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchMaterialsSummary();
              onRefresh?.();
            }}
            loading={loading}
            style={{
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              transition: 'all 0.3s ease'
            }}
            className="hover:border-green-300 hover:text-green-600 hover:scale-105"
          >
            Làm mới
          </Button>
        </div>
      </Card>

      {/* Summary Table */}
      <Card className="hover-lift" style={{
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
        <Table
          columns={columns}
          dataSource={summary}
          rowKey="template_id"
          loading={loading}
          pagination={false}
          rowClassName={(record) => 'hover:bg-gray-50 transition-all duration-200'}
          locale={{
            emptyText: (
              <div className="py-12 text-center text-gray-400">
                <BarChartOutlined className="text-6xl mb-4" />
                <div className="text-lg font-medium">Không có dữ liệu vật tư</div>
                <div className="mt-2">Chưa có thông tin vật tư cho các template</div>
              </div>
            )
          }}
        />
      </Card>
    </div>
  );
} 