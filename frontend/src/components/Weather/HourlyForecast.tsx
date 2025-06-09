import React from 'react';
import { Typography } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface HourlyForecastProps {
  data: any[];
}

const HourlyForecast: React.FC<HourlyForecastProps> = ({ data }) => {
  if (!data || data.length === 0) return null;
  
  // Hiển thị 6 giờ tiếp theo
  const forecastItems = data.slice(0, 6);
  
  return (
    <div className="grid grid-cols-6 gap-1">
      {forecastItems.map((hour, index) => {
        // Sửa lại cách xử lý ngày tháng
        // Nếu dt là chuỗi ISO, sử dụng trực tiếp
        // Nếu dt là unix timestamp (số), nhân với 1000
        const time = typeof hour.dt === 'string' 
          ? new Date(hour.dt) 
          : new Date(hour.dt * 1000);
          
        const formattedTime = time.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false // Thêm tham số này để hiển thị định dạng 24h
        });
        const iconUrl = `https://openweathermap.org/img/wn/${hour.weather_icon}.png`;
        
        return (
          <div key={index} className="text-center">
            <Text strong className="block">{formattedTime}</Text>
            <img 
              src={iconUrl} 
              alt={hour.weather_description} 
              title={hour.weather_description}
              className="w-10 h-10 mx-auto"
            />
            <Text className="text-lg font-semibold block">
              {Math.round(hour.temp)}°C
            </Text>
            <ul className="list-none p-0 space-y-1 text-xs">
              <li className="flex items-center justify-center" title={`Gió ${hour.wind_speed} m/s`}>
                <Text type="secondary">{Math.round(hour.wind_speed)}m/s</Text>
                <span 
                  className="ml-1" 
                  style={{ transform: `rotate(${hour.wind_deg}deg)` }}
                >
                  <EnvironmentOutlined style={{ fontSize: '10px' }} />
                </span>
              </li>
              <li>
                <Text type="secondary">
                  {hour.pop}% <span className="text-blue-500">●</span>
                </Text>
              </li>
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default HourlyForecast;