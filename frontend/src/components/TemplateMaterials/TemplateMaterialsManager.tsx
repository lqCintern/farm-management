import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Modal, message, Input, InputNumber, Select,
  Card, Typography, Tag, Tooltip, Popconfirm, Badge, Alert, Divider,
  Row, Col, Statistic, Progress, Empty, Form
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, InfoCircleOutlined, ReloadOutlined,
  ShoppingCartOutlined, CalculatorOutlined, WarningOutlined,
  InboxOutlined, DollarOutlined, SafetyOutlined, ClockCircleOutlined,
  FileTextOutlined, SearchOutlined, FilterOutlined, BarChartOutlined
} from '@ant-design/icons';
import templateMaterialService, {
  TemplateActivityMaterial,
  FarmMaterial,
  TemplateMaterialStats
} from '@/services/farming/templateMaterialService';
import './template-materials.css';

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
      title: (
        <div className="flex items-center gap-2">
          <InboxOutlined className="text-blue-600" />
          <span>Vật tư</span>
        </div>
      ),
      dataIndex: 'material_name',
      key: 'material_name',
      render: (text: string, record: TemplateActivityMaterial) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <InboxOutlined className="text-white text-sm" />
          </div>
          <div>
            <div className="font-semibold text-gray-800">{text}</div>
            <Tag 
              style={{ 
                border: '2px solid #3b82f6',
                color: '#3b82f6',
                backgroundColor: 'transparent',
                borderRadius: '6px',
                fontSize: '11px',
                marginTop: '2px'
              }}
            >
              {record.category}
            </Tag>
          </div>
        </div>
      )
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <CalculatorOutlined className="text-green-600" />
          <span>Số lượng yêu cầu</span>
        </div>
      ),
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity: number, record: TemplateActivityMaterial) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
            <CalculatorOutlined className="text-white text-sm" />
          </div>
          <div>
            <Text strong className="text-lg text-gray-800">{quantity}</Text>
            <Text type="secondary" className="ml-2 text-sm">
              {record.unit}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <DollarOutlined className="text-orange-600" />
          <span>Đơn giá</span>
        </div>
      ),
      dataIndex: 'unit_cost',
      key: 'unit_cost',
      render: (cost: number) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
            <DollarOutlined className="text-white text-sm" />
          </div>
          <Text strong className="text-gray-800">
            {cost ? `${cost.toLocaleString()} VNĐ` : '-'}
          </Text>
        </div>
      )
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <BarChartOutlined className="text-purple-600" />
          <span>Tổng chi phí</span>
        </div>
      ),
      dataIndex: 'total_cost',
      key: 'total_cost',
      render: (cost: number) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
            <BarChartOutlined className="text-white text-sm" />
          </div>
          <Text strong className="text-gray-800">
            {cost ? `${cost.toLocaleString()} VNĐ` : '-'}
          </Text>
        </div>
      )
    },
    {
      title: (
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-gray-600" />
          <span>Ghi chú</span>
        </div>
      ),
      dataIndex: 'notes',
      key: 'notes',
      render: (notes: string) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
            <FileTextOutlined className="text-white text-sm" />
          </div>
          <Text className="text-gray-600 max-w-xs truncate">
            {notes || '-'}
          </Text>
        </div>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_: any, record: TemplateActivityMaterial) => (
        <Space size="small">
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditMaterial(record)}
              disabled={readOnly}
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
            <Popconfirm
              title={
                <div className="flex items-center gap-2">
                  <ExclamationCircleOutlined className="text-orange-500" />
                  <span>Xác nhận xóa vật tư này?</span>
                </div>
              }
              onConfirm={() => handleDeleteMaterial(record.id!)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{
                style: {
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600
                }
              }}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={readOnly}
                style={{ 
                  color: '#ff4d4f',
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                  border: '1px solid #e5e7eb'
                }}
                className="action-btn hover:bg-red-50 hover:border-red-300 hover:scale-110 hover:shadow-md"
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
    <div className="space-y-6">
      {/* Alert cho feasibility */}
      {feasibility && !feasibility.is_feasible && (
        <Alert
          message={
            <div className="flex items-center gap-2">
              <WarningOutlined className="text-orange-500" />
              <span className="font-semibold">Mẫu không khả thi</span>
            </div>
          }
          description={
            <div className="mt-3">
              <Text className="text-gray-700">Mẫu này cần các vật tư sau:</Text>
              <div className="mt-3 space-y-2">
                {feasibility.missing_materials?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 bg-red-50 p-2 rounded-lg border border-red-200">
                    <InboxOutlined className="text-red-500" />
                    <Text strong className="text-red-700">{item.material_name}</Text>
                    <Text className="text-red-600">: Thiếu {item.shortage} {item.unit}</Text>
                  </div>
                ))}
                {feasibility.insufficient_materials?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 bg-orange-50 p-2 rounded-lg border border-orange-200">
                    <InboxOutlined className="text-orange-500" />
                    <Text strong className="text-orange-700">{item.material_name}</Text>
                    <Text className="text-orange-600">: Thiếu {item.shortage} {item.unit}</Text>
                  </div>
                ))}
              </div>
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
          <div className="flex flex-wrap gap-3">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddMaterial}
              disabled={readOnly}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                padding: '8px 16px'
              }}
              className="btn-primary hover:shadow-lg hover:scale-105"
            >
              Thêm vật tư
            </Button>
            {selectedRowKeys.length > 0 && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => setBatchDeleteModalVisible(true)}
                disabled={readOnly}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  padding: '8px 16px'
                }}
                className="hover:shadow-lg hover:scale-105"
              >
                Xóa ({selectedRowKeys.length})
              </Button>
            )}
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              fetchMaterials();
              fetchStats();
              fetchFeasibility();
            }}
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

      {/* Materials table */}
      <Card className="hover-lift" style={{
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
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
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} vật tư`,
            style: {
              padding: '16px',
              backgroundColor: 'white'
            }
          }}
          rowClassName={(record) => 'hover:bg-gray-50 transition-all duration-200'}
          locale={{
            emptyText: (
              <div className="py-12 text-center text-gray-400">
                <ShoppingCartOutlined className="text-6xl mb-4" />
                <div className="text-lg font-medium">Chưa có vật tư nào</div>
                <div className="mt-2">Bắt đầu thêm vật tư cần thiết cho mẫu hoạt động</div>
              </div>
            )
          }}
        />
      </Card>

      {/* Add/Edit Material Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            {editingMaterial ? (
              <>
                <EditOutlined className="text-blue-600 text-xl" />
                <div>
                  <Title level={4} className="mb-0 text-gray-800">Sửa vật tư</Title>
                  <Text className="text-gray-500 text-sm">Cập nhật thông tin vật tư</Text>
                </div>
              </>
            ) : (
              <>
                <PlusOutlined className="text-green-600 text-xl" />
                <div>
                  <Title level={4} className="mb-0 text-gray-800">Thêm vật tư mới</Title>
                  <Text className="text-gray-500 text-sm">Thêm vật tư cần thiết cho mẫu hoạt động</Text>
                </div>
              </>
            )}
          </div>
        }
        open={materialModalVisible}
        onCancel={() => {
          setMaterialModalVisible(false);
          materialForm.resetFields();
        }}
        onOk={handleMaterialSubmit}
        width={700}
        okText={editingMaterial ? 'Cập nhật' : 'Thêm'}
        cancelText="Hủy"
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            padding: '8px 24px'
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
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl">
          <Form
            form={materialForm}
            layout="vertical"
            initialValues={editingMaterial || {}}
            className="form-section"
          >
            <Card className="mb-6 hover-lift" style={{
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div className="flex items-center gap-2 mb-4">
                <InboxOutlined className="text-blue-600 text-lg" />
                <Title level={5} className="mb-0 text-gray-800">Chọn vật tư</Title>
              </div>
              
              <Form.Item
                name="material_id"
                label={
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Vật tư</span>
                    <Badge color="red" />
                  </div>
                }
                rules={[{ required: true, message: 'Vui lòng chọn vật tư' }]}
              >
                <Select
                  placeholder="Chọn vật tư từ kho"
                  loading={availableMaterialsLoading}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  style={{
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb'
                  }}
                  className="hover:border-green-300 focus:border-green-500"
                >
                  {availableMaterials.map(material => (
                    <Option key={material.id} value={material.id}>
                      <div className="flex items-center justify-between">
                        <span>{material.name} ({material.category})</span>
                        <Tag 
                          style={{ 
                            border: '2px solid #10b981',
                            color: '#10b981',
                            backgroundColor: 'transparent',
                            borderRadius: '6px',
                            fontSize: '11px'
                          }}
                        >
                          Còn: {material.available_quantity} {material.unit}
                        </Tag>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>

            <Card className="mb-6 hover-lift" style={{
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div className="flex items-center gap-2 mb-4">
                <CalculatorOutlined className="text-green-600 text-lg" />
                <Title level={5} className="mb-0 text-gray-800">Thông tin số lượng</Title>
              </div>
              
              <Form.Item
                name="quantity"
                label={
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Số lượng yêu cầu</span>
                    <Badge color="red" />
                  </div>
                }
                rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
              >
                <InputNumber
                  min={0.01}
                  step={0.01}
                  style={{ 
                    width: '100%',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb'
                  }}
                  placeholder="Nhập số lượng"
                  className="hover:border-green-300 focus:border-green-500"
                />
              </Form.Item>
            </Card>

            <Card className="hover-lift" style={{
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div className="flex items-center gap-2 mb-4">
                <FileTextOutlined className="text-gray-600 text-lg" />
                <Title level={5} className="mb-0 text-gray-800">Ghi chú bổ sung</Title>
              </div>
              
              <Form.Item
                name="notes"
                label={
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Ghi chú</span>
                    <InfoCircleOutlined className="text-gray-400" />
                  </div>
                }
              >
                <TextArea
                  rows={3}
                  placeholder="Ghi chú về vật tư này..."
                  style={{
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    transition: 'all 0.3s ease'
                  }}
                  className="hover:border-green-300 focus:border-green-500"
                />
              </Form.Item>
            </Card>
          </Form>
        </div>
      </Modal>

      {/* Batch Delete Confirmation Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ExclamationCircleOutlined className="text-orange-500" />
            <span>Xác nhận xóa</span>
          </div>
        }
        open={batchDeleteModalVisible}
        onOk={handleBatchDelete}
        onCancel={() => setBatchDeleteModalVisible(false)}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600
          }
        }}
        cancelButtonProps={{
          style: {
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            fontWeight: 500
          },
          className: "hover:border-red-300 hover:text-red-600 hover:scale-105"
        }}
      >
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 mb-3">
            <WarningOutlined />
            <Text strong>Xác nhận xóa vật tư</Text>
          </div>
          <Text className="text-red-600">
            Bạn có chắc muốn xóa {selectedRowKeys.length} vật tư đã chọn không? Hành động này không thể hoàn tác.
          </Text>
        </div>
      </Modal>
    </div>
  );
} 