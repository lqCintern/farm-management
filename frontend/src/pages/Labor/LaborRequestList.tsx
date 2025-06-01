import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLaborRequests } from '@/services/labor/laborRequestService';
import { LaborRequest } from '@/types/labor/laborRequest.types';
import StatusBadge from '@/components/common/StatusBadge';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { formatDate } from '@/utils/formatters';

const LaborRequestList = () => {
  const [requests, setRequests] = useState<LaborRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    requestType: '',
  });

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        const response = await getLaborRequests(filters);
        setRequests(response.data);
        setError(null);
      } catch (err) {
        setError('Không thể tải danh sách yêu cầu đổi công. Vui lòng thử lại sau.');
        console.error('Error fetching labor requests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [filters]);

const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      status: name === 'status' ? value : prev.status,
      requestType: name === 'requestType' ? value : prev.requestType,
    }));
};

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Yêu cầu đổi công</h1>
        <div className="flex gap-4">
          <Link to="/labor/public-requests">
            <Button buttonType="secondary">Xem yêu cầu công khai</Button>
          </Link>
          <Link to="/labor/requests/create">
            <Button>Tạo yêu cầu mới</Button>
          </Link>
        </div>
      </div>

      {/* Thêm phần lọc */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select 
              name="status" 
              value={filters.status} 
              onChange={handleFilterChange}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              <option value="pending">Đang chờ</option>
              <option value="accepted">Đã chấp nhận</option>
              <option value="declined">Đã từ chối</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại yêu cầu</label>
            <select 
              name="requestType" 
              value={filters.requestType} 
              onChange={handleFilterChange}
              className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Tất cả</option>
              <option value="exchange">Đổi công</option>
              <option value="paid">Trả công</option>
              <option value="mixed">Kết hợp</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Chưa có yêu cầu đổi công nào.</p>
          <Link to="/labor/requests/create" className="mt-4 inline-block">
            <Button>Tạo yêu cầu đổi công</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {requests.map(request => (
            <Card key={request.id} className="hover:shadow-lg transition-all duration-300">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{request.title}</h3>
                  <div className="flex gap-2">
                    <StatusBadge status={request.status} />
                    {request.is_public && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full">
                        Công khai
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 line-clamp-2 mt-2">{request.description}</p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Bắt đầu:</span>
                    <div>{formatDate(request.start_date)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Kết thúc:</span>
                    <div>{formatDate(request.end_date)}</div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Link to={`/labor/requests/${request.id}`} className="text-blue-600 hover:text-blue-800">
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LaborRequestList;