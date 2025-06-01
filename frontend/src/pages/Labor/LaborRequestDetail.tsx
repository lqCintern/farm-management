import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getLaborRequestById,
  getGroupStatus,
  acceptRequest,
  declineRequest,
  completeRequest,
  cancelRequest,
  joinRequest
} from '@/services/labor/laborRequestService';
import { getFarmActivityById } from '@/services/farming/farmService'; // Sử dụng service có sẵn
import { LaborRequest, GroupStatus } from '@/types/labor/laborRequest.types';
import { FarmActivity } from '@/types/labor/types'; // Import từ types có sẵn
import StatusBadge from '@/components/common/StatusBadge';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { formatDate } from '@/utils/formatters';
import ConfirmModal from '@/components/common/ConfirmModal';

const LaborRequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<LaborRequest | null>(null);
  const [farmActivity, setFarmActivity] = useState<FarmActivity | null>(null);
  const [groupStatus, setGroupStatus] = useState<GroupStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [currentActionTitle, setCurrentActionTitle] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    
    const fetchRequestDetails = async () => {
      try {
        setLoading(true);
        const response = await getLaborRequestById(parseInt(id));
        setRequest(response.data);
        
        console.log("Labor request data:", response.data); // Log toàn bộ dữ liệu
        console.log("Farm activity ID:", response.data.farm_activity_id); // Log farm_activity_id
        
        // Nếu có farm_activity_id, lấy thông tin về farm activity
        if (response.data.farm_activity_id) {
          try {
            console.log("Fetching farm activity with ID:", response.data.farm_activity_id);
            const activityResponse = await getFarmActivityById(response.data.farm_activity_id);
            console.log("Farm activity response:", activityResponse);
            if (activityResponse.data && typeof activityResponse.data === 'object' && 'data' in activityResponse.data) {
              setFarmActivity((activityResponse.data as { data: FarmActivity }).data);
            } else {
              console.error('Invalid response format for farm activity');
            }
          } catch (err) {
            console.error('Error loading farm activity', err);
          }
        } else {
          console.log("No farm_activity_id found in labor request");
        }
        
        // Nếu có request_group_id, tải thông tin nhóm
        if (response.data.request_group_id) {
          try {
            const groupResponse = await getGroupStatus(parseInt(id));
            setGroupStatus(groupResponse.data);
          } catch (err) {
            console.error('Error loading group status', err);
          }
        }
        
        setError(null);
      } catch (err) {
        setError('Không thể tải thông tin yêu cầu. Vui lòng thử lại sau.');
        console.error('Error loading request details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [id]);

  const handleAction = (action: string, actionTitle: string) => {
    setCurrentAction(action);
    setCurrentActionTitle(actionTitle);
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    if (!id || !currentAction) return;
    
    setProcessingAction(true);
    setError(null);
    setActionSuccess(null);
    
    try {
      let response: any;
      
      switch (currentAction) {
        case 'accept':
          response = await acceptRequest(parseInt(id));
          // Sau khi chấp nhận thành công, điều hướng người dùng đến trang assign worker
          if (response.data) {
            setActionSuccess('Đã chấp nhận yêu cầu. Chuyển đến trang phân công lao động...');
            // Delay một chút để người dùng thấy thông báo thành công
            setTimeout(() => {
              navigate(`/labor/requests/${id}/assign`);
            }, 1500);
            return; // Thêm return để tránh code bên dưới chạy
          }
          break;
        case 'decline':
          response = await declineRequest(parseInt(id));
          break;
        case 'complete':
          response = await completeRequest(parseInt(id));
          break;
        case 'cancel':
          response = await cancelRequest(parseInt(id));
          break;
        case 'join':
          response = await joinRequest(parseInt(id));
          
          // Nếu tham gia thành công, điều hướng đến request mới được tạo
          if (response.success) {
            setActionSuccess('Bạn đã tham gia thành công vào yêu cầu này.');
            setTimeout(() => {
              navigate(`/labor/requests/${response.data.id}`);
            }, 1500);
          }
          return;
        default:
          throw new Error('Hành động không được hỗ trợ');
      }
      
      // Cập nhật trạng thái request và group status nếu có
      if (response.data) {
        setRequest(response.data.request);
        if (response.data.group_status) {
          setGroupStatus(response.data.group_status);
        }
      }
      
      // Hiển thị thông báo thành công
      const successMessages: Record<string, string> = {
        'accept': 'Đã chấp nhận yêu cầu thành công',
        'decline': 'Đã từ chối yêu cầu thành công',
        'complete': 'Đã hoàn thành yêu cầu thành công',
        'cancel': 'Đã hủy yêu cầu thành công'
      };
      
      setActionSuccess(successMessages[currentAction]);
    } catch (err: any) {
      setError(err.response?.data?.message || `Không thể ${currentActionTitle} yêu cầu. Vui lòng thử lại sau.`);
      console.error(`Error ${currentAction} request:`, err);
    } finally {
      setProcessingAction(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Button buttonType="secondary" onClick={() => navigate('/labor/requests')}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-gray-500">Không tìm thấy yêu cầu.</p>
          <Button className="mt-4" onClick={() => navigate('/labor/requests')}>
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  // Map request status to label
  const statusLabels: Record<string, string> = {
    'pending': 'Đang chờ',
    'accepted': 'Đã chấp nhận',
    'declined': 'Đã từ chối',
    'completed': 'Đã hoàn thành',
    'cancelled': 'Đã hủy'
  };

  return (
    <div className="container mx-auto p-4">
      {actionSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {actionSuccess}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{request?.title}</h1>
          <div className="flex items-center mt-2">
            <StatusBadge status={request?.status || 'pending'} />
            {request?.is_public && (
              <span className="ml-2 bg-blue-100 text-blue-800 px-3 py-1 text-sm rounded-full">
                Yêu cầu công khai
              </span>
            )}
          </div>
        </div>
        <Button buttonType="text" onClick={() => navigate('/labor/requests')}>
          ← Quay lại danh sách
        </Button>
      </div>

      {/* Thông tin chi tiết */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Thông tin yêu cầu</h3>
            <div className="space-y-2">
              <p><span className="text-gray-500">Mô tả:</span> {request?.description}</p>
              <p><span className="text-gray-500">Số người cần:</span> {request?.workers_needed}</p>
              <p>
                <span className="text-gray-500">Loại yêu cầu:</span> {
                  request?.request_type === 'exchange' ? 'Đổi công' :
                  request?.request_type === 'paid' ? 'Trả công' : 'Kết hợp'
                }
              </p>
              {request?.rate && (
                <p><span className="text-gray-500">Giá công:</span> {request.rate.toLocaleString()} VND</p>
              )}
              <p>
                <span className="text-gray-500">Hộ yêu cầu:</span> {request?.requesting_household?.name}
              </p>
              {request?.providing_household && (
                <p>
                  <span className="text-gray-500">Hộ thực hiện:</span> {request.providing_household.name}
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Thời gian</h3>
            <div className="space-y-2">
              <p>
                <span className="text-gray-500">Thời gian:</span> {formatDate(request?.start_date || '')} - {formatDate(request?.end_date || '')}
              </p>
              {request?.start_time && request?.end_time && (
                <p>
                  <span className="text-gray-500">Giờ làm việc:</span> {request.start_time.substring(11, 16)} - {request.end_time.substring(11, 16)}
                </p>
              )}
              {request?.created_at && (
                <p>
                  <span className="text-gray-500">Ngày tạo:</span> {formatDate(request.created_at)}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Thêm card thông tin công việc nếu có farm_activity */}
      {farmActivity && (
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">
              Thông tin công việc nông nghiệp
              <span className="bg-purple-100 text-purple-800 px-3 py-1 text-sm rounded-full ml-2">
                {typeof farmActivity.activity_type === 'string' 
                  ? farmActivity.activity_type 
                  : `Hoạt động #${farmActivity.activity_type}`}
              </span>
            </h3>

            <div className="space-y-3">
              <p><span className="text-gray-500">Mô tả hoạt động:</span> {farmActivity.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <p><span className="text-gray-500">Ngày bắt đầu:</span> {formatDate(farmActivity.start_date)}</p>
                <p><span className="text-gray-500">Ngày kết thúc:</span> {formatDate(farmActivity.end_date)}</p>
                <p><span className="text-gray-500">Tần suất:</span> {farmActivity.frequency} ngày</p>
                <p>
                  <span className="text-gray-500">Trạng thái:</span> {
                    typeof farmActivity.status === 'string' ? 
                      farmActivity.status : 
                      farmActivity.status === 0 ? 'Chưa hoàn thành' : 'Đã hoàn thành'
                  }
                </p>
              </div>

              {farmActivity.materials && Object.keys(farmActivity.materials).length > 0 && (
                <div>
                  <h4 className="font-medium text-md mt-2 mb-1">Vật tư sử dụng:</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <ul className="list-disc pl-4">
                      {Object.entries(farmActivity.materials).map(([key, value]) => (
                        <li key={key}>{key}: {value}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              <p className="text-blue-600">
                <a href={`/farm-activities/${farmActivity.id}`} target="_blank" rel="noopener noreferrer">
                  Xem chi tiết hoạt động →
                </a>
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Thông tin nhóm */}
      {groupStatus && (
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Thông tin nhóm yêu cầu</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="border rounded-lg p-3">
                <div className="text-2xl font-bold">{groupStatus.total}</div>
                <div className="text-sm text-gray-500">Tổng số</div>
              </div>
              <div className="border rounded-lg p-3 bg-yellow-50">
                <div className="text-2xl font-bold text-yellow-700">{groupStatus.pending}</div>
                <div className="text-sm text-gray-500">Đang chờ</div>
              </div>
              <div className="border rounded-lg p-3 bg-green-50">
                <div className="text-2xl font-bold text-green-700">{groupStatus.accepted}</div>
                <div className="text-sm text-gray-500">Đã chấp nhận</div>
              </div>
              <div className="border rounded-lg p-3 bg-red-50">
                <div className="text-2xl font-bold text-red-700">{groupStatus.declined}</div>
                <div className="text-sm text-gray-500">Đã từ chối</div>
              </div>
              {groupStatus.completed !== undefined && (
                <div className="border rounded-lg p-3 bg-blue-50">
                  <div className="text-2xl font-bold text-blue-700">{groupStatus.completed}</div>
                  <div className="text-sm text-gray-500">Đã hoàn thành</div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Các thao tác */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Thao tác</h3>

          <div className="flex flex-wrap gap-3">
            {/* Nút chấp nhận yêu cầu (cho provider) */}
            {request.status === 'pending' && request.providing_household_id && (
              <Button
                buttonType="success"
                onClick={() => handleAction('accept', 'chấp nhận')}
                disabled={processingAction}
              >
                Chấp nhận
              </Button>
            )}

            {/* Nút từ chối yêu cầu (cho provider) */}
            {request.status === 'pending' && request.providing_household_id && (
              <Button
                buttonType="danger"
                onClick={() => handleAction('decline', 'từ chối')}
                disabled={processingAction}
              >
                Từ chối
              </Button>
            )}

            {/* Nút hoàn thành yêu cầu (cho requester khi đã được chấp nhận) */}
            {request.status === 'accepted' && (
              <Button
                buttonType="primary"
                onClick={() => handleAction('complete', 'hoàn thành')}
                disabled={processingAction}
              >
                Hoàn thành
              </Button>
            )}

            {/* Nút hủy yêu cầu (cho requester) */}
            {['pending', 'accepted'].includes(request.status) && (
              <Button
                buttonType="secondary"
                onClick={() => handleAction('cancel', 'hủy')}
                disabled={processingAction}
              >
                Hủy yêu cầu
              </Button>
            )}

            {/* Nút tham gia yêu cầu công khai */}
            {request.is_public && request.status === 'pending' && !request.providing_household_id && (
              <Button
                buttonType="primary"
                onClick={() => handleAction('join', 'tham gia')}
                disabled={processingAction}
              >
                Tham gia
              </Button>
            )}
          </div>
        </div>
      </Card>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeAction}
        title={`Xác nhận ${currentActionTitle}`}
        message={`Bạn có chắc chắn muốn ${currentActionTitle} yêu cầu này không?`}
        confirmText={currentActionTitle}
        loading={processingAction}
      />
    </div>
  );
};

export default LaborRequestDetail;
