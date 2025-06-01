import axiosInstance from "@/utils/axiosConfig";

// Lấy thông tin về hộ hiện tại
export const getCurrentHousehold = async () => {
  const response = await axiosInstance.get("/labor/households/current");
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
export const addWorkerToHousehold = async (workerId: number, relationship: string = 'member') => {
  const response = await axiosInstance.post("/labor/household_workers", {
    worker_id: workerId,
    relationship
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
export const removeWorkerFromHousehold = async (workerId: number, reason?: string) => {
  const response = await axiosInstance.delete(`/labor/household_workers/${workerId}/remove`, {
    params: { reason }
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