import { useState, useEffect } from 'react';
import Button from '@/components/common/Button';
import Tabs from '@/components/common/Tabs';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { getHarvestStatistics } from '@/services/farming/statisticsService';
import { Link } from 'react-router-dom';

interface HarvestDetail {
  id: number;
  type: string;
  quantity: number;
  harvest_date: string;
  field_name: string | null;
  crop_name: string | null;
  farm_activity_id: number | null;
  farm_activity_type: string | null;
  farm_activity_status: string | null;
  order_id?: number;
  order_title?: string;
  buyer_name?: string;
  created_at: string;
  revenue: number;
}

export default function HarvestDetailTable() {
  const [harvestDetails, setHarvestDetails] = useState<HarvestDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const stats = await getHarvestStatistics();
        const allDetails = [
          ...stats.farming_details,
          ...stats.marketplace_details
        ].sort((a, b) => new Date(b.harvest_date).getTime() - new Date(a.harvest_date).getTime());
        
        setHarvestDetails(allDetails);
      } catch (error) {
        console.error('Error fetching harvest details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getTypeLabel = (type: string) => {
    return type === 'farming' ? 'Tự tiêu thụ' : 'Bán thương lái';
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return 'text-gray-500';
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-500';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(value);
  };

  const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(fileData, fileName);
  };

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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Chi tiết Thu hoạch</h2>
        <Button
          buttonType="secondary"
          className="flex items-center"
          onClick={() => exportToExcel(harvestDetails, 'thu-hoach.xlsx')}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Xuất Excel
        </Button>
      </div>
      
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày thu hoạch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ruộng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cây trồng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản lượng (kg)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Doanh thu
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thương lái/Đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hoạt động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {harvestDetails.map((harvest) => (
                <tr key={`${harvest.type}-${harvest.id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(harvest.harvest_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      harvest.type === 'farming' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {getTypeLabel(harvest.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {harvest.field_name || 'Chưa xác định'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {harvest.crop_name || 'Chưa xác định'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {harvest.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(harvest.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {harvest.type === 'marketplace' ? (
                      <div>
                        <div className="font-medium">{harvest.buyer_name}</div>
                        <div className="text-xs text-gray-500">
                          <Link to={`/orders/${harvest.order_id}`} className="text-blue-600 hover:underline">
                            Đơn hàng #{harvest.order_id}
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {harvest.farm_activity_id ? (
                      <div>
                        <div className="font-medium">
                          <Link to={`/farm-activities/${harvest.farm_activity_id}`} className="text-blue-600 hover:underline">
                            Hoạt động #{harvest.farm_activity_id}
                          </Link>
                        </div>
                        <div className={`text-xs ${getStatusColor(harvest.farm_activity_status)}`}>
                          {harvest.farm_activity_type} - {harvest.farm_activity_status}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Chưa liên kết</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {harvestDetails.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            Chưa có dữ liệu thu hoạch
          </div>
        )}
      </div>
    </div>
  );
}