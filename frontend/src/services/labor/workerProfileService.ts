import axiosInstance from "@/utils/axiosConfig";

// Lấy hồ sơ worker hiện tại
export const getWorkerProfile = async () => {
  const response = await axiosInstance.get("/labor/worker_profiles/my_profile");
  return response.data;
};

// Cập nhật hồ sơ worker
export const updateWorkerProfile = async (profileId: number, data: any) => {
  const response = await axiosInstance.put(`/labor/worker_profiles/${profileId}`, {
    worker_profile: data
  });
  return response.data;
};

// Tạo hồ sơ worker mới
export const createWorkerProfile = async (data: any) => {
  const response = await axiosInstance.post("/labor/worker_profiles", {
    worker_profile: data
  });
  return response.data;
};

// Lấy danh sách worker có sẵn
export const getAvailableWorkers = async (filters?: any) => {
  const response = await axiosInstance.get("/labor/worker_profiles/available_workers", {
    params: filters
  });
  return response.data;
};

// Kiểm tra khả năng làm việc của worker
export const checkWorkerAvailability = async (workerId: number, startDate: string, endDate: string) => {
  const response = await axiosInstance.get("/labor/worker_profiles/worker_availability", {
    params: {
      worker_id: workerId,
      start_date: startDate,
      end_date: endDate
    }
  });
  return response.data;
}; 