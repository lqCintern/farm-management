import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLaborRequests } from '@/services/labor/laborRequestService';
import { getFarmActivities } from '@/services/farming/farmService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/formatters';

import { LaborRequest } from '@/types/labor/laborRequest.types';
import { FarmActivity } from '@/types/labor/types';

const LaborDashboard = () => {
  const [requests, setRequests] = useState<LaborRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<LaborRequest[]>([]);
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<FarmActivity[]>([]);
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
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Tổng quan đổi công</h1>
        <p className="text-gray-500">Quản lý các yêu cầu đổi công và hoạt động liên quan</p>
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
  );
};

export default LaborDashboard;