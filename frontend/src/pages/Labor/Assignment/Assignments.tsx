import { useState, useEffect } from 'react';
import { getHouseholdAssignments, getWorkerAssignments, completeAssignment, missedAssignment, updateLaborRequestStatus, completeMultipleAssignments, reportAssignmentCompletion, rejectAssignment } from '@/services/labor/assignmentService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate, formatTime } from '@/utils/formatters';
import { Tab } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import ConfirmModal from '@/components/common/ConfirmModal';
import LaborNavigation from '@/components/Labor/LaborNavigation';

const Assignments = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<'complete' | 'missed' | 'report_completion' | 'reject' | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<any | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [hoursWorked, setHoursWorked] = useState<string>('');
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
  const [userType, setUserType] = useState<'farmer' | 'worker'>('farmer');

  useEffect(() => {
    // Xác định loại user dựa trên context hoặc localStorage
    const storedUserType = localStorage.getItem('userType') || 'farmer';
    console.log('Stored userType:', storedUserType);
    setUserType(storedUserType as 'farmer' | 'worker');
    fetchAssignments(storedUserType as 'farmer' | 'worker');
  }, []);

  const fetchAssignments = async (type: 'farmer' | 'worker') => {
    try {
      setLoading(true);
      console.log('Fetching assignments for userType:', type);
      
      const response = type === 'farmer' 
        ? await getHouseholdAssignments()
        : await getWorkerAssignments();
      
      console.log('API Response:', response);
      setAssignments((response as { data: any[] }).data);
      setError(null);
    } catch (err) {
      console.error('Error fetching assignments:', err);
      setError('Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: 'complete' | 'missed' | 'report_completion' | 'reject', assignment: any) => {
    setCurrentAction(action);
    setCurrentAssignment(assignment);
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!currentAssignment || !currentAction) return;

    try {
      if (currentAction === 'complete') {
        await completeAssignment(currentAssignment.id, { 
          notes: actionNotes,
          hours_worked: hoursWorked ? parseFloat(hoursWorked) : undefined 
        });
        toast.success('Đã xác nhận hoàn thành công việc!');
        
        // Nếu đây là công việc cuối cùng trong yêu cầu, hỏi xem có muốn đánh dấu yêu cầu hoàn thành không
        const request = currentAssignment.labor_request;
        if (request) {
          const pendingAssignments = assignments.filter(a => 
            a.labor_request_id === request.id && 
            !['completed', 'rejected', 'missed'].includes(a.status)
          );
          
          if (pendingAssignments.length <= 1) {
            if (window.confirm('Đây có vẻ là công việc cuối cùng trong yêu cầu. Bạn có muốn đánh dấu yêu cầu đã hoàn thành?')) {
              await updateLaborRequestStatus(request.id, 'completed');
              toast.success('Đã cập nhật trạng thái yêu cầu thành hoàn thành!');
            }
          }
        }
      } else if (currentAction === 'missed') {
        await missedAssignment(currentAssignment.id, { notes: actionNotes });
        toast.success('Đã đánh dấu người lao động vắng mặt!');
      } else if (currentAction === 'report_completion') {
        await reportAssignmentCompletion(currentAssignment.id, { notes: actionNotes });
        toast.success('Đã báo cáo hoàn thành công việc!');
      } else if (currentAction === 'reject') {
        await rejectAssignment(currentAssignment.id, { notes: actionNotes });
        toast.success('Đã từ chối công việc!');
      }

      // Refresh data
      fetchAssignments(userType);
    } catch (err) {
      console.error('Error updating assignment:', err);
      toast.error('Không thể cập nhật trạng thái công việc');
    } finally {
      setShowModal(false);
      setActionNotes('');
      setHoursWorked('');
      setCurrentAction(null);
      setCurrentAssignment(null);
    }
  };

  const handleSelectAssignment = (assignmentId: number, checked: boolean) => {
    if (checked) {
      setSelectedAssignments([...selectedAssignments, assignmentId]);
    } else {
      setSelectedAssignments(selectedAssignments.filter(id => id !== assignmentId));
    }
  };

  const handleBatchComplete = async () => {
    if (selectedAssignments.length === 0) {
      toast.error('Vui lòng chọn ít nhất một công việc');
      return;
    }
    
    if (window.confirm(`Bạn có chắc muốn đánh dấu ${selectedAssignments.length} công việc là hoàn thành?`)) {
      try {
        await completeMultipleAssignments(selectedAssignments);
        toast.success('Đã cập nhật trạng thái thành công!');
        setSelectedAssignments([]);
        fetchAssignments(userType);
      } catch (err) {
        console.error('Error updating assignments:', err);
        toast.error('Không thể cập nhật trạng thái công việc');
      }
    }
  };

  const renderAssignmentList = (items: any[]) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Không có công việc nào
        </div>
      );
    }

    return items.map((assignment) => (
      <Card key={assignment.id} className="mb-4">
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium">{assignment.labor_request?.title}</h3>
              <StatusBadge status={assignment.status} className="mt-1 mb-2" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Ngày làm việc</p>
              <p className="font-medium">{formatDate(assignment.work_date)}</p>
            </div>
          </div>
          
          <div className="mt-3 text-sm">
            <p className="text-gray-700">{assignment.labor_request?.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-500">Thời gian</p>
              <p className="font-medium">
                {formatTime(assignment.start_time)} - {formatTime(assignment.end_time)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">
                {userType === 'farmer' ? 'Người lao động' : 'Hộ nông dân'}
              </p>
              <p className="font-medium">
                {userType === 'farmer' 
                  ? (assignment.worker?.fullname || assignment.worker?.user_name)
                  : assignment.labor_request?.requesting_household?.name
                }
              </p>
            </div>
          </div>
          
          {assignment.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Ghi chú:</p>
              <p className="text-sm">{assignment.notes}</p>
            </div>
          )}
          
          {/* Nút cho farmer */}
          {userType === 'farmer' && assignment.status === 'worker_reported' && (
            <div className="mt-4 flex space-x-2">
              <Button 
                buttonType="success" 
                onClick={() => handleActionClick('complete', assignment)}
              >
                Xác nhận hoàn thành
              </Button>
              <Button 
                buttonType="danger" 
                onClick={() => handleActionClick('missed', assignment)}
              >
                Đánh dấu vắng mặt
              </Button>
            </div>
          )}
          
          {userType === 'farmer' && assignment.status === 'assigned' && (
            <div className="mt-4 flex space-x-2">
              <Button 
                buttonType="danger" 
                onClick={() => handleActionClick('missed', assignment)}
              >
                Đánh dấu vắng mặt
              </Button>
            </div>
          )}
          
          {/* Nút cho worker */}
          {userType === 'worker' && assignment.status === 'assigned' && (
            <div className="mt-4 flex space-x-2">
              <Button 
                buttonType="success" 
                onClick={() => handleActionClick('report_completion', assignment)}
              >
                Báo cáo hoàn thành
              </Button>
              <Button 
                buttonType="danger" 
                onClick={() => handleActionClick('reject', assignment)}
              >
                Từ chối
              </Button>
            </div>
          )}
          
          {/* Hiển thị đánh giá cho worker */}
          {userType === 'worker' && assignment.status === 'completed' && (
            <div className="mt-4">
              <div className="flex items-center">
                <p className="font-medium mr-2">Đánh giá:</p>
                {assignment.job_rating ? (
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg 
                        key={i} 
                        className={`w-5 h-5 ${i < assignment.job_rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">Chưa có đánh giá</span>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    ));
  };

  const getTabLabels = () => {
    if (userType === 'farmer') {
      return ['Đã phân công', 'Chờ xác nhận', 'Hoàn thành', 'Từ chối/Vắng mặt'];
    } else {
      return ['Sắp diễn ra', 'Chờ xác nhận', 'Hoàn thành', 'Từ chối/Vắng mặt'];
    }
  };

  const getTabFilters = () => {
    if (userType === 'farmer') {
      return [
        (a: any) => a.status === 'assigned',
        (a: any) => a.status === 'worker_reported',
        (a: any) => a.status === 'completed',
        (a: any) => ['rejected', 'missed'].includes(a.status)
      ];
    } else {
      return [
        (a: any) => a.status === 'assigned',
        (a: any) => a.status === 'worker_reported',
        (a: any) => a.status === 'completed',
        (a: any) => ['rejected', 'missed'].includes(a.status)
      ];
    }
  };

  return (
    <div>
      <LaborNavigation />
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {userType === 'farmer' ? 'Quản lý công việc' : 'Công việc của tôi'}
          </h1>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Đang xem với vai trò: {userType === 'farmer' ? 'Chủ nông trại' : 'Người lao động'}</span>
            <Button 
              buttonType="secondary"
              onClick={() => {
                const newType = userType === 'farmer' ? 'worker' : 'farmer';
                localStorage.setItem('userType', newType);
                setUserType(newType);
                fetchAssignments(newType);
              }}
            >
              Chuyển sang {userType === 'farmer' ? 'Người lao động' : 'Chủ nông trại'}
            </Button>
          </div>
        </div>

        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
            {getTabLabels().map((label) => (
              <Tab
                key={label}
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                   ${
                     selected
                       ? 'bg-white shadow text-blue-700'
                       : 'text-gray-700 hover:bg-white/[0.12]'
                   }`
                }
              >
                {label}
              </Tab>
            ))}
          </Tab.List>
          
          <Tab.Panels>
            {getTabFilters().map((filter, index) => (
              <Tab.Panel key={index}>
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                ) : (
                  renderAssignmentList(assignments.filter(filter))
                )}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>

        <ConfirmModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirmAction}
          title={
            currentAction === 'complete' ? 'Xác nhận hoàn thành' :
            currentAction === 'missed' ? 'Xác nhận vắng mặt' :
            currentAction === 'report_completion' ? 'Xác nhận báo cáo hoàn thành' :
            'Xác nhận từ chối'
          }
          message={
            <div>
              <div>
                {currentAction === 'complete' && 'Xác nhận người lao động đã hoàn thành công việc này?'}
                {currentAction === 'missed' && 'Xác nhận người lao động đã vắng mặt?'}
                {currentAction === 'report_completion' && 'Bạn có chắc chắn muốn báo cáo hoàn thành công việc này?'}
                {currentAction === 'reject' && 'Bạn có chắc chắn muốn từ chối công việc này?'}
              </div>
              <div className="mt-4">
                {currentAction === 'complete' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số giờ làm việc thực tế
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      value={hoursWorked}
                      onChange={(e) => setHoursWorked(e.target.value)}
                      placeholder="Nhập số giờ làm việc"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú (không bắt buộc)
                  </label>
                  <textarea
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          }
          confirmText={
            currentAction === 'complete' ? 'Xác nhận hoàn thành' :
            currentAction === 'missed' ? 'Đánh dấu vắng mặt' :
            currentAction === 'report_completion' ? 'Báo cáo hoàn thành' :
            'Từ chối'
          }
        />
      </div>
    </div>
  );
};

export default Assignments; 