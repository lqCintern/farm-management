import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLaborRequestById } from '@/services/labor/laborRequestService';
import { createAssignment } from '@/services/labor/assignmentService';
import { getHouseholdWorkers } from '@/services/labor/householdService';
import { DatePicker } from '@/components/common/DatePicker';
import { TimePicker } from '@/components/common/TimePicker';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Checkbox from '@/components/common/Checkbox';
import { formatDate } from '@/utils/formatters';

interface Worker {
  id: number;
  name: string;
  relationship: string;
  skills: string[];
  selected: boolean;
}

const LaborAssignment = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form values
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);
  const [isBatchAssign, setIsBatchAssign] = useState<boolean>(false);
  const [workDate, setWorkDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [dateRange, setDateRange] = useState<{start: string; end: string}>({start: '', end: ''});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Lấy thông tin chi tiết yêu cầu
        const requestResponse = await getLaborRequestById(parseInt(requestId || '0'));
        setRequest(requestResponse.data);
        
        // Đặt giá trị mặc định từ thông tin yêu cầu
        setWorkDate(requestResponse.data.start_date);
        if (requestResponse.data.start_time) {
          setStartTime(requestResponse.data.start_time.substring(11, 16));
        }
        if (requestResponse.data.end_time) {
          setEndTime(requestResponse.data.end_time.substring(11, 16));
        }
        setDateRange({
          start: requestResponse.data.start_date,
          end: requestResponse.data.end_date
        });
        
        // Lấy danh sách workers trong household
        const workersResponse = await getHouseholdWorkers();
        // Type assertion to fix 'unknown' type error
        const workersData = (workersResponse as { data: any[] }).data;
        setWorkers(workersData.map((worker: any) => ({
          ...worker,
          selected: false
        })));
        
      } catch (error: any) {
        setError(error.response?.data?.message || 'Không thể tải thông tin yêu cầu và người lao động.');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [requestId]);

  const toggleWorkerSelection = (workerId: number) => {
    setWorkers(workers.map(worker => 
      worker.id === workerId 
        ? { ...worker, selected: !worker.selected }
        : worker
    ));
    
    setSelectedWorkers(prev => {
      if (prev.includes(workerId)) {
        return prev.filter(id => id !== workerId);
      } else {
        return [...prev, workerId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedWorkers.length === 0) {
      setError('Vui lòng chọn ít nhất một người lao động.');
      return;
    }
    
    if (!workDate || !startTime || !endTime) {
      setError('Vui lòng điền đầy đủ thông tin ngày và giờ làm việc.');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const payload = isBatchAssign 
        ? {
            request_id: parseInt(requestId || '0'),
            worker_ids: selectedWorkers,
            date_range: dateRange,
            start_time: startTime,
            end_time: endTime,
            notes
          }
        : {
            request_id: parseInt(requestId || '0'),
            worker_ids: selectedWorkers,
            work_date: workDate,
            start_time: startTime,
            end_time: endTime,
            notes
          };
      
      await createAssignment(parseInt(requestId || '0'), payload);
      
      // Chuyển hướng đến trang chi tiết yêu cầu sau khi thành công
      navigate(`/labor/requests/${requestId}`, { 
        state: { 
          success: true, 
          message: 'Đã phân công người lao động thành công!' 
        } 
      });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi phân công. Vui lòng thử lại.');
      console.error('Error assigning workers:', error);
    } finally {
      setSubmitting(false);
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
        <Button onClick={() => navigate(`/labor/requests/${requestId}`)}>
          Quay lại chi tiết yêu cầu
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Phân công người lao động</h1>
          <p className="text-gray-600">Yêu cầu: {request?.title}</p>
        </div>
        <Button buttonType="text" onClick={() => navigate(`/labor/requests/${requestId}`)}>
          ← Quay lại chi tiết
        </Button>
      </div>

      <Card className="mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Thông tin yêu cầu</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><span className="font-medium">Tiêu đề:</span> {request?.title}</p>
              <p><span className="font-medium">Mô tả:</span> {request?.description}</p>
              <p><span className="font-medium">Số người cần:</span> {request?.workers_needed}</p>
            </div>
            <div>
              <p><span className="font-medium">Thời gian:</span> {formatDate(request?.start_date)} - {formatDate(request?.end_date)}</p>
              {request?.start_time && request?.end_time && (
                <p><span className="font-medium">Giờ làm:</span> {request?.start_time.substring(11, 16)} - {request?.end_time.substring(11, 16)}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-semibold mb-4">Chọn người lao động</h2>
          
          {workers.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-4 mb-6">
              Chưa có người lao động trong hộ của bạn. Hãy thêm thành viên vào hộ trước khi phân công.
            </div>
          ) : (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workers.map(worker => (
                  <div 
                    key={worker.id}
                    className={`border p-4 rounded-lg cursor-pointer transition-all ${
                      worker.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => toggleWorkerSelection(worker.id)}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{worker.name}</h3>
                      <Checkbox 
                        checked={worker.selected} 
                        onChange={() => toggleWorkerSelection(worker.id)}
                      />
                    </div>
                    <p className="text-sm text-gray-500">Quan hệ: {worker.relationship}</p>
                    {worker.skills && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 mb-1">Kỹ năng:</p>
                        <div className="flex flex-wrap gap-1">
                            {(typeof worker.skills === 'string' 
                            ? JSON.parse(worker.skills as string) as string[] 
                            : (worker.skills || [])
                            ).map((skill: string, index: number) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                            >
                              {skill}
                            </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 text-sm text-gray-500">
                Đã chọn {selectedWorkers.length} / {workers.length} người lao động
              </div>
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Thông tin phân công</h2>
            
            <div className="mb-4">
              <label className="flex items-center">
                <Checkbox 
                  checked={isBatchAssign}
                  onChange={() => setIsBatchAssign(!isBatchAssign)}
                />
                <span className="ml-2">Phân công theo khoảng thời gian</span>
              </label>
              <p className="text-sm text-gray-500 ml-6 mt-1">
                Chọn tùy chọn này để phân công người lao động cho nhiều ngày trong khoảng thời gian
              </p>
            </div>
            
            {isBatchAssign ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Từ ngày
                  </label>
                  <DatePicker
                    value={dateRange.start}
                    onChange={(date) => setDateRange({...dateRange, start: date})}
                    minDate={request?.start_date}
                    maxDate={request?.end_date}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đến ngày
                  </label>
                  <DatePicker
                    value={dateRange.end}
                    onChange={(date) => setDateRange({...dateRange, end: date})}
                    minDate={dateRange.start || request?.start_date}
                    maxDate={request?.end_date}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày làm việc
                </label>
                <DatePicker
                  value={workDate}
                  onChange={setWorkDate}
                  minDate={request?.start_date}
                  maxDate={request?.end_date}
                />
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giờ bắt đầu
                </label>
                <TimePicker
                  value={startTime}
                  onChange={setStartTime}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giờ kết thúc
                </label>
                <TimePicker
                  value={endTime}
                  onChange={setEndTime}
                  minTime={startTime}
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ghi chú (tùy chọn)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="border border-gray-300 rounded-md w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Nhập ghi chú cho người lao động..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              buttonType="secondary"
              onClick={() => navigate(`/labor/requests/${requestId}`)}
            >
              Hủy
            </Button>
            <Button
              buttonType="primary"
              htmlType ="submit"
              disabled={submitting || workers.length === 0 || selectedWorkers.length === 0}
            >
              {submitting ? 'Đang xử lý...' : 'Phân công người lao động'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default LaborAssignment;