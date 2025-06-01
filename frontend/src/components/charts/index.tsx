import React from 'react';

interface ChartDataPoint {
  name: string;
  value: number;
  color: string;
}

export const PieChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
  // Simple SVG-based pie chart
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let startAngle = 0;
  
  return (
    <div className="w-full h-64 flex justify-center items-center">
      <svg width="200" height="200" viewBox="0 0 100 100">
        {data.map((item, index) => {
          const percentage = item.value / total;
          const angle = percentage * 360;
          const endAngle = startAngle + angle;
          
          // Convert angles to radians for calculations
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          
          // Calculate the path
          const x1 = 50 + 40 * Math.cos(startRad);
          const y1 = 50 + 40 * Math.sin(startRad);
          const x2 = 50 + 40 * Math.cos(endRad);
          const y2 = 50 + 40 * Math.sin(endRad);
          
          // Large arc flag is 1 if angle > 180 degrees
          const largeArcFlag = angle > 180 ? 1 : 0;
          
          const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
          
          startAngle = endAngle;
          
          return <path key={index} d={pathData} fill={item.color} />;
        })}
      </svg>
      <div className="ml-4">
        <ul className="space-y-2">
          {data.map((item, index) => (
            <li key={index} className="flex items-center">
              <div className="w-3 h-3 mr-2" style={{ backgroundColor: item.color }}></div>
              <span>{item.name}: {item.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export const BarChart: React.FC<{ 
  data: { label: string; value: number; color?: string }[]; 
  title?: string;
}> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="w-full">
      {title && <h3 className="text-center mb-4">{title}</h3>}
      <div className="flex items-end h-64 space-x-2">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="w-full rounded-t" 
              style={{ 
                height: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color || '#3B82F6',
              }}
            ></div>
            <div className="text-xs mt-1 text-center">{item.label}</div>
            <div className="text-sm font-medium">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};