import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, Card, Button, Select, Input, Space, Tag, 
  Tooltip, Dropdown, Menu, message, Badge, Typography,
  Modal, Row, Col, Statistic, Divider
} from 'antd';
import {
  PlusOutlined, FilterOutlined, ReloadOutlined, 
  EllipsisOutlined, EyeOutlined, EditOutlined,
  DeleteOutlined, CalendarOutlined, LineChartOutlined
} from '@ant-design/icons';
import { 
  getPineappleCrops, 
  deletePineappleCrop,
  advanceStage,
  getPineappleCropStatistics 
} from '@/services/farming/pineappleCropService';
import fieldService from '@/services/farming/fieldService';
import { PineappleStage } from '@/services/farming/pineappleActivityTemplateService';
import Field from '@/services/farming/fieldService';
import { formatDate } from '@/utils/dateUtils';

const { Option } = Select;
const { Search } = Input;
const { Title, Text } = Typography;

// Enum cho trạng thái vụ dứa
enum CropStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  ABANDONED = "abandoned",
  PLANNED = "planned"
}

// Enum cho mùa vụ
enum SeasonType {
  SPRING_SUMMER = "spring_summer",
  FALL_WINTER = "fall_winter"
}

// Function để lấy label của stage
const getStageLabel = (stage: number) => {
  const stageLabels = {
    [PineappleStage.PREPARATION]: "Chuẩn bị đất & mật độ trồng",
    [PineappleStage.SEEDLING_PREPARATION]: "Chuẩn bị giống & vật tư",
    [PineappleStage.PLANTING]: "Trồng dứa",
    [PineappleStage.LEAF_TYING]: "Buộc lá (tránh chính vụ)",
    [PineappleStage.FIRST_FERTILIZING]: "Bón phân thúc lần 1",
    [PineappleStage.SECOND_FERTILIZING]: "Bón phân thúc lần 2",
    [PineappleStage.FLOWER_TREATMENT]: "Xử lý ra hoa",
    [PineappleStage.SUN_PROTECTION]: "Buộc tránh nắng / Che lưới đen",
    [PineappleStage.FRUIT_DEVELOPMENT]: "Bón phân thúc quả lớn",
    [PineappleStage.HARVESTING]: "Thu hoạch",
    [PineappleStage.SPROUT_COLLECTION]: "Tách chồi giống",
    [PineappleStage.FIELD_CLEANING]: "Dọn vườn"
  };
  return stageLabels[stage as keyof typeof stageLabels] || `Giai đoạn ${stage}`;
};

// Màu sắc cho trạng thái
const getStatusColor = (status: string) => {
  switch(status) {
    case CropStatus.ACTIVE: return 'green';
    case CropStatus.COMPLETED: return 'blue';
    case CropStatus.ABANDONED: return 'red';
    case CropStatus.PLANNED: return 'orange';
    default: return 'default';
  }
};

// Màu sắc cho giai đoạn
const getStageColor = (stage: number) => {
  const colors = ['purple', 'cyan', 'geekblue', 'lime', 'gold', 'orange', 'volcano', 'magenta', 'blue', 'green', 'red', 'gray'];
  return colors[stage % colors.length];
};

// Format diện tích
const formatArea = (area: number) => {
  return `${area.toLocaleString()} m²`;
};

export default function PineappleCrops() {
  const navigate = useNavigate();
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Filters
  const [filters, setFilters] = useState<any>({});

  // Statistics
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    fetchCrops();
    fetchFields();
    fetchStatistics();
  }, [filters, pagination.current]);

  const fetchCrops = async () => {
    try {
      setLoading(true);
      const params: any = { 
        ...filters,
        page: pagination.current,
        per_page: pagination.pageSize
      };
      
      const response = await getPineappleCrops(params);
      setCrops(response.items || []); // Sửa từ response.data thành response.items
      setPagination({
        ...pagination,
        total: response.pagination?.total_items || 0
      });
    } catch (error) {
      message.error('Không thể tải danh sách vụ dứa');
      console.error('Error fetching crops:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async () => {
    try {
      const response = await fieldService.getFields();
      setFields(response.data || []);
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      setStatsLoading(true);
      const response = await getPineappleCropStatistics();
      setStats((response as { statistics: any }).statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    if (value === undefined || value === null || value === '') {
      const newFilters = { ...filters };
      delete newFilters[key];
      setFilters(newFilters);
    } else {
      setFilters({ ...filters, [key]: value });
    }
    setPagination({ ...pagination, current: 1 });
  };

  const resetFilters = () => {
    setFilters({});
    setPagination({ ...pagination, current: 1 });
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa vụ dứa',
      content: 'Bạn có chắc muốn xóa vụ dứa này? Tất cả hoạt động liên quan cũng sẽ bị xóa.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deletePineappleCrop(id);
          message.success('Đã xóa vụ dứa thành công');
          fetchCrops();
          fetchStatistics();
        } catch (error) {
          message.error('Không thể xóa vụ dứa');
        }
      }
    });
  };

  const handleAdvanceStage = async (id: number) => {
    try {
      await advanceStage(id);
      message.success('Đã chuyển sang giai đoạn tiếp theo');
      fetchCrops();
    } catch (error) {
      message.error('Không thể chuyển giai đoạn');
    }
  };

  const columns = [
    {
      title: 'Tên vụ dứa',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <a onClick={() => navigate(`/pineapple/${record.id}`)}>{text}</a>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <CalendarOutlined style={{ marginRight: 5 }} />
              {formatDate(record.planting_date)}
              {record.harvest_date && ` ~ ${formatDate(record.harvest_date)}`}
            </Text>
          </div>
        </div>
    ),
    },
    {
    title: 'Thửa ruộng',
    dataIndex: 'field_name',
    key: 'field_name',
    render: (_: any, record: { field_id: number }) => {
    const field = fields.find((f: { id: number; name: string }) => f.id === record.field_id);
      return field ? field.name : `ID: ${record.field_id}`;
    },
    },
    {
    title: 'Diện tích',
    dataIndex: 'field_area',
    key: 'field_area',
    render: (area?: number) => area ? formatArea(area) : '-',
    },
    {
    title: 'Vụ mùa',
    dataIndex: 'season_type',
    key: 'season_type',
    render: (season: SeasonType) => (
        <Tag color={season === SeasonType.SPRING_SUMMER ? 'green' : 'orange'}>
          {season === SeasonType.SPRING_SUMMER ? 'Xuân Hè' : 'Thu Đông'}
        </Tag>
      ),
    },
    {
      title: 'Giai đoạn',
      dataIndex: 'current_stage',
      key: 'current_stage',
      render: (stage: number) => (
        <Tag color={getStageColor(stage)}>
          {getStageLabel(stage)}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status === CropStatus.ACTIVE && 'Đang hoạt động'}
          {status === CropStatus.COMPLETED && 'Đã hoàn thành'}
          {status === CropStatus.ABANDONED && 'Đã hủy'}
          {status === CropStatus.PLANNED && 'Lên kế hoạch'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => navigate(`/pineapple/${record.id}`)}
              type="text"
              size="small"
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => navigate(`/pineapple/${record.id}/edit`)}
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
          <Dropdown 
            menu={{
              items: [
                {
                  key: 'activities',
                  icon: <CalendarOutlined />,
                  label: 'Quản lý hoạt động',
                  onClick: () => navigate(`/pineapple/${record.id}/activities`)
                },
                {
                  key: 'statistics',
                  icon: <LineChartOutlined />,
                  label: 'Thống kê',
                  onClick: () => navigate(`/pineapple/${record.id}/statistics`)
                },
                ...(record.status === CropStatus.ACTIVE ? [{
                  key: 'advance',
                  label: 'Chuyển giai đoạn tiếp theo',
                  onClick: () => handleAdvanceStage(record.id)
                }] : [])
              ]
            }} 
            placement="bottomRight"
          >
            <Button 
              icon={<EllipsisOutlined />} 
              type="text"
              size="small"
            />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Thống kê */}
      {stats && (
        <Card>
          <Title level={4}>Thống kê vụ trồng dứa</Title>
          <Divider />
          <Row gutter={16}>
            <Col span={6}>
              <Statistic 
                title="Tổng số vụ dứa" 
                value={stats.total_crops || 0} 
                loading={statsLoading}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Đang hoạt động" 
                value={stats.active_crops || 0} 
                loading={statsLoading}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Đã thu hoạch" 
                value={stats.harvested_crops || 0} 
                loading={statsLoading}
                valueStyle={{ color: '#0050b3' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Sắp thu hoạch" 
                value={stats.upcoming_harvests || 0} 
                loading={statsLoading}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Col>
          </Row>
        </Card>
      )}

      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4}>Danh sách vụ trồng dứa</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/pineapple/new')}
          >
            Thêm vụ mới
          </Button>
        </div>

        {/* Bộ lọc */}
        <div className="mb-4 p-4 border rounded bg-gray-50">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Text strong>Vụ mùa</Text>
              <Select 
                placeholder="Tất cả vụ mùa"
                style={{ width: 150 }}
                onChange={(value) => handleFilterChange('season_type', value)}
                value={filters.season_type}
                allowClear
              >
                <Option value={SeasonType.SPRING_SUMMER}>Xuân Hè</Option>
                <Option value={SeasonType.FALL_WINTER}>Thu Đông</Option>
              </Select>
            </div>

            <div>
              <Text strong>Thửa ruộng</Text>
              <Select 
                placeholder="Tất cả ruộng"
                style={{ width: 200 }}
                onChange={(value) => handleFilterChange('field_id', value)}
                value={filters.field_id}
                allowClear
                loading={fields.length === 0}
              >
                {fields.map(field => (
                  <Option key={field.id} value={field.id}>
                    {field.name}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <Text strong>Trạng thái</Text>
              <Select 
                placeholder="Tất cả trạng thái"
                style={{ width: 150 }}
                onChange={(value) => handleFilterChange('status', value)}
                value={filters.status}
                allowClear
              >
                <Option value={CropStatus.ACTIVE}>Đang hoạt động</Option>
                <Option value={CropStatus.COMPLETED}>Đã hoàn thành</Option>
                <Option value={CropStatus.ABANDONED}>Đã hủy</Option>
                <Option value={CropStatus.PLANNED}>Lên kế hoạch</Option>
              </Select>
            </div>

            <div>
              <Text strong>Giai đoạn</Text>
              <Select 
                placeholder="Tất cả giai đoạn"
                style={{ width: 180 }}
                onChange={(value) => handleFilterChange('stage', value)}
                value={filters.stage}
                allowClear
              >
                {Object.entries(PineappleStage)
                  .filter(([key]) => !isNaN(Number(key)))
                  .map(([key, value]) => (
                    <Option key={key} value={Number(key)}>
                      {getStageLabel(Number(key))}
                    </Option>
                  ))
                }
              </Select>
            </div>

            <div className="ml-auto">
              <Space>
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={resetFilters}
                >
                  Đặt lại
                </Button>
                <Button 
                  type="primary" 
                  icon={<FilterOutlined />}
                  onClick={fetchCrops}
                >
                  Lọc
                </Button>
              </Space>
            </div>
          </div>
        </div>

        <Table 
          columns={columns} 
          dataSource={crops}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page) => setPagination({...pagination, current: page}),
            showSizeChanger: false
          }}
          locale={{ emptyText: "Không có vụ dứa nào" }}
        />
      </Card>
    </div>
  );
}
