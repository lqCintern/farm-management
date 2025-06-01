import { useState, useEffect } from 'react';
import { getAssignmentStats } from '@/services/labor/assignmentService';
import Card from '@/components/common/Card';
import { PieChart, BarChart } from '@/components/charts';
import DateRangePicker from '@/components/common/DateRangePicker';

const AssignmentStats = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date()
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await getAssignmentStats(period);
        setStats((response as { data: any }).data);
        setError(null);
      } catch (err) {
        console.error('Error fetching assignment stats:', err);
        setError('Không thể tải dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [period]);

  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'quarter') => {
    setPeriod(newPeriod);
  };

  // Handle date range change
  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ startDate: start, endDate: end });
    // Fetch stats with new date range
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Thống kê phân công lao động</h1>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handlePeriodChange('week')}
            className={`px-4 py-2 rounded-md ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            7 ngày
          </button>
          <button 
            onClick={() => handlePeriodChange('month')}
            className={`px-4 py-2 rounded-md ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            30 ngày
          </button>
          <button 
            onClick={() => handlePeriodChange('quarter')}
            className={`px-4 py-2 rounded-md ${period === 'quarter' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            90 ngày
          </button>
        </div>
      </div>

      {/* Date range picker */}
      <div className="mb-6">
        <DateRangePicker 
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={handleDateRangeChange}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tổng quan */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Tổng quan phân công</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Tổng số phân công</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Đã hoàn thành</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Từ chối/Vắng mặt</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected + stats.missed}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Giờ công hoàn thành</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.hours_worked}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Biểu đồ trạng thái */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Trạng thái phân công</h2>
              <PieChart
                data={[
                  { name: 'Hoàn thành', value: stats.completed, color: '#10B981' },
                  { name: 'Từ chối', value: stats.rejected, color: '#EF4444' },
                  { name: 'Vắng mặt', value: stats.missed, color: '#F59E0B' },
                  { name: 'Đang chờ', value: stats.total - stats.completed - stats.rejected - stats.missed, color: '#6B7280' }
                ]}
              />
            </div>
          </Card>
          
          {/* Đánh giá trung bình */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Đánh giá người lao động</h2>
              <div className="flex items-center">
                <div className="text-4xl font-bold text-yellow-500">{stats.avg_rating.toFixed(1)}</div>
                <div className="ml-4">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg 
                        key={i} 
                        className={`w-6 h-6 ${i < Math.round(stats.avg_rating) ? 'text-yellow-500' : 'text-gray-300'}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Dựa trên {stats.total} đánh giá</p>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Thống kê theo người lao động */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Phân công theo người lao động</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-gray-500 text-sm">
                      <th className="py-2">Người lao động</th>
                      <th className="py-2">Hoàn thành</th>
                      <th className="py-2">Từ chối/Vắng</th>
                      <th className="py-2">Đánh giá TB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.workers_data?.map((worker: any) => (
                      <tr key={worker.worker_id}>
                        <td className="py-2">{worker.worker_name}</td>
                        <td className="py-2">{worker.completed_count}</td>
                        <td className="py-2">{worker.rejected_count + worker.missed_count}</td>
                        <td className="py-2">
                          <div className="flex items-center">
                            <span>{worker.avg_rating?.toFixed(1) || '-'}</span>
                            {worker.avg_rating && (
                              <svg 
                                className="w-4 h-4 text-yellow-500 ml-1" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
};

export default AssignmentStats;
