import { useState, useEffect } from 'react';
import { getWorkerAssignments, reportAssignmentCompletion, rejectAssignment } from '@/services/labor/assignmentService';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate, formatTime } from '@/utils/formatters';
import { Tab } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import ConfirmModal from '@/components/common/ConfirmModal';

const WorkerAssignments = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<'report_completion' | 'reject' | null>(null);
  const [currentAssignment, setCurrentAssignment] = useState<number | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [actionNotes, setActionNotes] = useState<string>('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await getWorkerAssignments();
      setAssignments((response as { data: any[] }).data);
      setError(null);
    } catch (err) {
      console.error('Error fetching worker assignments:', err);
      setError('Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: 'report_completion' | 'reject', assignmentId: number) => {
    setCurrentAction(action);
    setCurrentAssignment(assignmentId);
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!currentAssignment || !currentAction) return;

    try {
      if (currentAction === 'report_completion') {
        await reportAssignmentCompletion(currentAssignment, { notes: actionNotes });
        toast.success('Đã báo cáo hoàn thành công việc!');
      } else if (currentAction === 'reject') {
        await rejectAssignment(currentAssignment, { notes: actionNotes });
        toast.success('Đã từ chối công việc!');
      }

      // Refresh data
      fetchAssignments();
    } catch (err) {
      console.error('Error updating assignment:', err);
      toast.error('Không thể cập nhật trạng thái công việc');
    } finally {
      setShowModal(false);
      setActionNotes('');
      setCurrentAction(null);
      setCurrentAssignment(null);
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
              <p className="text-sm text-gray-500">Hộ nông dân</p>
              <p className="font-medium">
                {assignment.labor_request?.requesting_household?.name}
              </p>
            </div>
          </div>
          
          {assignment.status === 'assigned' && (
            <div className="mt-4 flex space-x-2">
              <Button 
                buttonType="success" 
                onClick={() => handleActionClick('report_completion', assignment.id)}
              >
                Báo cáo hoàn thành
              </Button>
              <Button 
                buttonType="danger" 
                onClick={() => handleActionClick('reject', assignment.id)}
              >
                Từ chối
              </Button>
            </div>
          )}
          
          {assignment.status === 'completed' && (
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Công việc của tôi</h1>
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
            Sắp diễn ra
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
        title={currentAction === 'report_completion' ? 'Xác nhận báo cáo hoàn thành' : 'Xác nhận từ chối'}
        message={
          currentAction === 'report_completion'
            ? 'Bạn có chắc chắn muốn báo cáo hoàn thành công việc này?'
            : 'Bạn có chắc chắn muốn từ chối công việc này?'
        }
        confirmText={currentAction === 'report_completion' ? 'Báo cáo hoàn thành' : 'Từ chối'}
      />
    </div>
  );
};

export default WorkerAssignments;