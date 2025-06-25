import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface MaterialUsageStatsProps {
  stats: {
    total_cost: number;
    by_category: any[];
    most_used: any[];
    trend: {
      cost_change: number;
    };
  };
}

export default function MaterialUsageStats({ stats }: MaterialUsageStatsProps) {
  if (!stats) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Thống kê Vật tư đã dùng</h2>
      </div>
      
      <div className="p-6">
        {/* Tổng chi phí vật tư */}
        <div className="mb-8">
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-orange-800">Tổng chi phí vật tư</h3>
              {stats.trend.cost_change !== 0 && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stats.trend.cost_change > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {stats.trend.cost_change > 0 ? '+' : ''}{stats.trend.cost_change}%
                </span>
              )}
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(stats.total_cost)}</p>
          </div>
        </div>
        
        {/* Biểu đồ vật tư theo loại */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Vật tư theo loại</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.by_category}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 40,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={70} 
                />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="cost" name="Chi phí" fill="#FF9800" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Vật tư sử dụng nhiều nhất */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-4">Vật tư sử dụng nhiều nhất</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên vật tư</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi phí</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.most_used.map((material) => (
                  <tr key={material.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.quantity} {material.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(material.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}