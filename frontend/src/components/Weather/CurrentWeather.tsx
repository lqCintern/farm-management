import React from 'react';
import { Typography } from 'antd';
import { 
  ArrowUpOutlined, 
  ArrowDownOutlined, 
  CloudOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

interface CurrentWeatherProps {
  data: any;
  compact?: boolean;
}

const CurrentWeather: React.FC<CurrentWeatherProps> = ({ data, compact = false }) => {
  if (!data) return null;
  
  const iconUrl = `https://openweathermap.org/img/wn/${data.weather_icon}@2x.png`;
  
  return (
    <div className={`current-weather ${compact ? 'compact' : ''}`}>
      <div className="flex items-center">
        <div className="temperature-display">
          <Title level={compact ? 4 : 2} className="m-0">
            {Math.round(data.temp)}°C
          </Title>
          <img 
            src={iconUrl} 
            alt={data.weather_description} 
            title={data.weather_description}
            className={compact ? "w-10 h-10" : "w-16 h-16"}
          />
        </div>
      </div>
      
      <div className="weather-desc mt-1">
        <Text strong className="capitalize">
          {data.weather_description} - {' '}
          <span className="text-red-500">
            <ArrowUpOutlined /> {Math.round(data.temp_max || data.temp + 2)}°C
          </span>
          {' '}
          <span className="text-gray-500">
            <ArrowDownOutlined /> {Math.round(data.temp_min || data.temp - 2)}°C
          </span>
        </Text>
      </div>
      
      {!compact && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="col-span-1">
            <ul className="list-none p-0 m-0 space-y-2">
              <li>
                <Text type="secondary">Hoàng hôn:</Text> {' '}
                <Text strong>
                  {new Date(data.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </li>
              <li className="flex items-center">
                <Text type="secondary">Gió:</Text> {' '}
                <Text strong className="flex items-center">
                  {data.wind_speed} m/s
                  <span 
                    className="ml-1 inline-flex" 
                    style={{ 
                      transform: `rotate(${data.wind_deg}deg)`,
                      display: 'inline-flex' 
                    }}
                  >
                    <EnvironmentOutlined />
                  </span>
                </Text>
              </li>
              <li>
                <Text type="secondary">Độ ẩm:</Text> {' '}
                <Text strong>{data.humidity}%</Text>
              </li>
            </ul>
          </div>
          <div className="col-span-1">
            <ul className="list-none p-0 m-0 space-y-2">
              <li>
                <Text type="secondary">Cảm giác:</Text> {' '}
                <Text strong>{Math.round(data.feels_like)}°C</Text>
              </li>
              <li>
                <Text type="secondary">Mây:</Text> {' '}
                <Text strong>{data.clouds}%</Text>
              </li>
              <li>
                <Text type="secondary">Lượng mưa (1h):</Text> {' '}
                <Text strong>{data.rain || 0}mm</Text>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrentWeather;