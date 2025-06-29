import axiosInstance from "@/utils/axiosConfig";

// Lấy thông tin về hộ hiện tại
export const getCurrentHousehold = async () => {
  const response = await axiosInstance.get("/labor/farm_households/current");
  return response.data;
};

// Cập nhật thông tin household
export const updateHousehold = async (householdId: number, data: any) => {
  const response = await axiosInstance.put(`/labor/farm_households/${householdId}`, {
    household: data
  });
  return response.data;
};

// Lấy danh sách thành viên trong hộ
export const getHouseholdWorkers = async (householdId?: number) => {
  const url = householdId 
    ? `/labor/households/${householdId}/workers` 
    : "/labor/household/workers";
  const response = await axiosInstance.get(url);
  return response.data;
};

// Thêm người lao động vào hộ
export const addWorkerToHousehold = async (householdId: number, data: any) => {
  const response = await axiosInstance.post(`/labor/farm_households/${householdId}/household_workers`, {
    worker: data
  });
  return response.data;
};

// Thêm hàng loạt người lao động
export const bulkAddWorkersToHousehold = async (workerIds: number[], relationship: string = 'member') => {
  const response = await axiosInstance.post("/labor/household_workers/bulk_add", {
    worker_ids: workerIds,
    relationship
  });
  return response.data;
};

// Xóa người lao động khỏi hộ
export const removeWorker = async (workerId: number) => {
  const response = await axiosInstance.delete(`/labor/household_workers/${workerId}`);
  return response.data;
};

// Cập nhật trạng thái worker
export const updateWorkerStatus = async (workerId: number, isActive: boolean) => {
  const response = await axiosInstance.patch(`/labor/household_workers/${workerId}/update_status`, {
    is_active: isActive
  });
  return response.data;
};

// Cập nhật thông tin người lao động
export const updateWorkerProfile = async (workerId: number, data: any) => {
  const response = await axiosInstance.patch(`/labor/household_workers/${workerId}`, data);
  return response.data;
};

// Lấy danh sách người lao động có thể tham gia yêu cầu đổi công
export const getAvailableWorkers = async (requestId: number) => {
  const response = await axiosInstance.get(`/labor/labor_requests/${requestId}/suggest_workers`);
  return response.data;
};