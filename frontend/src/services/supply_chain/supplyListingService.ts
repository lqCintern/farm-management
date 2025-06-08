import axiosInstance from "@/utils/axiosConfig";

// Định nghĩa kiểu dữ liệu
export interface SupplyListing {
  id?: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  quantity: number;
  description?: string;
  brand?: string;
  manufacturer?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  province?: string;
  district?: string;
  ward?: string;
  address?: string;
  status?: string;
  view_count?: number;
  order_count?: number;
  main_image?: string;
  images?: string[];
  created_at: string;
}

const supplyListingService = {
  // Nhà cung cấp: Lấy danh sách vật tư đã đăng
  getSupplierListings: async (): Promise<any> => {
    const response = await axiosInstance.get("/supply_chain/supply_listings");
    return response.data;
  },

  // Nhà cung cấp: Lấy chi tiết vật tư
  getSupplierListingById: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/supply_chain/supply_listings/${id}`);
    return response.data;
  },

  // Nhà cung cấp: Tạo vật tư mới
  createListing: async (formData: FormData) => {
    const response = await axiosInstance.post('/supply_chain/supply_listings', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Nhà cung cấp: Cập nhật vật tư
  updateListing: async (id: number, formData: FormData) => {
    try {
      const response = await axiosInstance.put(`/supply_chain/supply_listings/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as any).response &&
        "data" in (error as any).response
      ) {
        return (error as any).response.data; // Trả về lỗi từ server nếu có
      }
      throw error;
    }
  },

  // Nhà cung cấp: Xóa vật tư
  deleteListing: async (id: number): Promise<any> => {
    const response = await axiosInstance.delete(
      `/supply_chain/supply_listings/${id}`
    );
    return response.data;
  },

  // Nhà cung cấp: Thay đổi trạng thái
  changeStatus: async (id: number, status: string): Promise<any> => {
    const response = await axiosInstance.put(
      `/supply_chain/supply_listings/${id}/change_status`,
      {
        status,
      }
    );
    return response.data;
  },

  // Nông dân: Xem danh sách vật tư
  getListings: async (params?: any): Promise<any> => {
    const response = await axiosInstance.get("/supply_chain/farmer_supply_listings", { params });
    return response.data;
  },

  // Nông dân: Xem chi tiết vật tư
  getListingById: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/supply_chain/farmer_supply_listings/${id}`);
    return response.data;
  },

  // Lấy danh mục vật tư
  getCategories: async (): Promise<any> => {
    const response = await axiosInstance.get("/supply_chain/farmer_supply_listings/categories");
    return response.data;
  },
};

export default supplyListingService;
