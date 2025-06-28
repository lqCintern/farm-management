import { useState, useEffect } from 'react';
import { getFarmStatistics } from '@/services/farming/statisticsService';
import StatFilters from '@/components/Statistics/StatFilters';
import HarvestOverview from '@/components/Statistics/HarvestOverview';
import MaterialUsageStats from '@/components/Statistics/MaterialUsageStats';
import RevenueExpenseChart from '@/components/Statistics/RevenueExpenseChart';
import HarvestDetailTable from '@/components/Statistics/HarvestDetailTable';
import Tabs from '@/components/common/Tabs';

export default function HarvestStatisticsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    endDate: new Date(),
    fieldId: '',
    cropId: ''
  });
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const result = await getFarmStatistics(filters);
        setStats(result);
      } catch (error) {
        console.error("Failed to fetch statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [filters]);

  const handleFiltersChange = (newFilters: any) => {
    setFilters({...filters, ...newFilters});
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Thống kê Thu hoạch và Vật tư</h1>
        
        {/* Bộ lọc */}
        <StatFilters 
          filters={filters} 
          onChange={handleFiltersChange} 
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Tổng quan' },
          { id: 'details', label: 'Chi tiết' }
        ]}
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as 'overview' | 'details')}
        className="mb-6"
      />

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* Tổng quan thu hoạch */}
              <HarvestOverview />
              
              {/* Tổng quan vật tư đã dùng */}
              <MaterialUsageStats 
                stats={stats?.materials} 
                material_details={stats?.material_details}
              />
              
              {/* Biểu đồ doanh thu - chi phí */}
              <RevenueExpenseChart data={stats?.charts} />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bảng chi tiết thu hoạch */}
              <HarvestDetailTable />
            </div>
          )}
        </>
      )}
    </div>
  );
}