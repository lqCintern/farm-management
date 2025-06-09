import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Row, Col, Select, Typography, Button, Spin, Alert } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import WeatherWidget from '@/components/Weather/WeatherWidget';
import fetchAllFields from '@/services/farming/fieldService';

const { Option } = Select;
const { Title, Text } = Typography;

const WeatherDashboardPage: React.FC = () => {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  
  useEffect(() => {
    const loadFields = async () => {
      try {
        setLoading(true);
        const response = await fetchAllFields.getFields();
        setFields(response.data || []);
        
        if (response.data && response.data.length > 0) {
          setSelectedFieldId(response.data[0].id);
        }
      } catch (error) {
        console.error('Error loading fields:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFields();
  }, []);
  
  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };
  
  const selectedField = fields.find(field => field.id === selectedFieldId);
  
  return (
    <PageContainer
      title="Theo dõi thời tiết"
      subTitle="Dữ liệu thời tiết cho các ruộng của bạn"
      extra={[
        <Button 
          key="refresh" 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
        >
          Làm mới dữ liệu
        </Button>
      ]}
    >
      {loading ? (
        <Card>
          <div className="flex items-center justify-center p-10">
            <Spin size="large" />
          </div>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card>
              <Row gutter={16} align="middle">
                <Col span={8}>
                  <Text>Chọn ruộng:</Text>{' '}
                  <Select
                    style={{ width: 200 }}
                    placeholder="Chọn ruộng"
                    value={selectedFieldId}
                    onChange={setSelectedFieldId}
                  >
                    {fields.map(field => (
                      <Option key={field.id} value={field.id}>
                        {field.name}
                      </Option>
                    ))}
                  </Select>
                </Col>
                <Col span={16}>
                  {selectedField && (
                    <div className="text-right">
                      <Text strong>Diện tích:</Text>{' '}
                      <Text>{selectedField.area} m²</Text>{' | '}
                      <Text strong>Vị trí:</Text>{' '}
                      <Text>{selectedField.location || `${selectedField.latitude}, ${selectedField.longitude}`}</Text>
                    </div>
                  )}
                </Col>
              </Row>
            </Card>
          </Col>
          
          <Col span={24}>
            <Card>
              {selectedField ? (
                <WeatherWidget 
                  key={`weather-${selectedFieldId}-${refreshKey}`}
                  fieldId={selectedFieldId ?? undefined}
                />
              ) : (
                <Alert
                  type="info"
                  message="Không có ruộng nào được chọn"
                  description="Vui lòng chọn một ruộng để xem dữ liệu thời tiết"
                />
              )}
            </Card>
          </Col>
          
          {/* Thêm các phần khác của dashboard thời tiết nếu cần */}
        </Row>
      )}
    </PageContainer>
  );
};

export default WeatherDashboardPage;