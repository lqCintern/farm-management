import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLaborRequests } from '@/services/labor/laborRequestService';
import { getFarmActivities } from '@/services/farming/farmService';
import { getExchangeSummary } from '@/services/labor/exchangeService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/formatters';
import LaborNavigation from '@/components/Labor/LaborNavigation';

import { LaborRequest } from '@/types/labor/laborRequest.types';
import { FarmActivity } from '@/types/labor/types';

interface ExchangeSummaryResponse {
  exchange_id: number;
  partner_household_id: number;
  partner_household_name: string;
  balance: string;
  last_transaction_date: string;
}

const LaborDashboard = () => {
  const [requests, setRequests] = useState<LaborRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LaborRequest[]>([]);
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<FarmActivity[]>([]);
  const [exchanges, setExchanges] = useState<ExchangeSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch labor requests
        const requestsResponse = await getLaborRequests();
        setRequests(requestsResponse.data);
        
        // Lọc các yêu cầu đang chờ xử lý
        const pending = requestsResponse.data.filter(
          req => req.status === 'pending'
        );
        setPendingRequests(pending);
        
        // Fetch farm activities
        const activitiesResponse = await getFarmActivities();
        setActivities(activitiesResponse.farm_activities);
        
        // Lọc các hoạt động sắp diễn ra (trong 7 ngày tới)
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);
        
        const upcoming = activitiesResponse.farm_activities.filter(activity => {
          const activityDate = new Date(activity.start_date);
          return activityDate >= today && activityDate <= nextWeek;
        });
        
        setUpcomingActivities(upcoming);
        
        // Fetch exchange summary
        try {
          const exchangeResponse = await getExchangeSummary();
          if (Array.isArray(exchangeResponse.data)) {
            setExchanges(exchangeResponse.data);
          }
        } catch (exchangeErr) {
          console.error('Error fetching exchange data:', exchangeErr);
          // Không set error vì đây không phải lỗi nghiêm trọng
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      </div>
    );
  }

  return (
    <div>
      <LaborNavigation />
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Tổng quan đổi công</h1>
          <p className="text-gray-500">Quản lý các yêu cầu đổi công và hoạt động liên quan</p>
        </div>
        
        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Link to="/labor/my-requests">
            <Card className="bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">📋</div>
                <h3 className="font-medium text-blue-800 mt-2">Yêu cầu của tôi</h3>
                <p className="text-sm text-blue-600">Xem yêu cầu đã tạo</p>
              </div>
            </Card>
          </Link>
          
          <Link to="/labor/participated-requests">
            <Card className="bg-green-50 hover:bg-green-100 transition-colors cursor-pointer">
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">🤝</div>
                <h3 className="font-medium text-green-800 mt-2">Đã tham gia</h3>
                <p className="text-sm text-green-600">Xem yêu cầu đã tham gia</p>
              </div>
            </Card>
          </Link>
          
          <Link to="/labor/public-requests">
            <Card className="bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer">
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">🔍</div>
                <h3 className="font-medium text-purple-800 mt-2">Tìm yêu cầu</h3>
                <p className="text-sm text-purple-600">Tham gia yêu cầu mới</p>
              </div>
            </Card>
          </Link>
          
          <Link to="/labor/requests/create">
            <Card className="bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer">
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">➕</div>
                <h3 className="font-medium text-orange-800 mt-2">Tạo yêu cầu</h3>
                <p className="text-sm text-orange-600">Tạo yêu cầu mới</p>
              </div>
            </Card>
          </Link>
          
          <Link to="/labor/exchanges">
            <Card className="bg-red-50 hover:bg-red-100 transition-colors cursor-pointer">
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">💰</div>
                <h3 className="font-medium text-red-800 mt-2">Dư nợ đổi công</h3>
                <p className="text-sm text-red-600">Xem số dư đổi công</p>
              </div>
            </Card>
          </Link>
        </div>
        
        {/* Thống kê */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-blue-50">
            <div className="p-4">
              <h3 className="text-lg font-medium text-blue-800">Tổng số yêu cầu</h3>
              <p className="text-3xl font-bold">{requests.length}</p>
            </div>
          </Card>
          
          <Card className="bg-yellow-50">
            <div className="p-4">
              <h3 className="text-lg font-medium text-yellow-800">Đang chờ</h3>
              <p className="text-3xl font-bold">
                {requests.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </Card>
          
          <Card className="bg-green-50">
            <div className="p-4">
              <h3 className="text-lg font-medium text-green-800">Đã chấp nhận</h3>
              <p className="text-3xl font-bold">
                {requests.filter(r => r.status === 'accepted').length}
              </p>
            </div>
          </Card>
          
          <Card className="bg-gray-50">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-800">Hoàn thành</h3>
              <p className="text-3xl font-bold">
                {requests.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </Card>
        </div>
        
        {/* Dư nợ đổi công */}
        {exchanges.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Cần chú ý trả công cho :</h2>
              <Link to="/labor/exchanges">
                <Button buttonType="text">Xem tất cả</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Yêu cầu đổi công đang chờ */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Yêu cầu đổi công đang chờ</h2>
              <Link to="/labor/requests">
                <Button buttonType="text">Xem tất cả</Button>
              </Link>
            </div>
            
            <Card>
              <div className="p-4">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    Không có yêu cầu đổi công nào đang chờ xử lý
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.slice(0, 5).map(request => (
                      <div key={request.id} className="p-3 border-b last:border-b-0">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{request.title}</h4>
                            <div className="text-sm text-gray-500">
                              {formatDate(request.start_date)} - {formatDate(request.end_date)}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <StatusBadge status={request.status} />
                            <Link to={`/labor/requests/${request.id}`} className="ml-3 text-blue-600 hover:text-blue-800">
                              Chi tiết
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
          
          {/* Hoạt động sắp diễn ra */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Hoạt động sắp diễn ra</h2>
              <Link to="/farm-activities">
                <Button buttonType="text">Xem tất cả</Button>
              </Link>
            </div>
            
            <Card>
              <div className="p-4">
                {upcomingActivities.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    Không có hoạt động nào trong 7 ngày tới
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingActivities.slice(0, 5).map(activity => (
                      <div key={activity.id} className="p-3 border-b last:border-b-0">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{activity.description}</h4>
                            <div className="text-sm text-gray-500">
                              {formatDate(activity.start_date)}
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <Link to={`/farm-activities/${activity.id}`} className="text-blue-600 hover:text-blue-800">
                              Chi tiết
                            </Link>
                            <Link to={{
                              pathname: "/labor/requests/create",
                            }}
                              state={{ fromActivity: activity }}
                              className="text-green-600 hover:text-green-800"
                            >
                              Tìm người làm
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaborDashboard;