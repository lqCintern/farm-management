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
    total_cost?: number | string;
    total_materials?: number;
    total_quantity?: number;
    by_category?: any[] | Record<string, number>;
    most_used?: any[];
    details?: any[];
    trend?: {
      cost_change: number;
    };
    low_stock?: number;
    out_of_stock?: number;
  };
  material_details?: any[]; // Thêm prop cho chi tiết sử dụng vật tư
}

export default function MaterialUsageStats({ stats, material_details }: MaterialUsageStatsProps) {
  if (!stats) return null;

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(numValue);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa sử dụng';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Chuyển đổi by_category từ object sang array nếu cần
  const getCategoryData = () => {
    if (!stats.by_category) return [];
    
    if (Array.isArray(stats.by_category)) {
      return stats.by_category;
    }
    
    // Nếu là object, chuyển thành array với thông tin chi tiết từ details
    const categoryMap = new Map();
    
    // Tính tổng cost cho mỗi category từ details
    if (material_details && Array.isArray(material_details)) {
      material_details.forEach(detail => {
        const category = detail.category;
        const cost = parseFloat(detail.total_cost?.toString() || '0');
        const quantity = parseFloat(detail.quantity?.toString() || '0');
        
        if (categoryMap.has(category)) {
          const existing = categoryMap.get(category);
          existing.cost += cost;
          existing.quantity += quantity;
          existing.count += 1;
        } else {
          categoryMap.set(category, {
            name: category === 'fertilizer' ? 'Phân bón' : 
                  category === 'pesticide' ? 'Thuốc BVTV' :
                  category === 'seed' ? 'Hạt giống' :
                  category === 'tool' ? 'Dụng cụ' : category,
            cost: cost,
            quantity: quantity,
            count: 1
          });
        }
      });
    }
    
    // Nếu không có details hoặc details rỗng, sử dụng by_category object với cost = 0
    if (categoryMap.size === 0 && typeof stats.by_category === 'object') {
      return Object.entries(stats.by_category).map(([name, count]) => ({
        name: name === 'fertilizer' ? 'Phân bón' : 
              name === 'pesticide' ? 'Thuốc BVTV' :
              name === 'seed' ? 'Hạt giống' :
              name === 'tool' ? 'Dụng cụ' : name,
        count,
        cost: 0,
        quantity: 0
      }));
    }
    
    return Array.from(categoryMap.values());
  };

  // Lấy dữ liệu vật tư sử dụng nhiều nhất
  const getMostUsedMaterials = () => {
    if (stats.most_used && Array.isArray(stats.most_used)) {
      return stats.most_used;
    }
    
    if (material_details && Array.isArray(material_details)) {
      return material_details;
    }
    
    if (stats.details && Array.isArray(stats.details)) {
      return stats.details.slice(0, 5); // Lấy 5 vật tư đầu tiên
    }
    
    return [];
  };

  const categoryData = getCategoryData();
  const mostUsedMaterials = getMostUsedMaterials();

  // Tính tổng cost từ string hoặc number
  const getTotalCost = () => {
    if (typeof stats.total_cost === 'string') {
      return parseFloat(stats.total_cost);
    }
    return stats.total_cost || 0;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Thống kê Vật tư</h2>
      </div>
      
      <div className="p-6">
        {/* Tổng quan vật tư */}
        <div className="mb-8">
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-orange-800">Tổng quan vật tư</h3>
              {stats.trend?.cost_change !== 0 && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(stats.trend?.cost_change || 0) > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                  {(stats.trend?.cost_change || 0) > 0 ? '+' : ''}{stats.trend?.cost_change || 0}%
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-sm text-orange-600">Tổng vật tư</p>
                <p className="text-xl font-bold">{stats.total_materials || 0}</p>
              </div>
              <div>
                <p className="text-sm text-orange-600">Tổng số lượng</p>
                <p className="text-xl font-bold">{stats.total_quantity || 0}</p>
              </div>
              <div>
                <p className="text-sm text-orange-600">Tổng chi phí</p>
                <p className="text-xl font-bold">{formatCurrency(getTotalCost())}</p>
              </div>
            </div>
            {/* Thêm thông tin tồn kho */}
            {(stats.low_stock !== undefined || stats.out_of_stock !== undefined) && (
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-orange-200">
                <div>
                  <p className="text-sm text-orange-600">Sắp hết hàng</p>
                  <p className="text-lg font-bold text-orange-700">{stats.low_stock || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-orange-600">Hết hàng</p>
                  <p className="text-lg font-bold text-red-600">{stats.out_of_stock || 0}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Biểu đồ vật tư theo loại */}
        {categoryData.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Vật tư theo loại</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
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
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'cost' ? formatCurrency(value as number) : value,
                      name === 'cost' ? 'Chi phí' : name === 'quantity' ? 'Số lượng' : 'Số loại'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="cost" name="Chi phí" fill="#FF9800" />
                  <Bar dataKey="quantity" name="Số lượng" fill="#2196F3" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* Vật tư sử dụng nhiều nhất */}
        {mostUsedMaterials.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-4">Danh sách vật tư</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên vật tư</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn giá</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng chi phí</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mostUsedMaterials.map((material) => (
                    <tr key={material.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{material.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {material.category === 'fertilizer' ? 'Phân bón' :
                         material.category === 'pesticide' ? 'Thuốc BVTV' :
                         material.category === 'seed' ? 'Hạt giống' :
                         material.category === 'tool' ? 'Dụng cụ' :
                         material.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{material.quantity} {material.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(parseFloat(material.unit_cost?.toString() || '0'))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(parseFloat(material.total_cost?.toString() || '0'))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bảng chi tiết các lần sử dụng vật tư */}
        {material_details && material_details.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Chi tiết các lần sử dụng vật tư</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày sử dụng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên vật tư</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hoạt động</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruộng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn giá</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {material_details.map((detail) => (
                    <tr key={detail.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(detail.used_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{detail.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {detail.category === 'fertilizer' ? 'Phân bón' :
                         detail.category === 'pesticide' ? 'Thuốc BVTV' :
                         detail.category === 'seed' ? 'Hạt giống' :
                         detail.category === 'tool' ? 'Dụng cụ' :
                         detail.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{detail.activity_name || 'Chưa sử dụng'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{detail.field_name || 'Chưa sử dụng'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{detail.quantity} {detail.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(parseFloat(detail.unit_cost?.toString() || '0'))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(parseFloat(detail.total_cost?.toString() || '0'))}
                      </td>
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