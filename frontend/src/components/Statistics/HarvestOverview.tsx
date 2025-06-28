import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  Tooltip 
} from 'recharts';
import { useEffect, useState } from 'react';
import { getHarvestStatistics } from '@/services/farming/statisticsService';

interface HarvestStatistics {
  monthly: Record<string, number>;
  by_crop: Record<string, number>;
  by_field: Record<string, number>;
  total_quantity: number;
  harvest_count: number;
  farming_harvests: number;
  marketplace_harvests: number;
  total_revenue: number;
}

export default function HarvestOverview() {
  const [stats, setStats] = useState<HarvestStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getHarvestStatistics();
        setStats(data);
      } catch (error) {
        console.error('Error fetching harvest statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  // Dữ liệu cho biểu đồ nguồn thu hoạch
  const sourceData = [
    { name: 'Thu hoạch tự tiêu thụ', value: stats.farming_harvests },
    { name: 'Thu hoạch bán thương lái', value: stats.marketplace_harvests }
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800">Tổng sản lượng</h3>
            <p className="mt-2 text-2xl font-bold">{stats.total_quantity} kg</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800">Tổng số lần thu hoạch</h3>
            <p className="mt-2 text-2xl font-bold">{stats.harvest_count}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-purple-800">Thu hoạch thương lái</h3>
            <p className="mt-2 text-2xl font-bold">{stats.marketplace_harvests}</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-800">Tổng doanh thu</h3>
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
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} lần`, 'Số lần thu hoạch']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Thống kê theo tháng */}
        {Object.keys(stats.monthly).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Thống kê theo tháng</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tháng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản lượng (kg)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(stats.monthly).map(([month, quantity]) => (
                    <tr key={month}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{quantity} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}