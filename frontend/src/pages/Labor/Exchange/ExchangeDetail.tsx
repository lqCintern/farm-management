import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getExchangeDetails, 
  resetExchangeBalance, 
  adjustExchangeBalance,
  recalculateExchangeBalance 
} from '@/services/labor/exchangeService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from 'react-hot-toast';
import axios from 'axios';

interface Assignment {
  id: number;
  worker_name: string;
  work_date: string;
  hours_worked: number;
  work_units: number | null;
  start_time?: string;
  end_time?: string;
}

interface DetailedRequest {
  request_id: number;
  title: string;
  requesting_household: string;
  providing_household: string;
  work_dates: string[];
  completed_assignments: Assignment[];
}

interface Transaction {
  id: number;
  date: string;
  amount: number;
  description?: string;
  // Add other fields as needed based on your backend response
}

interface ExchangeDetailResponse {
  exchange: ExchangeDetail;
  balance: number;
  direction: string;
  transactions: Transaction[];
  detailed_history: DetailedRequest[];
}

interface ExchangeDetail {
  exchange: {
    id: number;
    household_a_id: number;
    household_b_id: number;
    household_b_name: string;
    hours_balance: number;
    last_transaction_date: string;
  };
  balance: number;
  direction: 'positive' | 'negative' | 'neutral';
  detailed_history?: DetailedRequest[];
}

const ExchangeDetail = () => {
  const { householdId } = useParams<{ householdId: string }>();
  const navigate = useNavigate();
  const [exchangeDetail, setExchangeDetail] = useState<ExchangeDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [adjustHours, setAdjustHours] = useState<number>(0);
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [processingAction, setProcessingAction] = useState<boolean>(false);
  const [showRecalculateModal, setShowRecalculateModal] = useState<boolean>(false);
  const [recalculationResult, setRecalculationResult] = useState<{
    old_balance: number;
    new_balance: number;
    difference: number;
  } | null>(null);
  
  useEffect(() => {
    const fetchDetail = async () => {
      if (!householdId) return;
      
      try {
        setLoading(true);
        const response = await getExchangeDetails(parseInt(householdId)) as { data: ExchangeDetail };
        setExchangeDetail((response as { data: ExchangeDetail }).data);
        setError(null);
      } catch (err) {
        console.error('Error fetching exchange details:', err);
        setError('Không thể tải thông tin trao đổi công');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [householdId]);

  const handleResetBalance = async () => {
    if (!exchangeDetail) return;
    
    try {
      setProcessingAction(true);
      await resetExchangeBalance(exchangeDetail.exchange.id);
      // Refresh data
      const response = await getExchangeDetails(parseInt(householdId!));
      setExchangeDetail((response as { data: ExchangeDetail }).data);
      setShowResetConfirm(false);
    } catch (err) {
      console.error('Error resetting balance:', err);
      setError('Không thể reset số dư công');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!exchangeDetail || !householdId) return;
    
    try {
      setProcessingAction(true);
      await adjustExchangeBalance(
        parseInt(householdId),
        adjustHours,
        adjustNotes
      );
      
      // Refresh data
      const response = await getExchangeDetails(parseInt(householdId));
      setExchangeDetail((response as { data: ExchangeDetail }).data);
      setShowAdjustModal(false);
      setAdjustHours(0);
      setAdjustNotes('');
    } catch (err) {
      console.error('Error adjusting balance:', err);
      setError('Không thể điều chỉnh số dư công');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRecalculate = async () => {
    if (!householdId) return;
    
    try {
      setProcessingAction(true);
      const response = await recalculateExchangeBalance(parseInt(householdId));
      
      setRecalculationResult({
        old_balance: response.data.old_balance,
        new_balance: response.data.new_balance,
        difference: response.data.difference
      });
      
      setShowRecalculateModal(true);
    } catch (err) {
      console.error('Error recalculating balance:', err);
      toast.error('Không thể tính lại số dư công');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleConfirmRecalculation = async () => {
    try {
      // Recalculation đã được thực hiện rồi, chỉ cần load lại dữ liệu
      const response = await getExchangeDetails(parseInt(householdId!));
      setExchangeDetail((response as { data: ExchangeDetail }).data);
      setShowRecalculateModal(false);
      toast.success('Đã cập nhật số dư công thành công!');
    } catch (err) {
      console.error('Error applying recalculation:', err);
      toast.error('Không thể cập nhật số dư công');
    }
  };

  // Thêm utility function để format giờ
  const formatTime = (timeString: string): string => {
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return 'Invalid time';
    }
  };

  // Thêm function tính lại giờ công
  const recalculateHoursWorked = async () => {
    try {
      toast.loading('Đang tính toán giờ công...');
      
      // Gọi API tính lại giờ công
      await axios.post(`/api/v1/labor/exchanges/households/${householdId}/recalculate_hours`);
      
      // Refresh data
      const response = await getExchangeDetails(parseInt(householdId!));
      setExchangeDetail((response as { data: ExchangeDetail }).data);
      
      toast.dismiss();
      toast.success('Đã tính toán lại giờ công thành công');
    } catch (err) {
      toast.dismiss();
      toast.error('Không thể tính lại giờ công');
    }
  };

  return (
    <div className="container mx-auto p-4">
      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : exchangeDetail ? (
        <>
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Chi tiết đổi công với {exchangeDetail.exchange.household_b_name}</h1>
              <p className="text-gray-500">Quản lý số dư và giao dịch đổi công</p>
            </div>
            <div>
              <Button onClick={() => navigate(`/labor/exchanges/${householdId}/history`)}>
                Xem lịch sử
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <div className="p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="text-lg font-medium mb-4">Thông tin số dư</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-500">Số dư hiện tại:</p>
                      <p className={`text-3xl font-bold ${
                        exchangeDetail.balance > 0 
                          ? 'text-green-600' 
                          : exchangeDetail.balance < 0 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                      }`}>
                        {exchangeDetail.balance > 0 
                          ? `+${exchangeDetail.balance}` 
                          : exchangeDetail.balance} giờ công
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500">Trạng thái:</p>
                      <p className="font-medium">
                        {exchangeDetail.direction === 'positive' 
                          ? 'Họ đang nợ bạn công' 
                          : exchangeDetail.direction === 'negative' 
                            ? 'Bạn đang nợ họ công' 
                            : 'Cân bằng'}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-500">Giao dịch gần nhất:</p>
                      <p>{exchangeDetail.exchange.last_transaction_date 
                        ? new Date(exchangeDetail.exchange.last_transaction_date).toLocaleDateString('vi-VN') 
                        : 'Chưa có'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 md:mt-0">
                  <h3 className="text-lg font-medium mb-4">Thao tác</h3>
                  
                  <div className="space-y-3">
                    <Button 
                      buttonType="primary" 
                      className="w-full"
                      onClick={() => setShowAdjustModal(true)}
                    >
                      Điều chỉnh số dư
                    </Button>
                    
                    <Button 
                      buttonType="secondary" 
                      className="w-full"
                      onClick={handleRecalculate}
                      disabled={processingAction}
                    >
                      Tính lại số dư
                    </Button>
                    
                    <Button 
                      buttonType="danger" 
                      className="w-full"
                      onClick={() => setShowResetConfirm(true)}
                      disabled={exchangeDetail.balance === 0}
                    >
                      Xóa số dư
                    </Button>

                    <Button 
                      buttonType="primary" 
                      className="w-full"
                      onClick={recalculateHoursWorked}
                    >
                      Tính lại giờ công từ giờ làm việc
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Thêm hiển thị lịch sử chi tiết */}
          {exchangeDetail && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Lịch sử chi tiết theo yêu cầu</h3>
              <div className="space-y-4">
                {exchangeDetail.detailed_history?.map((item) => (
                  <div key={item.request_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{item.title}</h4>
                      <div className="text-sm text-gray-500">
                        {item.work_dates.map(date => new Date(date).toLocaleDateString('vi-VN')).join(', ')}
                      </div>
                    </div>
                    
                    <div className="text-sm mb-3">
                      <span className="font-medium">Yêu cầu:</span> {item.requesting_household} → 
                      <span className="font-medium">Cung cấp:</span> {item.providing_household}
                    </div>
                    
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Người lao động</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ngày làm việc</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Giờ làm việc</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Đơn vị công</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {item.completed_assignments.map((assignment) => (
                          <tr key={assignment.id}>
                            <td className="px-4 py-2">{assignment.worker_name}</td>
                            <td className="px-4 py-2">{new Date(assignment.work_date).toLocaleDateString('vi-VN')}</td>
                            <td className="px-4 py-2">
                              {assignment.hours_worked > 0 ? (
                                // Nếu đã có hours_worked
                                `${assignment.hours_worked} giờ`
                              ) : assignment.start_time && assignment.end_time ? (
                                // Nếu chỉ có start_time và end_time
                                <>
                                  <div>{formatTime(assignment.start_time)} - {formatTime(assignment.end_time)}</div>
                                  <div className="text-sm text-red-500">(Chưa tính giờ công)</div>
                                </>
                              ) : (
                                'Không có thông tin'
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {assignment.work_units && assignment.work_units > 0 ? 
                                assignment.work_units : 
                                assignment.start_time && assignment.end_time ? 
                                  <span className="text-yellow-600">Cần tính lại</span> : 
                                  '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Reset Balance Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetBalance}
        title="Xác nhận xóa số dư"
        message="Bạn có chắc chắn muốn xóa số dư đổi công với hộ này không? Hành động này không thể hoàn tác."
        confirmText="Xóa số dư"
        loading={processingAction}
      />
      
      {/* Adjust Balance Modal */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center ${showAdjustModal ? '' : 'hidden'}`}>
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-xl font-medium mb-4">Điều chỉnh số dư công</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Số giờ điều chỉnh</label>
            <input
              type="number"
              value={adjustHours}
              onChange={(e) => setAdjustHours(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Nhập số dương để tăng, âm để giảm"
            />
            <p className="text-sm text-gray-500 mt-1">Số dương: Họ nợ bạn thêm giờ. Số âm: Bạn nợ họ thêm giờ.</p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
            <textarea
              value={adjustNotes}
              onChange={(e) => setAdjustNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              rows={3}
              placeholder="Lý do điều chỉnh"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button buttonType="text" onClick={() => setShowAdjustModal(false)} disabled={processingAction}>
              Hủy
            </Button>
            <Button onClick={handleAdjustBalance} disabled={processingAction || adjustHours === 0}>
              {processingAction ? 'Đang xử lý...' : 'Điều chỉnh'}
            </Button>
          </div>
        </div>
      </div>

      {/* Recalculation Result Modal */}
      {showRecalculateModal && recalculationResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Kết quả tính lại số dư công</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Số dư cũ:</span>
                <span className="font-medium">{recalculationResult.old_balance} giờ</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Số dư mới:</span>
                <span className="font-medium">{recalculationResult.new_balance} giờ</span>
              </div>
              
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-gray-600 font-medium">Chênh lệch:</span>
                <span className={`font-bold ${
                  recalculationResult.difference > 0 
                    ? 'text-green-600' 
                    : recalculationResult.difference < 0 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                }`}>
                  {recalculationResult.difference > 0 ? '+' : ''}{recalculationResult.difference} giờ
                </span>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button buttonType="text" onClick={() => setShowRecalculateModal(false)}>
                Đóng
              </Button>
              {recalculationResult.difference !== 0 && (
                <Button onClick={handleConfirmRecalculation}>
                  Cập nhật số dư
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeDetail;