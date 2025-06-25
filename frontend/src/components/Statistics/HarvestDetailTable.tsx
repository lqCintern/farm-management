import { useState } from 'react';
import Button from '@/components/common/Button';
import Tabs from '@/components/common/Tabs';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

interface HarvestDetailTableProps {
  harvestData: any[];
  materialData: any[];
}

export default function HarvestDetailTable({ harvestData, materialData }: HarvestDetailTableProps) {
  const [activeTab, setActiveTab] = useState<'harvests' | 'materials'>('harvests');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileData = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(fileData, fileName);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Chi tiết dữ liệu</h2>
        <Button
          buttonType="secondary"
          className="flex items-center"
          onClick={() => exportToExcel(activeTab === 'harvests' ? harvestData : materialData, `${activeTab === 'harvests' ? 'thu-hoach' : 'vat-tu'}.xlsx`)}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Xuất Excel
        </Button>
      </div>
      
      <div className="p-6">
        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'harvests', label: 'Thu hoạch' },
            { id: 'materials', label: 'Vật tư đã dùng' }
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as 'harvests' | 'materials')}
          className="mb-6"
        />
        
        {/* Thu hoạch table */}
        {activeTab === 'harvests' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruộng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cây trồng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản lượng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nguồn</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá bán</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doanh thu</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {harvestData?.map((harvest, index) => (
                  <tr key={harvest.id || index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(harvest.harvest_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{harvest.field_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{harvest.crop_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{harvest.quantity} kg</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${harvest.source === 'marketplace' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {harvest.source === 'marketplace' ? 'Thương lái' : 'Tự tiêu thụ'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{harvest.sale_price ? formatCurrency(harvest.sale_price) : '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{harvest.total_revenue ? formatCurrency(harvest.total_revenue) : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{harvest.notes}</td>
                  </tr>
                ))}
                {(!harvestData || harvestData.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Không có dữ liệu thu hoạch trong khoảng thời gian này
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Vật tư table */}
        {activeTab === 'materials' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên vật tư</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn giá</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruộng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hoạt động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {materialData?.map((material, index) => (
                  <tr key={material.id || index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatDate(material.used_date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{material.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{material.category}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{material.quantity} {material.unit}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(material.unit_price)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(material.total_price)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{material.field_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{material.activity_name}</td>
                  </tr>
                ))}
                {(!materialData || materialData.length === 0) && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Không có dữ liệu vật tư trong khoảng thời gian này
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}