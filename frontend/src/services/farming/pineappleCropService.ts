import axiosInstance from "@/utils/axiosConfig";
import { 
  PineappleCropResponse,
  PineappleCropCreateParams,
  PineappleCropPreviewResponse,
  FarmActivityResponse
} from "@/types/labor/types";

// Lấy danh sách vụ trồng dứa
export const getPineappleCrops = async (params: any = {}) => {
  const response = await axiosInstance.get<PineappleCropResponse>(
    "/farming/pineapple_crops",
    { params }
  );
  return response.data;
};

// Lấy chi tiết vụ trồng dứa
export const getPineappleCropById = async (id: number) => {
  const response = await axiosInstance.get(`/farming/pineapple_crops/${id}`);
  return response.data;
};

// Tạo vụ trồng dứa mới
export const createPineappleCrop = async (cropData: PineappleCropCreateParams) => {
  const response = await axiosInstance.post("/farming/pineapple_crops", cropData);
  return response.data;
};

// Cập nhật vụ trồng dứa
export const updatePineappleCrop = async (id: number, cropData: any) => {
  const response = await axiosInstance.put(`/farming/pineapple_crops/${id}`, cropData);
  return response.data;
};

// Xóa vụ trồng dứa
export const deletePineappleCrop = async (id: number) => {
  const response = await axiosInstance.delete(`/farming/pineapple_crops/${id}`);
  return response.data;
};

// Xem trước kế hoạch công việc
export const previewPlan = async (cropData: any): Promise<any> => {
    const response = await axiosInstance.post('/farming/pineapple_crops/preview_plan', cropData);
    return response.data;
  };

// Xác nhận và lưu kế hoạch công việc
export const confirmPlan = async (id: number, activities: any[]) => {
  const response = await axiosInstance.post(
    `/farming/pineapple_crops/${id}/confirm_plan`,
    { activities }
  );
  return response.data;
};

// Chuyển giai đoạn vụ trồng
export const advanceStage = async (id: number) => {
  const response = await axiosInstance.post(`/farming/pineapple_crops/${id}/advance_stage`);
  return response.data;
};

// Ghi nhận thu hoạch
export const recordHarvest = async (id: number, quantity: number) => {
  const response = await axiosInstance.post(
    `/farming/pineapple_crops/${id}/record_harvest`,
    { quantity }
  );
  return response.data;
};

// Thống kê tổng quan
export const getPineappleCropStatistics = async () => {
  const response = await axiosInstance.get("/farming/pineapple_crops/statistics");
  return response.data;
};
