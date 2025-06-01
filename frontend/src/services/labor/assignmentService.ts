import axiosInstance from "@/utils/axiosConfig";

// Lấy các công việc được phân công cho người lao động hiện tại
export const getWorkerAssignments = async (params: any = {}) => {
  const response = await axiosInstance.get(
    "/labor/labor_assignments/my_assignments",
    { params }
  );
  return response.data;
};

// Lấy thống kê về phân công
export const getAssignmentStats = async (period: 'week' | 'month' | 'quarter' = 'month') => {
  const response = await axiosInstance.get(
    "/labor/labor_assignments/stats",
    { params: { period } }
  );
  return response.data;
};

// Tạo phân công cho một người lao động
export const createAssignment = async (requestId: number, data: any) => {
  const response = await axiosInstance.post(
    "/labor/labor_assignments",
    {
      labor_request_id: requestId,
      ...data
    }
  );
  return response.data;
};

// Tạo phân công hàng loạt
export const batchAssignWorkers = async (requestId: number, data: any) => {
  const response = await axiosInstance.post(
    "/labor/labor_assignments/batch_assign",
    {
      labor_request_id: requestId,
      ...data
    }
  );
  return response.data;
};

// Kiểm tra xung đột lịch trình
export const checkScheduleConflicts = async (
  workerId: number,
  date: string,
  startTime: string,
  endTime: string
) => {
  const response = await axiosInstance.get(
    "/labor/labor_assignments/check_conflicts",
    { 
      params: { 
        worker_id: workerId, 
        date, 
        start_time: startTime, 
        end_time: endTime 
      } 
    }
  );
  return response.data;
};

// Hoàn thành công việc (chỉ dành cho farmer)
export const completeAssignment = async (assignmentId: number, data: any) => {
  const response = await axiosInstance.post(
    `/labor/labor_assignments/${assignmentId}/complete`,
    data
  );
  return response.data;
};

// Từ chối công việc
export const rejectAssignment = async (assignmentId: number, data: any = {}) => {
  const response = await axiosInstance.post(
    `/labor/labor_assignments/${assignmentId}/reject`,
    data
  );
  return response.data;
};

// Đánh dấu vắng mặt
export const markAssignmentMissed = async (assignmentId: number, data: any = {}) => {
  const response = await axiosInstance.post(
    `/labor/labor_assignments/${assignmentId}/missed`,
    data
  );
  return response.data;
};

// Đánh giá công việc/người lao động
export const rateAssignment = async (
  assignmentId: number, 
  rating: number, 
  comment: string, 
  raterType: 'farmer' | 'worker'
) => {
  const response = await axiosInstance.post(
    `/labor/labor_assignments/${assignmentId}/rate`,
    {
      rating,
      comment,
      rater_type: raterType
    }
  );
  return response.data;
};

// Lấy dự báo khả dụng của người lao động
export const getWorkerAvailability = async (
  workerId: number,
  startDate: string,
  endDate: string
) => {
  const response = await axiosInstance.get(
    "/labor/labor_assignments/worker_availability",
    {
      params: {
        worker_id: workerId,
        start_date: startDate,
        end_date: endDate
      }
    }
  );
  return response.data;
};

// Thêm service method mới cho worker báo cáo hoàn thành
export const reportAssignmentCompletion = async (assignmentId: number, data: any) => {
  const response = await axiosInstance.post(
    `/labor/labor_assignments/${assignmentId}/report_completion`,
    data
  );
  return response.data;
};

// Đánh dấu người lao động vắng mặt
export const missedAssignment = async (assignmentId: number, data: any = {}) => {
  const response = await axiosInstance.post(
    `/labor/labor_assignments/${assignmentId}/missed`,
    data
  );
  return response.data;
};

// Cập nhật trạng thái yêu cầu
export const updateLaborRequestStatus = async (requestId: number, status: string) => {
  const response = await axiosInstance.post(
    `/labor/labor_requests/${requestId}/${status}`,
    {}
  );
  return response.data;
};

// Lấy danh sách assignment của household
export const getHouseholdAssignments = async (params: any = {}) => {
  const response = await axiosInstance.get(
    "/labor/labor_assignments/household_assignments", 
    { params }
  );
  return response.data;
};

// Cập nhật nhiều assignment thành completed
export const completeMultipleAssignments = async (assignmentIds: number[], notes: string = '') => {
  const response = await axiosInstance.post(
    "/labor/labor_assignments/complete_multiple",
    { assignment_ids: assignmentIds, notes }
  );
  return response.data;
};