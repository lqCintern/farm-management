import axiosInstance from "@/utils/axiosConfig";
import { 
  LaborRequest,
  LaborRequestResponse,
  LaborRequestsResponse,
  CreateMixedRequestParams,
  CreateMixedRequestResponse,
  ProcessRequestResponse,
  GroupStatusResponse
} from "@/types/labor/laborRequest.types";

// Lấy danh sách yêu cầu đổi công
export const getLaborRequests = async (params: any = {}) => {
  const response = await axiosInstance.get<LaborRequestsResponse>(
    "/labor/labor_requests",
    { params }
  );
  return response.data;
};

// Lấy chi tiết yêu cầu đổi công
export const getLaborRequestById = async (id: number) => {
  const response = await axiosInstance.get<LaborRequestResponse>(`/labor/labor_requests/${id}`);
  return response.data;
};

// Tạo yêu cầu đổi công thông thường
export const createLaborRequest = async (requestData: any) => {
  const response = await axiosInstance.post<LaborRequestResponse>(
    "/labor/labor_requests", 
    { labor_request: requestData }
  );
  return response.data;
};

// Tạo yêu cầu đổi công kết hợp (chỉ định + công khai)
export const createMixedRequest = async (params: CreateMixedRequestParams) => {
  const response = await axiosInstance.post<CreateMixedRequestResponse>(
    "/labor/labor_requests/create_mixed",
    params
  );
  return response.data;
};

// Lấy danh sách yêu cầu công khai
export const getPublicRequests = async (excludeJoined: boolean = true) => {
  const response = await axiosInstance.get<LaborRequestsResponse>(
    "/labor/labor_requests/public_requests",
    { params: { exclude_joined: excludeJoined } }
  );
  return response.data;
};

// Tham gia vào yêu cầu công khai
export const joinRequest = async (requestId: number) => {
  const response = await axiosInstance.post<LaborRequestResponse>(
    `/labor/labor_requests/${requestId}/join`
  );
  return response.data;
};

// Chấp nhận yêu cầu
export const acceptRequest = async (requestId: number) => {
  const response = await axiosInstance.post<ProcessRequestResponse>(
    `/labor/labor_requests/${requestId}/accept`
  );
  return response.data;
};

// Từ chối yêu cầu
export const declineRequest = async (requestId: number) => {
  const response = await axiosInstance.post<ProcessRequestResponse>(
    `/labor/labor_requests/${requestId}/decline`
  );
  return response.data;
};

// Hoàn thành yêu cầu
export const completeRequest = async (requestId: number) => {
  const response = await axiosInstance.post<ProcessRequestResponse>(
    `/labor/labor_requests/${requestId}/complete`
  );
  return response.data;
};

// Hủy yêu cầu
export const cancelRequest = async (requestId: number) => {
  const response = await axiosInstance.post<ProcessRequestResponse>(
    `/labor/labor_requests/${requestId}/cancel`
  );
  return response.data;
};

// Xem trạng thái nhóm
export const getGroupStatus = async (requestId: number) => {
  const response = await axiosInstance.get<GroupStatusResponse>(
    `/labor/labor_requests/${requestId}/group_status`
  );
  return response.data;
};

// Cập nhật yêu cầu
export const updateLaborRequest = async (requestId: number, requestData: any) => {
  const response = await axiosInstance.put<LaborRequestResponse>(
    `/labor/labor_requests/${requestId}`,
    { labor_request: requestData }
  );
  return response.data;
};

// Xóa yêu cầu
export const deleteLaborRequest = async (requestId: number) => {
  const response = await axiosInstance.delete(`/labor/labor_requests/${requestId}`);
  return response.data;
};

// Gợi ý người lao động
export const suggestWorkers = async (requestId: number, limit: number = 5) => {
  const response = await axiosInstance.get(
    `/labor/labor_requests/${requestId}/suggest_workers`,
    { params: { limit } }
  );
  return response.data;
};

// Lấy yêu cầu theo hoạt động nông nghiệp
export const getRequestsForActivity = async (farmActivityId: number) => {
  const response = await axiosInstance.get<LaborRequestsResponse>(
    `/labor/labor_requests/for_activity`,
    { params: { farm_activity_id: farmActivityId } }
  );
  return response.data;
};

// Lấy yêu cầu của tôi (tôi tạo)
export const getMyRequests = async (params: any = {}) => {
  const response = await axiosInstance.get<LaborRequestsResponse>(
    "/labor/labor_requests",
    { 
      params: {
        ...params,
        requesting_household_id: 'current' // Backend sẽ xử lý để lấy current household
      }
    }
  );
  return response.data;
};

// Lấy yêu cầu tôi tham gia (tôi được yêu cầu)
export const getParticipatedRequests = async (params: any = {}) => {
  const response = await axiosInstance.get<LaborRequestsResponse>(
    "/labor/labor_requests",
    { 
      params: {
        ...params,
        providing_household_id: 'current' // Backend sẽ xử lý để lấy current household
      }
    }
  );
  return response.data;
};
