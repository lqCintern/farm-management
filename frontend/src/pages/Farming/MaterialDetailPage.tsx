import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Package, Activity, Edit2, AlertTriangle, 
  ChevronDown, ChevronUp, ShoppingBag
} from 'react-feather';
import farmInventoryService from '@/services/farming/farmInventoryService';
import { formatCurrency, formatDate } from '@/utils/formatters';
import AdjustQuantityModal from '@/components/Farming/Inventory/AdjustQuantityModal';
import LoadingSpinner from '@/components/common/Spinner';
import ErrorAlert from '@/components/common/ErrorAlert';
import Badge from '@/components/common/Badge';
import Card from '@/components/common/Card';

// Map transaction types to user-friendly labels
const transactionTypeLabels = {
  purchase: { label: 'Nhập kho', color: 'bg-green-100 text-green-800' },
  adjustment: { label: 'Điều chỉnh', color: 'bg-blue-100 text-blue-800' },
  consumption: { label: 'Sử dụng', color: 'bg-amber-100 text-amber-800' }
};

const MaterialDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [material, setMaterial] = useState<any>(null);
  type TransactionType = 'purchase' | 'adjustment' | 'consumption';
  
  const [transactions, setTransactions] = useState<{ id: string; transaction_type: TransactionType; quantity: number; unit_price: number; total_price: number; created_at: string; source?: { supplier?: string }; notes?: string }[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  const [statistics, setStatistics] = useState<any>(null);
  
  useEffect(() => {
    const fetchMaterialDetail = async () => {
      setLoading(true);
      try {
        const response = await farmInventoryService.getMaterialDetails(id!) as {
          status: string;
          material: any;
          transactions: any[];
          activities: any[];
          statistics: any;
        };
        if (response && response.status === 'success') {
          setMaterial(response.material);
          setTransactions(response.transactions);
          setActivities(response.activities);
          setStatistics(response.statistics);
        } else {
          setError('Không thể tải thông tin chi tiết vật tư');
        }
      } catch (error) {
        setError('Đã xảy ra lỗi khi tải thông tin chi tiết vật tư');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMaterialDetail();
    }
  }, [id]);
  
  const handleAdjustQuantity = async (adjustmentData: any) => {
    try {
      await farmInventoryService.adjustInventoryQuantity(Number(id), adjustmentData);
      // Reload data after adjustment
      window.location.reload();
    } catch (error) {
      console.error('Error adjusting quantity:', error);
    }
  };

  const toggleTransaction = (transactionId: string) => {
    if (expandedTransaction === transactionId) {
      setExpandedTransaction(null);
    } else {
      setExpandedTransaction(transactionId);
    }
  };

  const toggleActivity = (activityId: string) => {
    if (expandedActivity === activityId) {
      setExpandedActivity(null);
    } else {
      setExpandedActivity(activityId);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorAlert message={error} />;
  }

  if (!material) {
    return <ErrorAlert message="Không tìm thấy thông tin vật tư" />;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="mr-4 p-2 rounded-full hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Chi tiết vật tư</h1>
      </div>

      {/* Material overview card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50 mr-4">
                <Package size={24} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{material.name}</h2>
                <p className="text-gray-500">
                  {material.category === 'fertilizer' ? 'Phân bón' :
                   material.category === 'pesticide' ? 'Thuốc BVTV' :
                   material.category === 'seed' ? 'Hạt giống' :
                   material.category === 'tool' ? 'Dụng cụ' :
                   'Khác'}
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-2">
              <button
                onClick={() => navigate(`/farmer/inventory/edit/${material.id}`)}
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
              >
                <Edit2 size={16} className="inline mr-1" /> Chỉnh sửa
              </button>
              <button
                onClick={() => setShowAdjustModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Điều chỉnh số lượng
              </button>
            </div>
          </div>

          {/* Material key information */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Số lượng hiện tại</p>
              <p className="text-lg font-semibold mt-1">
                {material.quantity} {material.unit}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 uppercase">Đơn giá</p>
              <p className="text-lg font-semibold mt-1">
                {formatCurrency(material.unit_cost)}
              </p>
            </div>
          </div>

          {/* Thêm cảnh báo nếu available_quantity <= 0 */}
          {Number(material.available_quantity) <= 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle size={20} className="text-red-600 mr-2" />
                <p className="text-red-700">
                  Vật tư đã được giữ hết cho các hoạt động chưa hoàn thành! Hãy hoàn thành hoặc hủy các hoạt động để giải phóng vật tư, hoặc nhập thêm kho.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Thông tin chung
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Lịch sử nhập/xuất ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'activities'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Đã dùng cho ({activities.length})
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {activeTab === 'overview' && (
          <div className="p-6">
            {/* Basic information in two simple cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-green-50 mr-3">
                    <ShoppingBag size={20} className="text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Thông tin vật tư</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tên vật tư:</span>
                    <span className="font-semibold">{material.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Loại vật tư:</span>
                    <span className="font-semibold">
                      {material.category === 'fertilizer' ? 'Phân bón' :
                       material.category === 'pesticide' ? 'Thuốc BVTV' :
                       material.category === 'seed' ? 'Hạt giống' :
                       material.category === 'tool' ? 'Dụng cụ' :
                       'Khác'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cập nhật lần cuối:</span>
                    <span className="font-semibold">{formatDate(material.last_updated)}</span>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-center mb-4">
                  <div className="p-2 rounded-lg bg-blue-50 mr-3">
                    <Activity size={20} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Sử dụng và tồn kho</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Đơn vị:</span>
                    <span className="font-semibold">{material.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tồn kho (quantity):</span>
                    <span className="font-semibold">
                      <Badge 
                        label={`${material.quantity} ${material.unit}`} 
                        color={material.quantity <= 0 ? 'red' : material.quantity <= 10 ? 'yellow' : 'green'} 
                        size="medium"
                      />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Có thể sử dụng (available_quantity):</span>
                    <span className="font-semibold">
                      <Badge 
                        label={`${material.available_quantity} ${material.unit}`} 
                        color={Number(material.available_quantity) <= 0 ? 'red' : Number(material.available_quantity) <= 10 ? 'yellow' : 'green'} 
                        size="medium"
                      />
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Đang giữ cho hoạt động (reserved):</span>
                    <span className="font-semibold">{material.quantity - Number(material.available_quantity)} {material.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Giá trị tồn kho:</span>
                    <span className="font-semibold">{formatCurrency(material.quantity * material.unit_cost)}</span>
                  </div>
                  {/* Thống kê đã dùng */}
                  {statistics && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tổng đã dùng:</span>
                        <span className="font-semibold">{statistics.total_used} {material.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Số hoạt động đã dùng:</span>
                        <span className="font-semibold">{statistics.activities_count}</span>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>

            {/* Recently used in activities */}
            <h3 className="text-lg font-semibold mb-4">Hoạt động gần đây đã sử dụng vật tư này</h3>
            {activities.length === 0 ? (
              <p className="text-gray-500 text-center py-4 border rounded-lg">Chưa có hoạt động nào sử dụng vật tư này</p>
            ) : (
              <div className="border rounded-lg divide-y">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="p-3 hover:bg-gray-50">
                    <Link to={`/farming/activities/${activity.activity_id}`} className="block">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{activity.activity_name}</div>
                          <div className="text-sm text-gray-500">{formatDate(activity.start_date)}</div>
                          {activity.field_name && (
                            <div className="text-sm text-gray-500">Ruộng: {activity.field_name}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-red-600">
                            -{activity.actual_quantity || activity.planned_quantity} {material.unit}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
                {activities.length > 5 && (
                  <div className="p-3 text-center">
                    <button 
                      onClick={() => setActiveTab('activities')}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Xem tất cả hoạt động
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Lịch sử nhập xuất kho</h3>
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Chưa có giao dịch nào</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg overflow-hidden">
                    <div 
                      className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleTransaction(transaction.id)}
                    >
                      <div className="flex items-center">
                        <Badge 
                          label={transactionTypeLabels[transaction.transaction_type]?.label || transaction.transaction_type} 
                          color={transaction.transaction_type === 'purchase' ? 'green' : transaction.transaction_type === 'consumption' ? 'amber' : 'blue'} 
                        />
                        <span className="ml-3">{formatDate(transaction.created_at)}</span>
                      </div>
                      <div className="flex items-center">
                        <span className={`font-semibold ${transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'} mr-3`}>
                          {transaction.quantity > 0 ? '+' : ''}{transaction.quantity} {material.unit}
                        </span>
                        {expandedTransaction === transaction.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </div>
                    </div>
                    
                    {expandedTransaction === transaction.id && (
                      <div className="p-4 bg-gray-50 border-t">
                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Đơn giá:</span>
                            <span className="font-medium">{formatCurrency(transaction.unit_price)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Thành tiền:</span>
                            <span className="font-medium">{formatCurrency(transaction.total_price)}</span>
                          </div>
                          {transaction.source && transaction.source.supplier && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Nhà cung cấp:</span>
                              <span className="font-medium">{transaction.source.supplier}</span>
                            </div>
                          )}
                          {transaction.notes && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Ghi chú:</span>
                              <span className="font-medium">{transaction.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Các hoạt động sử dụng vật tư này</h3>
            {activities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Chưa có hoạt động nào sử dụng vật tư này</p>
            ) : (
              <div className="divide-y border rounded-lg">
                {activities.map((activity) => (
                  <div key={activity.id} className="hover:bg-gray-50">
                    <div 
                      className="flex justify-between items-center p-4 cursor-pointer"
                      onClick={() => toggleActivity(activity.id)}
                    >
                      <div>
                        <div className="font-medium">{activity.activity_name}</div>
                        <div className="text-sm text-gray-500">{formatDate(activity.start_date)}</div>
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-red-600 mr-3">
                          -{activity.actual_quantity || activity.planned_quantity} {material.unit}
                        </span>
                        {expandedActivity === activity.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </div>
                    </div>
                    
                    {expandedActivity === activity.id && (
                      <div className="p-4 bg-gray-50 border-t">
                        <div className="space-y-2">
                          {activity.field_name && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Ruộng:</span>
                              <Link to={`/farming/fields/${activity.field_id}`} className="text-blue-600 hover:underline">
                                {activity.field_name}
                              </Link>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Loại hoạt động:</span>
                            <span>{activity.activity_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Trạng thái:</span>
                            <Badge 
                              label={activity.status === 'completed' ? 'Đã hoàn thành' : 
                                     activity.status === 'pending' ? 'Đang chờ' : 
                                     activity.status === 'overdue' ? 'Quá hạn' : activity.status} 
                              color={activity.status === 'completed' ? 'green' : 
                                     activity.status === 'pending' ? 'blue' : 
                                     activity.status === 'overdue' ? 'red' : 'gray'} 
                            />
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Số lượng dự kiến:</span>
                            <span>{activity.planned_quantity} {material.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Số lượng đã dùng:</span>
                            <span>{activity.actual_quantity !== null ? activity.actual_quantity + ' ' + material.unit : 'Chưa cập nhật'}</span>
                          </div>
                          <div className="text-center mt-2">
                            <Link 
                              to={`/farming/activities/${activity.activity_id}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              Xem chi tiết hoạt động
                            </Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Adjust quantity modal */}
      {showAdjustModal && material && (
        <AdjustQuantityModal
          isOpen={showAdjustModal}
          onClose={() => setShowAdjustModal(false)}
          onSave={handleAdjustQuantity}
          material={material}
        />
      )}
    </div>
  );
};

export default MaterialDetailPage;
function setStatistics(statistics: any) {
    // Assuming statistics is an object containing key-value pairs of statistical data
    console.log('Statistics updated:', statistics);
    // You can add more logic here to handle the statistics data as needed
}
