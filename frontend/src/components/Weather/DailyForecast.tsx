import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface DailyForecastProps {
  data: any[];
}

const DailyForecast: React.FC<DailyForecastProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Định dạng ngày trong tuần
  const getDayName = (date: Date) => {
    const dayIndex = date.getDay();
    if (dayIndex === 0) return 'Chủ nhật';
    return `Thứ ${dayIndex + 1}`;
  };
  
  // Format: "Thứ 6 (10/06)"
  const formatDay = (dt: any) => {
    // Kiểm tra kiểu dữ liệu của dt để xử lý đúng
    const date = typeof dt === 'string' 
      ? new Date(dt) 
      : new Date(dt * 1000);
    
    // Kiểm tra xem date có hợp lệ không
    if (isNaN(date.getTime())) {
      return 'N/A'; // Trả về N/A nếu ngày không hợp lệ
    }
    
    const day = getDayName(date);
    const dayOfMonth = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    return `${day} (${dayOfMonth}/${month})`;
  };
  
  return (
    <div className="grid grid-cols-6 gap-1">
      {data.slice(0, 6).map((day, index) => {
        const iconUrl = `https://openweathermap.org/img/wn/${day.weather_icon}.png`;
        
        return (
          <div key={index} className="text-center">
            <Text strong className="block">{formatDay(day.dt)}</Text>
            <img 
              src={iconUrl} 
              alt={day.weather_description} 
              title={day.weather_description}
              className="w-10 h-10 mx-auto"
            />
            <div>
              <Text className="font-medium">
                {Math.round(day.temp_max)}°C
              </Text>
              <Text type="secondary" className="ml-1">
                {Math.round(day.temp_min)}°C
              </Text>
            </div>
            <ul className="list-none p-0 space-y-1">
              <li>
                <Text type="secondary">
                  {day.pop}% <span className="text-blue-500">●</span>
                </Text>
              </li>
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default DailyForecast;