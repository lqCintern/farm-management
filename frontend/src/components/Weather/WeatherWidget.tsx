import React, { useState, useEffect } from 'react';
import { Tabs, Spin, Typography, Card } from 'antd';
import { ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import weatherService, { WeatherData } from '@/services/weatherService';
import CurrentWeather from './CurrentWeather';
import HourlyForecast from './HourlyForecast';
import DailyForecast from './DailyForecast';
import './WeatherWidget.css';

const { TabPane } = Tabs;
const { Text } = Typography;

interface WeatherWidgetProps {
  latitude?: number;
  longitude?: number;
  locationName?: string;
  fieldId?: number;
  compact?: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  latitude,
  longitude,
  locationName,
  fieldId,
  compact = false
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [activeTab, setActiveTab] = useState<string>("hourly");

  useEffect(() => {
    const getWeatherData = async () => {
      try {
        setLoading(true);
        
        let response;
        if (fieldId) {
          response = await weatherService.fetchWeatherForecast({ fieldId });
        } else if (latitude && longitude) {
          response = await weatherService.fetchWeatherForecast({ latitude, longitude, locationName });
        } else {
          response = await weatherService.fetchWeatherForecast({});
        }
        
        if (response && response.status === "success") {
          setWeatherData(response.data);
          setError(null);
        } else {
          setError(response?.message || "Không thể tải dữ liệu thời tiết");
        }
      } catch (err) {
        console.error("Error fetching weather data:", err);
        setError("Không thể tải dữ liệu thời tiết. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    getWeatherData();
    // Cập nhật dữ liệu mỗi 30 phút
    const intervalId = setInterval(getWeatherData, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fieldId, latitude, longitude, locationName]);

  if (loading) {
    return (
      <Card className="weather-widget-card" style={{ height: compact ? '100px' : '400px' }}>
        <div className="weather-loading">
          <Spin size="large" />
          <Text className="mt-3">Đang tải dữ liệu thời tiết...</Text>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="weather-widget-card">
        <div className="weather-error">
          <Text type="danger">{error}</Text>
        </div>
      </Card>
    );
  }

  if (!weatherData) {
    return null;
  }

  const { current, hourly, daily, location } = weatherData;

  return (
    <Card className="weather-widget-card">
      <div className="weather-panel">
        <div className="mb-2">
          <Text className="text-xs text-gray-500">THỜI TIẾT CHO {location.name.toUpperCase()}</Text>
        </div>
        
        <div className={`weather-content ${compact ? 'compact' : ''}`}>
          {/* Hiển thị thời tiết hiện tại */}
          <div className={compact ? "col-span-12" : "col-span-5"}>
            <CurrentWeather data={current} compact={compact} />
          </div>
          
          {/* Dự báo chi tiết - ẩn khi ở chế độ compact */}
          {!compact && (
            <div className="col-span-7">
              <Tabs activeKey={activeTab} onChange={setActiveTab}>
                <TabPane 
                  tab={<span><ClockCircleOutlined /> Theo giờ</span>} 
                  key="hourly"
                >
                  <HourlyForecast data={hourly} />
                </TabPane>
                <TabPane 
                  tab={<span><CalendarOutlined /> Theo ngày</span>} 
                  key="daily"
                >
                  <DailyForecast data={daily} />
                </TabPane>
              </Tabs>
            </div>
          )}
        </div>
        
        {/* Thời gian cập nhật */}
        <div className="mt-2">
          <Text className="text-xs text-gray-400">
            Cập nhật lần cuối: {new Date(weatherData.last_updated).toLocaleTimeString()}
          </Text>
        </div>
      </div>
    </Card>
  );
};

export default WeatherWidget;