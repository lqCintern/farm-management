import axiosInstance from "@/utils/axiosConfig";

export interface FarmMaterialInventory {
  id: number;
  material_id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  last_updated: string;
  purchase_price?: number;
  expiration_date?: string;
  location?: string;
}

export interface InventoryResponse {
  status: string;
  materials: FarmMaterialInventory[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
  };
}

export interface InventoryFilters {
  category?: string;
  keyword?: string;
  sort_by?: string;
  page?: number;
  per_page?: number;
  min_quantity?: string;
  max_quantity?: string;
}

// Lấy danh sách vật tư trong kho
export const getInventoryMaterials = async (filters: InventoryFilters = {}): Promise<InventoryResponse> => {
  try {
    const response = await axiosInstance.get<InventoryResponse>('/farming/farm_materials', { params: filters });
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory materials:', error);
    throw error;
  }
};

// Lấy chi tiết vật tư theo ID
export const getInventoryMaterialById = async (id: number): Promise<{ status: string; material: FarmMaterialInventory }> => {
  try {
    const response = await axiosInstance.get<{ status: string; material: FarmMaterialInventory }>(`/farming/farm_materials/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching inventory material ${id}:`, error);
    throw error;
  }
};

// Thêm vật tư mới vào kho
export const addMaterialToInventory = async (materialData: Omit<FarmMaterialInventory, 'id' | 'last_updated'>): Promise<any> => {
  try {
    const response = await axiosInstance.post('/farming/farm_materials', {
      material: materialData
    });
    return response.data;
  } catch (error) {
    console.error('Error adding material to inventory:', error);
    throw error;
  }
};

// Cập nhật thông tin vật tư trong kho
export const updateInventoryMaterial = async (id: number, data: Partial<FarmMaterialInventory>): Promise<any> => {
  try {
    const response = await axiosInstance.put(`/farming/inventory/${id}`, {
      material: data
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating inventory material ${id}:`, error);
    throw error;
  }
};

// Xóa vật tư khỏi kho
export const removeInventoryMaterial = async (id: number): Promise<any> => {
  try {
    const response = await axiosInstance.delete(`/farming/inventory/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error removing inventory material ${id}:`, error);
    throw error;
  }
};

// Điều chỉnh số lượng vật tư (tăng/giảm)
export const adjustInventoryQuantity = async (id: number, adjustment: { quantity: number; reason: string }): Promise<any> => {
  try {
    const response = await axiosInstance.post(`/farming/inventory/${id}/adjust`, {
      adjustment
    });
    return response.data;
  } catch (error) {
    console.error(`Error adjusting inventory quantity for material ${id}:`, error);
    throw error;
  }
};

// Lấy thống kê kho vật tư
export const getInventoryStatistics = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get('/farming/inventory/statistics');
    return response.data;
  } catch (error) {
    console.error('Error fetching inventory statistics:', error);
    throw error;
  }
};

export default {
  getInventoryMaterials,
  getInventoryMaterialById,
  addMaterialToInventory,
  updateInventoryMaterial,
  removeInventoryMaterial,
  adjustInventoryQuantity,
  getInventoryStatistics
};