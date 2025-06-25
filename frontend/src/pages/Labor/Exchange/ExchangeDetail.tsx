import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getExchangeDetails, 
  resetExchangeBalance, 
  adjustExchangeBalance,
  recalculateExchangeBalance 
} from '@/services/labor/exchangeService';
import { getCurrentHousehold } from '@/services/labor/householdService';
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
  labor_exchange_id: number;
  labor_assignment_id: number | null;
  hours: string;
  description: string;
  created_at: string;
  updated_at: string;
  worker_name?: string;
  work_date?: string;
  readable_description?: string;  // Thêm mô tả dễ đọc
  transaction_role?: 'requester' | 'provider' | 'other'; // Thêm vai trò trong giao dịch
  assignment_details?: {
    worker_name: string;
    work_date: string;
    hours_worked: string;
    request_title: string;
  };
  direction_info?: { // Add direction_info property
    requesting_household_id: number;
    requesting_household_name: string;
    providing_household_id: number;
    providing_household_name: string;
  };
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
  transactions?: Transaction[]; // Added transactions property
  partner_name: string;
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
  const [currentHousehold, setCurrentHousehold] = useState<{ id: number; name: string } | null>(null);
  
  useEffect(() => {
    const fetchDetail = async () => {
      if (!householdId) return;
      
      try {
        setLoading(true);
        // Lấy household hiện tại
        const householdRes: any = await getCurrentHousehold();
        setCurrentHousehold(householdRes.data || householdRes);
        // Lấy chi tiết exchange
        const response = await getExchangeDetails(parseInt(householdId));
        
        // Kiểm tra cấu trúc response và chuyển đổi nếu cần
        const typedResponse = response as { success: boolean; data: any };
        if (typedResponse.success && typedResponse.data) {
          // Cấu trúc response mới có thể là data.transactions
          if ((response as { data: { transactions: Transaction[] } }).data.transactions) {
            // Tạo cấu trúc compatible cho component từ dữ liệu transactions
            const partnerInfo: Transaction['direction_info'] = (response as { data: { transactions: Transaction[] } }).data.transactions[0]?.direction_info || {
              requesting_household_id: 0,
              requesting_household_name: "Unknown",
              providing_household_id: 0,
              providing_household_name: "Unknown",
            };
            
            const transformedData = {
              exchange: {
                id: (response as { data: { transactions: Transaction[] } }).data.transactions[0]?.labor_exchange_id || 0,
                household_a_id: partnerInfo.requesting_household_id || 0,
                household_b_id: partnerInfo.providing_household_id || 0,
                household_b_name: partnerInfo.providing_household_name || "Hộ không xác định",
                hours_balance: 0, // Sẽ tính toán từ transactions
                last_transaction_date: (response as { data: { transactions: Transaction[] } }).data.transactions[0]?.created_at || new Date().toISOString()
              },
              balance: 0, // Sẽ tính toán từ transactions
              direction: 'neutral',
              transactions: (response as { data: { transactions: Transaction[] } }).data.transactions,
              partner_name: (response as { data: { partner_name: string } }).data.partner_name || "Hộ không xác định"
            };
            
            // Tính tổng balance từ transactions
            const totalBalance = (response as { data: { transactions: Transaction[] } }).data.transactions.reduce((sum, tx) => {
              return sum + parseFloat(tx.hours || "0");
            }, 0);
            
            transformedData.balance = totalBalance;
            transformedData.exchange.hours_balance = totalBalance;
            transformedData.direction = (totalBalance > 0 ? 'positive' : 
                                       totalBalance < 0 ? 'negative' : 'neutral') as 'neutral' | 'positive' | 'negative';
            
            setExchangeDetail(transformedData as ExchangeDetail);
          } else {
            // Nếu response có định dạng cũ
            setExchangeDetail((response as { data: ExchangeDetail }).data);
          }
          
          setError(null);
        } else {
          throw new Error('Invalid response format');
        }
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
      await axios.post(`/controllers/api/v1/labor/exchanges/households/${householdId}/recalculate_hours`);
      
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

  // Cập nhật component hiển thị giao dịch
  const TransactionCard = ({ transaction }: { transaction: Transaction }) => {
    // Xác định vai trò từ direction_info
    const hours = parseFloat(transaction.hours);
    const isPositive = hours > 0;
    
    // Sử dụng direction_info để xác định vai trò nếu transaction_role chưa được thiết lập
    let transactionRole = transaction.transaction_role;
    if (!transactionRole && transaction.direction_info) {
      // Giả sử current_household_id là ID của hộ người dùng hiện tại
      // Bạn có thể lấy từ context hoặc props
      const currentHouseholdId = parseInt(householdId || '0');
      
      if (transaction.direction_info.requesting_household_id === currentHouseholdId) {
        transactionRole = 'requester';
      } else if (transaction.direction_info.providing_household_id === currentHouseholdId) {
        transactionRole = 'provider';
      } else {
        transactionRole = 'other';
      }
    }

    // Tạo readable description nếu chưa có
    let description = transaction.readable_description || transaction.description;
    if (!description && transaction.assignment_details) {
      const workerName = transaction.worker_name || transaction.assignment_details.worker_name;
      const workDate = transaction.work_date || transaction.assignment_details.work_date;
      
      if (transactionRole === 'requester') {
        description = `Bạn đã nhận ${Math.abs(hours)} giờ công từ ${workerName} vào ${new Date(workDate).toLocaleDateString('vi-VN')}`;
      } else if (transactionRole === 'provider') {
        description = `${workerName} đã cung cấp ${Math.abs(hours)} giờ công vào ${new Date(workDate).toLocaleDateString('vi-VN')}`;
      } else {
        description = transaction.description || `Giao dịch ${Math.abs(hours)} giờ công`;
      }
    }

    return (
      <div className="border-b pb-4 mb-4">
        <div className="flex justify-between">
          <div className="text-sm text-gray-500">
            {new Date(transaction.created_at).toLocaleDateString('vi-VN')}
          </div>
          <div className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{transaction.hours} giờ
          </div>
        </div>
        
        <div className="mt-1">{description}</div>
        
        {transactionRole && (
          <div className={`mt-1 text-sm ${
            transactionRole === 'requester' ? 'text-blue-500' : 
            transactionRole === 'provider' ? 'text-green-500' : ''
          }`}>
            {transactionRole === 'requester' ? '(Bạn yêu cầu công)' : 
             transactionRole === 'provider' ? '(Bạn cung cấp công)' : ''}
          </div>
        )}
        
        {transaction.assignment_details && (
          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <div>Công việc: {transaction.assignment_details.request_title}</div>
            {transaction.assignment_details.work_date && (
              <div>Ngày làm việc: {new Date(transaction.assignment_details.work_date).toLocaleDateString('vi-VN')}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Sửa lại tên đối tác: luôn lấy partner_name từ response
  const getPartnerName = () => {
    if (!exchangeDetail) return '';
    // Nếu partner_name là household hiện tại thì ghi rõ "Nhà mình", còn lại thì lấy partner_name
    if (currentHousehold && exchangeDetail.partner_name === currentHousehold.name) {
      return 'Nhà mình';
    }
    return exchangeDetail.partner_name;
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
              <h1 className="text-2xl font-bold">Chi tiết đổi công với {getPartnerName()}</h1>
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      buttonType="primary" 
                      onClick={() => setShowAdjustModal(true)}
                      title="Điều chỉnh số dư giờ công"
                    >
                      Điều chỉnh số dư
                    </Button>
                    
                    <Button 
                      buttonType="secondary"
                      onClick={handleRecalculate}
                      disabled={processingAction}
                      title="Tính lại số dư từ lịch sử giao dịch"
                    >
                      Tính lại số dư
                    </Button>
                    
                    <Button 
                      buttonType="danger"
                      onClick={() => setShowResetConfirm(true)}
                      disabled={exchangeDetail.balance === 0}
                      title="Xóa toàn bộ số dư hiện tại"
                    >
                      Xóa số dư
                    </Button>

                    <Button 
                      buttonType="primary"
                      onClick={recalculateHoursWorked}
                      title="Tính lại giờ công từ thời gian làm việc đã ghi nhận"
                    >
                      Tính lại giờ công
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Thêm hiển thị lịch sử chi tiết */}
          {exchangeDetail && exchangeDetail.detailed_history && exchangeDetail.detailed_history.length > 0 ? (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Lịch sử chi tiết theo yêu cầu</h3>
              <div className="space-y-4">
                {exchangeDetail.detailed_history.map((item) => (
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
          ) : (
            // Hiển thị thông báo hoặc tạo detailed history từ transactions
            <div className="mt-6">
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Chi tiết yêu cầu đổi công</h3>
                  {exchangeDetail && exchangeDetail.transactions && exchangeDetail.transactions.length > 0 ? (
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">
                        {exchangeDetail.transactions[0].assignment_details?.request_title || 'Giao dịch đổi công'}
                      </h4>
                      <div className="text-sm mb-3">
                        <span className="font-medium">Yêu cầu:</span> {
                          (() => {
                            const tx = exchangeDetail.transactions[0];
                            if (!tx.direction_info || !currentHousehold) return 'Không xác định';
                            return tx.direction_info.requesting_household_id === currentHousehold.id
                              ? 'Nhà mình'
                              : tx.direction_info.requesting_household_name;
                          })()
                        } → 
                        <span className="font-medium">Cung cấp:</span> {
                          (() => {
                            const tx = exchangeDetail.transactions[0];
                            if (!tx.direction_info || !currentHousehold) return 'Không xác định';
                            return tx.direction_info.providing_household_id === currentHousehold.id
                              ? 'Nhà mình'
                              : tx.direction_info.providing_household_name;
                          })()
                        }
                      </div>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Người lao động</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ngày làm việc</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Giờ công</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mô tả</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {exchangeDetail.transactions.map((tx) => (
                            <tr key={tx.id}>
                              <td className="px-4 py-2">{tx.worker_name || tx.assignment_details?.worker_name || 'Không xác định'}</td>
                              <td className="px-4 py-2">
                                {tx.work_date || tx.assignment_details?.work_date ? 
                                  new Date(tx.work_date || tx.assignment_details?.work_date || '').toLocaleDateString('vi-VN') : 
                                  'Không xác định'}
                              </td>
                              <td className="px-4 py-2">{tx.hours} giờ</td>
                              <td className="px-4 py-2">{tx.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Chưa có thông tin chi tiết về các yêu cầu đổi công giữa hai hộ.
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Cập nhật phần hiển thị transactions */}
          {exchangeDetail && exchangeDetail.transactions && exchangeDetail.transactions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Các giao dịch gần đây</h3>
              <Card>
                <div className="p-4">
                  {exchangeDetail.transactions.map(transaction => (
                    <TransactionCard key={transaction.id} transaction={transaction} />
                  ))}
                  
                  <div className="text-center mt-4">
                    <Button 
                      buttonType="text"
                      onClick={() => navigate(`/labor/exchanges/${householdId}/history`)}
                    >
                      Xem tất cả giao dịch
                    </Button>
                  </div>
                </div>
              </Card>
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