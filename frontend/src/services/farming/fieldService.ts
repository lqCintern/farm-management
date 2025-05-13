import axiosInstance from "@/utils/axiosConfig";

// Định nghĩa kiểu dữ liệu cho Field
interface Field {
  id?: number;
  name: string;
  description?: string;
  location?: string;
  coordinates?: { lat: number; lng: number }[];
  area?: number;
}

const fieldService = {
  // Lấy danh sách tất cả các fields
  getFields: async (): Promise<any> => {
    const response = await axiosInstance.get("/farming/fields");
    return response.data;
  },

  // Lấy thông tin chi tiết của một field
  getFieldById: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/farming/fields/${id}`);
    return response.data;
  },

  // Tạo một field mới
  createField: async (fieldData: Field): Promise<any> => {
    const response = await axiosInstance.post("/farming/fields", { field: fieldData });
    return response.data;
  },

  // Cập nhật một field
  updateField: async (id: number, fieldData: Field): Promise<any> => {
    const response = await axiosInstance.put(`/farming/fields/${id}`, {
      field: fieldData,
    });
    return response.data;
  },

  // Xóa một field
  deleteField: async (id: number): Promise<any> => {
    const response = await axiosInstance.delete(`/farming/fields/${id}`);
    return response.data;
  },

  // Lấy danh sách hoạt động của một field
  getFieldActivities: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/farming/fields/${id}/activities`);
    return response.data;
  },

  // Lấy danh sách thu hoạch của một field
  getFieldHarvests: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/farming/fields/${id}/harvests`);
    return response.data;
  },

  // Lấy danh sách cây trồng của một field
  getFieldCrops: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/farming/fields/${id}/crops`);
    return response.data;
  },

  // Lấy thống kê fields
  getFieldStats: async (): Promise<any> => {
    const response = await axiosInstance.get("/farming/fields/stats");
    return response.data;
  },
};

export default fieldService;
