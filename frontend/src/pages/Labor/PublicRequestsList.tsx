import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublicRequests } from '@/services/labor/laborRequestService';
import { LaborRequest } from '@/types/labor/laborRequest.types';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { formatDate } from '@/utils/formatters';

const PublicRequestsList = () => {
  const [publicRequests, setPublicRequests] = useState<LaborRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [excludeJoined, setExcludeJoined] = useState<boolean>(true);

  useEffect(() => {
    loadPublicRequests();
  }, [excludeJoined]);

  const loadPublicRequests = async () => {
    try {
      setLoading(true);
      const response = await getPublicRequests(excludeJoined);
      setPublicRequests(response.data);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách yêu cầu công khai. Vui lòng thử lại sau.');
      console.error('Error loading public requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExcludeJoined = () => {
    setExcludeJoined(!excludeJoined);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Yêu cầu đổi công công khai</h1>
        <div className="flex gap-4 items-center">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="excludeJoined"
              checked={excludeJoined}
              onChange={toggleExcludeJoined}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="excludeJoined" className="ml-2 text-sm text-gray-900">
              Ẩn các yêu cầu đã tham gia
            </label>
          </div>
          <Link to="/labor/requests">
            <Button buttonType="secondary">Quay lại danh sách</Button>
          </Link>
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
      ) : publicRequests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Không có yêu cầu công khai nào phù hợp.</p>
          <Button className="mt-4" onClick={() => setExcludeJoined(false)}>
            Hiện tất cả yêu cầu
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicRequests.map(request => (
            <Card key={request.id} className="hover:shadow-lg transition-all duration-300">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{request.title}</h3>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full">
                    Công khai
                  </span>
                </div>

                <p className="text-gray-600 line-clamp-2 mt-2">{request.description}</p>

                <div className="mt-4 text-sm">
                  <p className="mb-1"><span className="text-gray-500">Yêu cầu bởi:</span> {request.requesting_household?.name}</p>
                  <p><span className="text-gray-500">Số người cần:</span> {request.workers_needed}</p>
                </div>

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

                <div className="mt-4 flex justify-end gap-2">
                  <Link to={`/labor/requests/${request.id}`}>
                    <Button>Xem chi tiết</Button>
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

export default PublicRequestsList;
