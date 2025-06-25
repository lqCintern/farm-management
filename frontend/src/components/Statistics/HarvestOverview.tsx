import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  Tooltip 
} from 'recharts';

interface HarvestOverviewProps {
  stats: {
    total_quantity: number;
    total_revenue: number;
    by_source: {
      marketplace: number;
      direct: number;
    };
    by_field: any[];
    by_crop: any[];
    trend: {
      quantity_change: number;
      revenue_change: number;
    };
  };
}

export default function HarvestOverview({ stats }: HarvestOverviewProps) {
  if (!stats) return null;

  // Dữ liệu cho biểu đồ nguồn thu hoạch
  const sourceData = [
    { name: 'Thu hoạch tự tiêu thụ', value: stats.by_source.direct },
    { name: 'Thu hoạch bán thương lái', value: stats.by_source.marketplace }
  ];

  const COLORS = ['#4CAF50', '#2196F3'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(value);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Tổng quan Thu hoạch</h2>
      </div>
      
      <div className="p-6">
        {/* Thống kê tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-green-800">Tổng sản lượng</h3>
              {stats.trend.quantity_change !== 0 && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stats.trend.quantity_change > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {stats.trend.quantity_change > 0 ? '+' : ''}{stats.trend.quantity_change}%
                </span>
              )}
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.total_quantity} kg</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-blue-800">Tổng doanh thu</h3>
              {stats.trend.revenue_change !== 0 && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stats.trend.revenue_change > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {stats.trend.revenue_change > 0 ? '+' : ''}{stats.trend.revenue_change}%
                </span>
              )}
            </div>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(stats.total_revenue)}</p>
          </div>
        </div>
        
        {/* Biểu đồ phân loại theo nguồn thu hoạch */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Phân loại theo nguồn thu hoạch</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} kg`, 'Số lượng']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Bảng thống kê theo ruộng */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Thống kê theo ruộng</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruộng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản lượng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.by_field.map((field) => (
                  <tr key={field.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{field.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{field.quantity} kg</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(field.revenue)}</td>
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