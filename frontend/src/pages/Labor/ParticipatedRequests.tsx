import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getParticipatedRequests, acceptRequest, declineRequest, completeRequest } from '@/services/labor/laborRequestService';
import { LaborRequest } from '@/types/labor/laborRequest.types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/formatters';
import ConfirmModal from '@/components/common/ConfirmModal';
import LaborNavigation from '@/components/Labor/LaborNavigation';

const ParticipatedRequests = () => {
  const [requests, setRequests] = useState<LaborRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LaborRequest | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'decline' | 'complete'>('accept');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      const response = await getParticipatedRequests(params);
      setRequests(response.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest) return;

    try {
      let result;
      switch (actionType) {
        case 'accept':
          result = await acceptRequest(selectedRequest.id);
          break;
        case 'decline':
          result = await declineRequest(selectedRequest.id);
          break;
        case 'complete':
          result = await completeRequest(selectedRequest.id);
          break;
      }

      // Cập nhật request trong danh sách
      setRequests(requests.map(req => 
        req.id === selectedRequest.id 
          ? { ...req, status: result.data.request.status }
          : req
      ));

      setActionModalOpen(false);
      setSelectedRequest(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi thực hiện hành động');
    }
  };

  const openActionModal = (request: LaborRequest, action: 'accept' | 'decline' | 'complete') => {
    setSelectedRequest(request);
    setActionType(action);
    setActionModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ phản hồi';
      case 'accepted': return 'Đã chấp nhận';
      case 'declined': return 'Đã từ chối';
      case 'completed': return 'Đã hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'accept': return 'Chấp nhận yêu cầu';
      case 'decline': return 'Từ chối yêu cầu';
      case 'complete': return 'Hoàn thành yêu cầu';
      default: return 'Thực hiện hành động';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div>
      <LaborNavigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Yêu cầu tôi tham gia</h1>
          <Link to="/labor/public">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Tìm yêu cầu mới
            </Button>
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ phản hồi</option>
            <option value="accepted">Đã chấp nhận</option>
            <option value="declined">Đã từ chối</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        {requests.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Bạn chưa tham gia yêu cầu nào</p>
              <Link to="/labor/public">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Tìm yêu cầu để tham gia
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {request.title}
                      </h3>
                      <StatusBadge 
                        status={request.status} 
                        color={getStatusColor(request.status)}
                      >
                        {getStatusText(request.status)}
                      </StatusBadge>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{request.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Ngày bắt đầu:</span>
                        <br />
                        {formatDate(request.start_date)}
                      </div>
                      <div>
                        <span className="font-medium">Ngày kết thúc:</span>
                        <br />
                        {formatDate(request.end_date)}
                      </div>
                      <div>
                        <span className="font-medium">Số người cần:</span>
                        <br />
                        {request.workers_needed || 'Không xác định'}
                      </div>
                      <div>
                        <span className="font-medium">Loại yêu cầu:</span>
                        <br />
                        {request.request_type === 'exchange' ? 'Đổi công' : 
                         request.request_type === 'paid' ? 'Trả tiền' : 'Hỗn hợp'}
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-gray-50 rounded">
                      <span className="font-medium text-gray-800">
                        Yêu cầu từ: {request.requesting_household_name || 'Không xác định'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Link to={`/labor/requests/${request.id}`}>
                      <Button className="bg-gray-600 hover:bg-gray-700 text-white">
                        Xem chi tiết
                      </Button>
                    </Link>
                    
                    {request.status === 'pending' && (
                      <div className="flex flex-col gap-2">
                        <Button 
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => openActionModal(request, 'accept')}
                        >
                          Chấp nhận
                        </Button>
                        <Button 
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => openActionModal(request, 'decline')}
                        >
                          Từ chối
                        </Button>
                      </div>
                    )}

                    {request.status === 'accepted' && (
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => openActionModal(request, 'complete')}
                      >
                        Hoàn thành
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <ConfirmModal
          isOpen={actionModalOpen}
          onClose={() => setActionModalOpen(false)}
          onConfirm={handleAction}
          title={getActionText(actionType)}
          message={`Bạn có chắc chắn muốn ${actionType === 'accept' ? 'chấp nhận' : actionType === 'decline' ? 'từ chối' : 'hoàn thành'} yêu cầu "${selectedRequest?.title}"?`}
          confirmText={actionType === 'accept' ? 'Chấp nhận' : actionType === 'decline' ? 'Từ chối' : 'Hoàn thành'}
          cancelText="Hủy"
        />
      </div>
    </div>
  );
};

export default ParticipatedRequests; 