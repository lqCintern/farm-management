import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Modal, message, Input, InputNumber, Select,
  Card, Typography, Tag, Tooltip, Popconfirm, Badge, Alert, Divider,
  Row, Col, Statistic, Progress, Empty, Form
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, InfoCircleOutlined, ReloadOutlined,
  ShoppingCartOutlined, CalculatorOutlined, WarningOutlined
} from '@ant-design/icons';
import templateMaterialService, {
  TemplateActivityMaterial,
  FarmMaterial,
  TemplateMaterialStats
} from '@/services/farming/templateMaterialService';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface TemplateMaterialsManagerProps {
  templateId: number;
  templateName?: string;
  readOnly?: boolean;
}

export default function TemplateMaterialsManager({
  templateId,
  templateName = 'Template',
  readOnly = false
}: TemplateMaterialsManagerProps) {
  // State
  const [materials, setMaterials] = useState<TemplateActivityMaterial[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<FarmMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TemplateMaterialStats | null>(null);
  const [feasibility, setFeasibility] = useState<any>(null);
  
  // Modal states
  const [materialModalVisible, setMaterialModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<TemplateActivityMaterial | null>(null);
  const [materialForm] = Form.useForm();
  const [availableMaterialsLoading, setAvailableMaterialsLoading] = useState(false);
  
  // Selection states
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleteModalVisible, setBatchDeleteModalVisible] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchMaterials();
    fetchStats();
    fetchFeasibility();
  }, [templateId]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await templateMaterialService.getTemplateMaterials(templateId);
      setMaterials(response.data || []);
    } catch (error) {
      message.error('Không thể tải danh sách vật tư');
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await templateMaterialService.getTemplateMaterialStats(templateId);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchFeasibility = async () => {
    try {
      const response = await templateMaterialService.checkTemplateFeasibility(templateId);
      setFeasibility(response.feasibility);
    } catch (error) {
      console.error('Error fetching feasibility:', error);
    }
  };

  const fetchAvailableMaterials = async () => {
    try {
      setAvailableMaterialsLoading(true);
      const response = await templateMaterialService.getAvailableMaterials();
      setAvailableMaterials(response.materials || []);
    } catch (error) {
      message.error('Không thể tải danh sách vật tư có sẵn');
      console.error('Error fetching available materials:', error);
    } finally {
      setAvailableMaterialsLoading(false);
    }
  };

  // Material operations
  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setMaterialModalVisible(true);
    fetchAvailableMaterials();
  };

  const handleEditMaterial = (material: TemplateActivityMaterial) => {
    setEditingMaterial(material);
    setMaterialModalVisible(true);
    fetchAvailableMaterials();
  };

  const handleDeleteMaterial = async (materialId: number) => {
    try {
      await templateMaterialService.removeMaterialFromTemplate(templateId, materialId);
      message.success('Đã xóa vật tư khỏi mẫu');
      fetchMaterials();
      fetchStats();
      fetchFeasibility();
    } catch (error) {
      message.error('Không thể xóa vật tư');
      console.error('Error deleting material:', error);
    }
  };

  const handleBatchDelete = async () => {
    try {
      await templateMaterialService.removeMaterialsFromTemplate(templateId, selectedRowKeys as number[]);
      message.success(`Đã xóa ${selectedRowKeys.length} vật tư khỏi mẫu`);
      setSelectedRowKeys([]);
      setBatchDeleteModalVisible(false);
      fetchMaterials();
      fetchStats();
      fetchFeasibility();
    } catch (error) {
      message.error('Không thể xóa vật tư');
      console.error('Error batch deleting materials:', error);
    }
  };

  const handleMaterialSubmit = async () => {
    try {
      const values = await materialForm.validateFields();
      
      if (editingMaterial?.id) {
        await templateMaterialService.updateTemplateMaterial(templateId, editingMaterial.id, values);
        message.success('Đã cập nhật vật tư');
      } else {
        await templateMaterialService.addMaterialToTemplate(templateId, values);
        message.success('Đã thêm vật tư vào mẫu');
      }
      
      setMaterialModalVisible(false);
      materialForm.resetFields();
      fetchMaterials();
      fetchStats();
      fetchFeasibility();
    } catch (error) {
      if ((error as any)?.errorFields) {
        return; // Validation error
      }
      message.error('Không thể lưu vật tư');
      console.error('Error saving material:', error);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Vật tư',
      dataIndex: 'material_name',
      key: 'material_name',
      render: (text: string, record: TemplateActivityMaterial) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.category}
          </Text>
        </div>
      )
    },
    {
      title: 'Số lượng yêu cầu',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: TemplateActivityMaterial) => (
        <div>
          <Text strong>{quantity}</Text>
          <Text type="secondary" style={{ marginLeft: '4px' }}>
            {record.unit}
          </Text>
        </div>
      )
    },
    {
      title: 'Đơn giá',
      dataIndex: 'unit_cost',
      key: 'unit_cost',
      render: (cost: number) => cost ? `${cost.toLocaleString()} VNĐ` : '-'
    },
    {
      title: 'Tổng chi phí',
      dataIndex: 'total_cost',
      key: 'total_cost',
      render: (cost: number) => cost ? `${cost.toLocaleString()} VNĐ` : '-'
    },
    {
      title: 'Ghi chú',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string) => notes || '-'
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: TemplateActivityMaterial) => (
        <Space>
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditMaterial(record)}
              disabled={readOnly}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title="Xác nhận xóa vật tư này?"
              onConfirm={() => handleDeleteMaterial(record.id!)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={readOnly}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  // Row selection
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    }
  };

  return (
    <div>
      {/* Header với thống kê */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Tổng vật tư"
              value={stats?.total_materials || 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Tổng số lượng"
              value={stats?.total_quantity || 0}
              suffix="đơn vị"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Chi phí ước tính"
              value={stats?.cost_estimate || 0}
              suffix="VNĐ"
              formatter={(value) => (value || 0).toLocaleString()}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Tính khả thi"
              value={feasibility?.is_feasible ? 'Khả thi' : 'Không khả thi'}
              valueStyle={{ color: feasibility?.is_feasible ? '#52c41a' : '#ff4d4f' }}
              prefix={feasibility?.is_feasible ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* Alert cho feasibility */}
      {feasibility && !feasibility.is_feasible && (
        <Alert
          message="Mẫu không khả thi"
          description={
            <div>
              <Text>Mẫu này cần các vật tư sau:</Text>
              <ul style={{ marginTop: 8, marginBottom: 0 }}>
                {feasibility.missing_materials?.map((item: any, index: number) => (
                  <li key={index}>
                    <Text strong>{item.material_name}</Text>: Thiếu {item.shortage} {item.unit}
                  </li>
                ))}
                {feasibility.insufficient_materials?.map((item: any, index: number) => (
                  <li key={index}>
                    <Text strong>{item.material_name}</Text>: Thiếu {item.shortage} {item.unit}
                  </li>
                ))}
              </ul>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Toolbar */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddMaterial}
            disabled={readOnly}
          >
            Thêm vật tư
          </Button>
          {selectedRowKeys.length > 0 && (
            <>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => setBatchDeleteModalVisible(true)}
                style={{ marginLeft: 8 }}
                disabled={readOnly}
              >
                Xóa ({selectedRowKeys.length})
              </Button>
            </>
          )}
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => {
            fetchMaterials();
            fetchStats();
            fetchFeasibility();
          }}
        >
          Làm mới
        </Button>
      </div>

      {/* Materials table */}
      <Table
        columns={columns}
        dataSource={materials}
        rowKey="id"
        loading={loading}
        rowSelection={readOnly ? undefined : rowSelection}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} vật tư`
        }}
        locale={{
          emptyText: (
            <Empty
              description="Chưa có vật tư nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )
        }}
      />

      {/* Add/Edit Material Modal */}
      <Modal
        title={editingMaterial ? 'Sửa vật tư' : 'Thêm vật tư mới'}
        open={materialModalVisible}
        onCancel={() => {
          setMaterialModalVisible(false);
          materialForm.resetFields();
        }}
        onOk={handleMaterialSubmit}
        width={600}
        okText={editingMaterial ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
      >
        <Form
          form={materialForm}
          layout="vertical"
          initialValues={editingMaterial || {}}
        >
          <Form.Item
            name="material_id"
            label="Chọn vật tư"
            rules={[{ required: true, message: 'Vui lòng chọn vật tư' }]}
          >
            <Select
              placeholder="Chọn vật tư từ kho"
              loading={availableMaterialsLoading}
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {availableMaterials.map(material => (
                <Option key={material.id} value={material.id}>
                  {material.name} ({material.category}) - Còn: {material.available_quantity} {material.unit}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Số lượng yêu cầu"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
          >
            <InputNumber
              min={0.01}
              step={0.01}
              style={{ width: '100%' }}
              placeholder="Nhập số lượng"
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Ghi chú"
          >
            <TextArea
              rows={3}
              placeholder="Ghi chú về vật tư này..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Batch Delete Confirmation Modal */}
      <Modal
        title="Xác nhận xóa"
        open={batchDeleteModalVisible}
        onOk={handleBatchDelete}
        onCancel={() => setBatchDeleteModalVisible(false)}
        okText="Xóa"
        cancelText="Hủy"
        okType="danger"
      >
        <p>Bạn có chắc muốn xóa {selectedRowKeys.length} vật tư đã chọn không?</p>
      </Modal>
    </div>
  );
} 