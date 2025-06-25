import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLaborRequestById } from '@/services/labor/laborRequestService';
import { createAssignment, batchAssignWorkers } from '@/services/labor/assignmentService';
import { getHouseholdWorkers } from '@/services/labor/householdService';
import { checkScheduleConflicts } from '@/services/labor/assignmentService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

// Simple date formatting function (YYYY-MM-DD to DD/MM/YYYY)
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

interface Worker {
  id: number; // household_worker.id
  worker_id: number; // user_id
  name: string;
  skills: string[];
  availability: string;
}

const CreateAssignment = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const [laborRequest, setLaborRequest] = useState<any>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkers, setSelectedWorkers] = useState<number[]>([]);
  const [workDate, setWorkDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!requestId) return;
      
      try {
        setLoading(true);
        
        // Fetch request details
        const requestResponse = await getLaborRequestById(parseInt(requestId));
        setLaborRequest(requestResponse.data);
        
        // Set default values from request
        if (requestResponse.data) {
          setWorkDate(requestResponse.data.start_date);
          setDateRange({
            start: requestResponse.data.start_date,
            end: requestResponse.data.end_date
          });
          
          const defaultStart = new Date(`${requestResponse.data.start_date}T09:00:00`);
          const defaultEnd = new Date(`${requestResponse.data.start_date}T17:00:00`);
          
          setStartTime(defaultStart.toTimeString().substring(0, 5));
          setEndTime(defaultEnd.toTimeString().substring(0, 5));
        }
        
        // Fetch available workers
        const workersResponse = await getHouseholdWorkers() as { data?: Worker[] };
        if (workersResponse.data) {
          setWorkers(workersResponse.data);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [requestId]);

  const toggleWorkerSelection = (workerUserId: number) => {
    if (selectedWorkers.includes(workerUserId)) {
      setSelectedWorkers(selectedWorkers.filter(id => id !== workerUserId));
    } else {
      setSelectedWorkers([...selectedWorkers, workerUserId]);
    }
  };

  const checkForConflicts = async (workerId: number) => {
    if (!workDate || !startTime || !endTime) return;
    
    try {
      const response = await checkScheduleConflicts(
        workerId,
        workDate,
        `${workDate}T${startTime}:00`,
        `${workDate}T${endTime}:00`
      ) as { data: { has_conflict: boolean; conflicts: any[] } };
      
      if (response.data.has_conflict) {
        setConflicts(response.data.conflicts);
      } else {
        setConflicts([]);
      }
    } catch (err) {
      console.error('Error checking conflicts:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedWorkers.length === 0) {
      setError('Vui lòng chọn ít nhất một người lao động');
      return;
    }
    
    try {
      setSubmitting(true);
      
      if (isBatchMode) {
        // Batch assign for multiple dates
        await batchAssignWorkers(
          parseInt(requestId!),
          {
            worker_ids: selectedWorkers,
            date_range: {
              start_date: dateRange.start,
              end_date: dateRange.end
            },
            start_time: startTime,
            end_time: endTime,
            notes
          }
        );
      } else {
        // Single assignment
        for (const workerId of selectedWorkers) {
          await createAssignment(
                      parseInt(requestId!),
                      {
                        worker_id: workerId,
                        work_date: workDate,
                        start_time: `${workDate}T${startTime}:00`,
                        end_time: `${workDate}T${endTime}:00`,
                        notes
                      }
                    );
        }
      }
      
      navigate(`/labor/requests/${requestId}`);
    } catch (err) {
      console.error('Error creating assignment:', err);
      setError('Không thể tạo phân công. Vui lòng thử lại sau.');
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

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Phân công người lao động</h1>
        {laborRequest && (
          <p className="text-gray-500">
            Yêu cầu: {laborRequest.title} 
            ({formatDate(laborRequest.start_date)} - {formatDate(laborRequest.end_date)})
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium">Chọn thời gian làm việc</h3>
                  <div className="flex items-center">
                    <span className="mr-2 text-sm text-gray-600">Phân công hàng loạt</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isBatchMode} 
                        onChange={() => setIsBatchMode(!isBatchMode)} 
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {isBatchMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                        min={laborRequest?.start_date}
                        max={laborRequest?.end_date}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                        min={dateRange.start}
                        max={laborRequest?.end_date}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày làm việc</label>
                    <input
                      type="date"
                      value={workDate}
                      onChange={(e) => setWorkDate(e.target.value)}
                      min={laborRequest?.start_date}
                      max={laborRequest?.end_date}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Thêm ghi chú về công việc..."
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button 
                  buttonType="text" 
                  onClick={() => navigate(`/labor/requests/${requestId}`)}
                  disabled={submitting}
                >
                  Hủy
                </Button>
                <Button 
                  disabled={submitting || selectedWorkers.length === 0}
                >
                  {submitting ? 'Đang xử lý...' : 'Phân công'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
        
        <div>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Người lao động khả dụng</h3>
              
              {workers.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  Không có người lao động nào
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {workers.map((worker) => (
                    <div
                      key={worker.worker_id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedWorkers.includes(worker.worker_id) 
                          ? 'bg-blue-50 border-blue-300' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleWorkerSelection(worker.worker_id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{worker.name}</h4>
                          {worker.skills && worker.skills.length > 0 && (
                            <div className="flex flex-wrap mt-1">
                              {worker.skills.map((skill, index) => (
                                <span 
                                  key={index} 
                                  className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded mr-1 mb-1"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedWorkers.includes(worker.worker_id)}
                          onChange={() => toggleWorkerSelection(worker.worker_id)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      
                      {!isBatchMode && selectedWorkers.includes(worker.worker_id) && (
                        <button 
                          type="button"
                          className="text-sm text-blue-600 hover:text-blue-800 mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            checkForConflicts(worker.worker_id);
                          }}
                        >
                          Kiểm tra xung đột lịch
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {conflicts.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-red-600 mb-2">
                    Phát hiện xung đột lịch!
                  </h4>
                  <ul className="text-xs text-red-500 space-y-1">
                    {conflicts.map((conflict, index) => (
                      <li key={index}>
                        • {conflict.work_date}: {conflict.start_time.substring(11, 16)} - {conflict.end_time.substring(11, 16)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-500">
                Đã chọn {selectedWorkers.length} người lao động
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignment;