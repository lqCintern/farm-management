import axiosInstance from "@/utils/axiosConfig";
import { PineappleCrop } from "@/types/labor/types";

// Định nghĩa kiểu dữ liệu cho Field
export interface Field {
  id?: number;
  name: string;
  description?: string;
  location?: string;
  coordinates?: { lat: number; lng: number }[];
  area?: number | string;
  activity_count?: number;
  harvest_count?: number;
  currentCrop?: PineappleCrop;
  created_at?: string;
  updated_at?: string;
  color?: string; // Needed for map display
}

// Định nghĩa kiểu dữ liệu cho response format
export interface FieldResponse {
  message: string;
  data: Field;
}

export interface FieldsResponse {
  message: string;
  data: Field[];
}

const fieldService = {
  // Lấy danh sách tất cả các fields
  getFields: async (): Promise<FieldsResponse> => {
    const response = await axiosInstance.get<FieldsResponse>("/farming/fields");
    return response.data;
  },

  // Lấy thông tin chi tiết của một field
  getFieldById: async (id: number): Promise<FieldResponse> => {
    const response = await axiosInstance.get<FieldResponse>(`/farming/fields/${id}`);
    return response.data;
  },

  // Tạo một field mới
  createField: async (fieldData: Field): Promise<FieldResponse> => {
    const response = await axiosInstance.post<FieldResponse>("/farming/fields", { field: fieldData });
    return response.data;
  },

  // Cập nhật một field
  updateField: async (id: number, fieldData: Field): Promise<FieldResponse> => {
    const response = await axiosInstance.put<FieldResponse>(`/farming/fields/${id}`, {
      field: fieldData,
    });
    return response.data;
  },

  // Xóa một field
  deleteField: async (id: number): Promise<{ message: string }> => {
    const response = await axiosInstance.delete<{ message: string }>(`/farming/fields/${id}`);
    return response.data;
  },

  // Lấy danh sách hoạt động của một field
  getFieldActivities: async (id: number): Promise<any> => {
    const response = await axiosInstance.get<any>(`/farming/fields/${id}/activities`);
    return response.data;
  },

  // Lấy danh sách thu hoạch của một field
  getFieldHarvests: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/farming/fields/${id}/harvests`);
    return response.data;
  },

  // Lấy danh sách cây trồng của một field
  getFieldCrops: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/farming/fields/${id}/pineapple_crops`);
    return response.data;
  },

  // Lấy thống kê fields
  getFieldStats: async (): Promise<any> => {
    const response = await axiosInstance.get("/farming/fields/stats");
    return response.data;
  },

  // Parse area đảm bảo được hiển thị đúng
  parseArea: (area: string | number): number => {
    if (typeof area === 'string') {
      return parseFloat(area);
    }
    return area || 0;
  }
};

export default fieldService;
