import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getExchangeSummary, recalculateExchangeBalance, recalculateAllExchangeBalances, initializeExchangeData } from '@/services/labor/exchangeService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { toast } from 'react-hot-toast';
import LaborNavigation from '@/components/Labor/LaborNavigation';

// Cập nhật interface theo cấu trúc mới
interface ExchangeSummaryResponse {
  exchange_id: number;
  partner_household_id: number;
  partner_household_name: string;
  balance: string;
  last_transaction_date: string;
}

interface RecalculationResult {
  household_id: number;
  household_name: string;
  old_balance: number;
  new_balance: number;
  difference: number;
}

const ExchangeSummary = () => {
  const [exchanges, setExchanges] = useState<ExchangeSummaryResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecalculateModal, setShowRecalculateModal] = useState<boolean>(false);
  const [recalculationResults, setRecalculationResults] = useState<RecalculationResult[]>([]);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await getExchangeSummary();
      
      // Xử lý cấu trúc response mới
      if (Array.isArray(response.data)) {
        setExchanges(response.data);
      } else {
        setExchanges([]);
        console.error('Invalid response format:', response);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching exchange summary:', err);
      setError('Không thể tải thông tin trao đổi công');
    } finally {
      setLoading(false);
    }
  };

  // Tính lại tất cả số dư đổi công
  const handleRecalculateAll = async () => {
    try {
      setIsRecalculating(true);
      const results: RecalculationResult[] = [];

      // Tính toán lần lượt cho từng hộ - sử dụng cấu trúc mới
      for (const exchange of exchanges) {
        try {
          const response = await recalculateExchangeBalance(exchange.partner_household_id);
          results.push({
            household_id: exchange.partner_household_id,
            household_name: exchange.partner_household_name,
            old_balance: response.data.old_balance,
            new_balance: response.data.new_balance,
            difference: response.data.difference
          });
        } catch (err) {
          console.error(`Error recalculating for household ${exchange.partner_household_id}:`, err);
        }
      }

      setRecalculationResults(results);
      setShowRecalculateModal(true);
    } catch (err) {
      console.error('Error in recalculation process:', err);
      toast.error('Không thể tính lại số dư công');
    } finally {
      setIsRecalculating(false);
    }
  };

  // Khởi tạo dữ liệu đổi công - không cần thay đổi
  const handleInitializeData = async () => {
    try {
      setIsRecalculating(true);
      const response = await initializeExchangeData() as { data?: RecalculationResult[] };
      
      if (response.data && response.data.length > 0) {
        setRecalculationResults(response.data);
        setShowRecalculateModal(true);
      } else {
        toast("Không tìm thấy dữ liệu đổi công nào để khởi tạo");
      }
    } catch (err) {
      console.error('Error initializing exchange data:', err);
      toast.error('Không thể khởi tạo dữ liệu đổi công');
    } finally {
      setIsRecalculating(false);
    }
  };

  // Các phương thức khác giữ nguyên
  const handleConfirmRecalculation = async () => {
    try {
      toast.success('Đã cập nhật số dư công thành công!');
      setShowRecalculateModal(false);
      fetchSummary();
    } catch (err) {
      console.error('Error updating balances:', err);
      toast.error('Không thể cập nhật số dư công');
    }
  };

  const handleAction = async () => {
    if (exchanges.length === 0) {
      await handleInitializeData();
    } else {
      await handleRecalculateAll();
    }
  };

  return (
    <>
      <LaborNavigation />
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dư nợ đổi công</h1>
            <p className="text-gray-500">Quản lý số dư đổi công với các hộ khác</p>
          </div>
          <Button 
            onClick={handleAction} 
            disabled={isRecalculating}
            buttonType="secondary"
          >
            {isRecalculating ? 'Đang xử lý...' : 
             exchanges.length === 0 ? 'Tạo dữ liệu đổi công ban đầu' : 'Tính lại số dư'}
          </Button>
        </div>

        {/* Loading và error */}
        {loading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : (
          <>
            {/* Phần hiển thị Cần chú ý trả công cho : */}
            {exchanges.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Cần chú ý trả công cho :</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {exchanges
                    .filter(exchange => Number(exchange.balance) < 0)
                    .sort((a, b) => Number(a.balance) - Number(b.balance))
                    .slice(0, 3)
                    .map((exchange, index) => (
                      <Card key={exchange.partner_household_id} className="hover:shadow-lg transition-shadow border-l-4 border-red-500">
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-lg">{exchange.partner_household_name}</h3>
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-red-600 mb-2">
                            {exchange.balance} giờ
                          </div>
                          <div className="text-sm text-gray-500">
                            Giao dịch gần nhất: {exchange.last_transaction_date 
                              ? new Date(exchange.last_transaction_date).toLocaleDateString('vi-VN') 
                              : 'Chưa có'}
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* Phần hiển thị tất cả các hộ */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Tất cả số dư đổi công</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {exchanges.length === 0 ? (
                  <div className="md:col-span-3 bg-gray-50 p-8 rounded-lg text-center">
                    <p className="text-gray-500">Chưa có giao dịch đổi công nào</p>
                  </div>
                ) : (
                  exchanges.map((exchange) => (
                    <Card key={exchange.partner_household_id} className="hover:shadow-lg transition-shadow">
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-medium text-lg">{exchange.partner_household_name}</h3>
                          <span 
                            className={`px-2 py-1 rounded text-sm font-medium ${
                              Number(exchange.balance) > 0 
                                ? 'bg-green-100 text-green-800' 
                                : Number(exchange.balance) < 0 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {Number(exchange.balance) > 0 
                              ? `+${exchange.balance} giờ` 
                              : Number(exchange.balance) < 0 
                                ? `${exchange.balance} giờ` 
                                : 'Cân bằng'}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-500 mb-4">
                          Giao dịch gần nhất: {exchange.last_transaction_date 
                            ? new Date(exchange.last_transaction_date).toLocaleDateString('vi-VN') 
                            : 'Chưa có'}
                        </div>
                        
                        <div className="flex space-x-2">
                          <Link to={`/labor/exchanges/${exchange.partner_household_id}`}>
                            <Button buttonType="text">Chi tiết</Button>
                          </Link>
                          <Link to={`/labor/exchanges/${exchange.partner_household_id}/history`}>
                            <Button buttonType="text">Lịch sử</Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Modal giữ nguyên */}
        {showRecalculateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Kết quả tính lại số dư công</h2>
              
              {/* Phần nội dung bảng giữ nguyên */}
              {recalculationResults.length === 0 ? (
                <p className="text-gray-500">Không có thay đổi nào</p>
              ) : (
                <div className="overflow-x-auto">
                  {/* Bảng kết quả giữ nguyên */}
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hộ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số dư cũ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số dư mới</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chênh lệch</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recalculationResults.map((result) => (
                        <tr key={result.household_id} className={result.difference !== 0 ? 'bg-yellow-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">{result.household_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{result.old_balance} giờ</td>
                          <td className="px-6 py-4 whitespace-nowrap">{result.new_balance} giờ</td>
                          <td className={`px-6 py-4 whitespace-nowrap font-medium ${
                            result.difference > 0 
                              ? 'text-green-600' 
                              : result.difference < 0 
                                ? 'text-red-600' 
                                : 'text-gray-500'
                          }`}>
                            {result.difference > 0 ? '+' : ''}{result.difference} giờ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <Button buttonType="text" onClick={() => setShowRecalculateModal(false)}>
                  Đóng
                </Button>
                <Button onClick={handleConfirmRecalculation}>
                  Cập nhật số dư
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ExchangeSummary;