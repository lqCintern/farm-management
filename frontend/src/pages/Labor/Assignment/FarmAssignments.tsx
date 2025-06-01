import { useState, useEffect } from 'react';
import { getHouseholdAssignments, completeAssignment, missedAssignment, updateLaborRequestStatus, completeMultipleAssignments } from '@/services/labor/assignmentService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate, formatTime } from '@/utils/formatters';
import { Tab } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import ConfirmModal from '@/components/common/ConfirmModal';

const FarmAssignments = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<'complete' | 'missed' | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<any | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [hoursWorked, setHoursWorked] = useState<string>('');
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await getHouseholdAssignments();
      setAssignments((response as { data: any[] }).data);
      setError(null);
    } catch (err) {
      console.error('Error fetching farm assignments:', err);
      setError('Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: 'complete' | 'missed', assignment: any) => {
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
          // Lấy số lượng công việc chưa hoàn thành trong cùng yêu cầu
          const pendingAssignments = assignments.filter(a => 
            a.labor_request_id === request.id && 
            !['completed', 'rejected', 'missed'].includes(a.status)
          );
          
          if (pendingAssignments.length <= 1) { // <= 1 vì chúng ta chưa cập nhật UI
            if (window.confirm('Đây có vẻ là công việc cuối cùng trong yêu cầu. Bạn có muốn đánh dấu yêu cầu đã hoàn thành?')) {
              await updateLaborRequestStatus(request.id, 'completed');
              toast.success('Đã cập nhật trạng thái yêu cầu thành hoàn thành!');
            }
          }
        }
      } else if (currentAction === 'missed') {
        await missedAssignment(currentAssignment.id, { notes: actionNotes });
        toast.success('Đã đánh dấu người lao động vắng mặt!');
      }

      // Refresh data
      fetchAssignments();
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
        fetchAssignments();
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
              <p className="text-sm text-gray-500">Người lao động</p>
              <p className="font-medium">
                {assignment.worker?.fullname || assignment.worker?.user_name}
              </p>
            </div>
          </div>
          
          {assignment.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Ghi chú:</p>
              <p className="text-sm">{assignment.notes}</p>
            </div>
          )}
          
          {/* Nút xác nhận hoàn thành chỉ hiển thị khi worker đã báo cáo hoàn thành */}
          {assignment.status === 'worker_reported' && (
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
          
          {assignment.status === 'assigned' && (
            <div className="mt-4 flex space-x-2">
              <Button 
                buttonType="danger" 
                onClick={() => handleActionClick('missed', assignment)}
              >
                Đánh dấu vắng mặt
              </Button>
            </div>
          )}
        </div>
      </Card>
    ));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý công việc</h1>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
               ${
                 selected
                   ? 'bg-white shadow text-blue-700'
                   : 'text-gray-700 hover:bg-white/[0.12]'
               }`
            }
          >
            Đã phân công
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
               ${
                 selected
                   ? 'bg-white shadow text-blue-700'
                   : 'text-gray-700 hover:bg-white/[0.12]'
               }`
            }
          >
            Chờ xác nhận
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
               ${
                 selected
                   ? 'bg-white shadow text-blue-700'
                   : 'text-gray-700 hover:bg-white/[0.12]'
               }`
            }
          >
            Hoàn thành
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
               ${
                 selected
                   ? 'bg-white shadow text-blue-700'
                   : 'text-gray-700 hover:bg-white/[0.12]'
               }`
            }
          >
            Từ chối/Vắng mặt
          </Tab>
        </Tab.List>
        
        <Tab.Panels>
          <Tab.Panel>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            ) : (
              renderAssignmentList(assignments.filter(a => a.status === 'assigned'))
            )}
          </Tab.Panel>
          
          <Tab.Panel>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            ) : (
              renderAssignmentList(assignments.filter(a => a.status === 'worker_reported'))
            )}
          </Tab.Panel>
          
          <Tab.Panel>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            ) : (
              renderAssignmentList(assignments.filter(a => a.status === 'completed'))
            )}
          </Tab.Panel>
          
          <Tab.Panel>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            ) : (
              renderAssignmentList(assignments.filter(a => ['rejected', 'missed'].includes(a.status)))
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

    <ConfirmModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      onConfirm={handleConfirmAction}
      title={currentAction === 'complete' ? 'Xác nhận hoàn thành' : 'Xác nhận vắng mặt'}
      message={
        <div>
          <div>
            {currentAction === 'complete'
              ? 'Xác nhận người lao động đã hoàn thành công việc này?'
              : 'Xác nhận người lao động đã vắng mặt?'}
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
      confirmText={currentAction === 'complete' ? 'Xác nhận hoàn thành' : 'Đánh dấu vắng mặt'}
    />
    </div>
  );
};

export default FarmAssignments;