import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Progress, Typography, Alert,
  Table, Tag, Tooltip, Button, Space, Empty
} from 'antd';
import {
  ShoppingCartOutlined, DollarOutlined, ExclamationCircleOutlined,
  CheckCircleOutlined, WarningOutlined, ReloadOutlined
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import templateMaterialService, {
  TemplateMaterialStats
} from '@/services/farming/templateMaterialService';
import { formatCurrency } from '@/utils/formatters';

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
          // Chỉ gọi 1 API duy nhất để lấy tất cả thông tin
          const response = await templateMaterialService.getTemplateMaterialStats(templateId);
          const stats = response.stats;

          // Debug log để kiểm tra giá trị
          console.log(`Template ${templateId} stats:`, stats);
          console.log(`Template ${templateId} cost_estimate:`, stats.cost_estimate, typeof stats.cost_estimate);
          console.log(`Template ${templateId} feasibility:`, stats.feasibility);
          console.log(`Template ${templateId} feasible:`, stats.feasibility?.feasible);
          console.log(`Template ${templateId} insufficient_materials:`, stats.feasibility?.insufficient_materials);

          // Xử lý cost_estimate có thể là null/undefined
          const costEstimate = stats.cost_estimate !== null && stats.cost_estimate !== undefined 
            ? Number(stats.cost_estimate) 
            : 0;

          // Lấy thông tin materials từ stats.by_category nếu có
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
            materials: materials
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
      title: 'Template',
      dataIndex: 'template_name',
      key: 'template_name',
      render: (name: string, record: TemplateMaterialSummary) => (
        <div>
          <Link to={`/activity-templates/${record.template_id}`} style={{ textDecoration: 'none' }}>
            <Text strong style={{ color: '#1890ff' }}>{name}</Text>
          </Link>
          <div style={{ fontSize: '12px', color: '#666' }}>
            ID: {record.template_id}
          </div>
        </div>
      )
    },
    {
      title: 'Vật tư',
      dataIndex: 'total_materials',
      key: 'total_materials',
      render: (count: number, record: TemplateMaterialSummary) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
            <ShoppingCartOutlined style={{ color: '#1890ff' }} />
            <span>{count}</span>
          </div>
          {record.materials && record.materials.length > 0 && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.materials.slice(0, 2).map((material, index) => (
                <div key={index}>
                  • <Tooltip title={`Xem chi tiết ${material.material_name} trong kho`}>
                      <Link 
                        to={`/farmer/inventory/${material.id}`} 
                        style={{ color: '#1890ff', textDecoration: 'none' }}
                        target="_blank"
                      >
                        {material.material_name}
                      </Link>
                    </Tooltip> ({material.quantity} {material.unit})
                </div>
              ))}
              {record.materials.length > 2 && (
                <div style={{ color: '#999' }}>
                  +{record.materials.length - 2} vật tư khác
                </div>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Chi phí ước tính',
      dataIndex: 'total_estimated_cost',
      key: 'total_estimated_cost',
      render: (cost: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span>{formatCurrency(cost || 0)}</span>
        </div>
      )
    },
    {
      title: 'Tính khả thi',
      key: 'feasibility',
      render: (_: any, record: TemplateMaterialSummary & { activity_type?: number }) => {
        if (record.total_materials === 0) {
          if (record.activity_type === undefined || !MATERIAL_REQUIRED_ACTIVITIES.includes(record.activity_type)) {
            return <Tag color="success">Không yêu cầu vật tư</Tag>;
          }
          return <Tag color="error" icon={<ExclamationCircleOutlined />}>Thiếu vật tư</Tag>;
        }
        return record.is_feasible ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Khả thi</Tag>
        ) : (
          <Tag color="error" icon={<ExclamationCircleOutlined />}>Không khả thi</Tag>
        );
      }
    },
    {
      title: 'Vật tư thiếu',
      key: 'missing_materials',
      render: (_: any, record: TemplateMaterialSummary & { activity_type?: number }) => {
        if (record.total_materials === 0 && (record.activity_type === undefined || !MATERIAL_REQUIRED_ACTIVITIES.includes(record.activity_type))) {
          return <span style={{ color: '#888' }}>Không áp dụng</span>;
        }
        if (record.insufficient_materials_count === 0) {
          return <Tag color="success">Đầy đủ</Tag>;
        }
        
        // Hiển thị danh sách vật tư thiếu với link
        return (
          <div>
            <Tag color="error">{record.insufficient_materials_count} vật tư không đủ</Tag>
            {record.materials && record.materials.length > 0 && (
              <div style={{ marginTop: '4px', fontSize: '12px' }}>
                {record.materials.slice(0, 3).map((material, index) => (
                  <div key={index} style={{ marginBottom: '2px' }}>
                    <Tooltip title={`Xem chi tiết ${material.material_name} trong kho`}>
                      <Link 
                        to={`/farmer/inventory/${material.id}`} 
                        style={{ color: '#ff4d4f', textDecoration: 'none' }}
                        target="_blank"
                      >
                        • {material.material_name}
                      </Link>
                    </Tooltip>
                  </div>
                ))}
                {record.materials.length > 3 && (
                  <div style={{ color: '#999', fontSize: '11px' }}>
                    +{record.materials.length - 3} vật tư khác
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div>
      {/* Overall Statistics */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Tổng số mẫu hoạt động"
              value={overallStats.totalTemplates}
              suffix={<span style={{ color: '#888', fontSize: 13 }}>(Có vật tư: {overallStats.templatesWithMaterials})</span>}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Tổng số vật tư"
              value={overallStats.totalMaterials}
              prefix={<ShoppingCartOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Tổng chi phí ước tính"
              value={overallStats.totalEstimatedCost || 0}
              formatter={(value) => formatCurrency(Number(value || 0))}
              prefix={<DollarOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Số mẫu khả thi"
              value={overallStats.feasibleTemplates}
              suffix={<span style={{ color: '#888', fontSize: 13 }}>/ {overallStats.templatesWithMaterials} mẫu có vật tư</span>}
              valueStyle={{ color: overallStats.feasibleTemplates === overallStats.templatesWithMaterials ? '#52c41a' : '#faad14' }}
            />
          </Col>
        </Row>
      </Card>

      {/* Alerts */}
      {overallStats.totalMissingMaterials > 0 && (
        <Alert
          message="Có vật tư thiếu"
          description={`${overallStats.totalMissingMaterials} vật tư thiếu hoàn toàn và ${overallStats.totalInsufficientMaterials} vật tư không đủ số lượng trong ${overallStats.templatesWithMaterials - overallStats.feasibleTemplates} templates.`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Toolbar */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>Chi tiết vật tư theo template</Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            fetchMaterialsSummary();
            onRefresh?.();
          }}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>

      {/* Summary Table */}
      <Table
        columns={columns}
        dataSource={summary}
        rowKey="template_id"
        loading={loading}
        pagination={false}
        locale={{
          emptyText: "Không có dữ liệu vật tư"
        }}
      />
    </div>
  );
} 