import axiosInstance from "@/utils/axiosConfig";

// Interface cho Template Activity Material
export interface TemplateActivityMaterial {
  id?: number;
  template_id?: number;
  material_id: number;
  material_name?: string;
  quantity: number;
  unit?: string;
  category?: string;
  unit_cost?: number;
  total_cost?: number;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface cho Material (từ inventory)
export interface FarmMaterial {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  unit_cost: number;
  total_cost: number;
  available_quantity: number;
  reserved_quantity: number;
}

// Interface cho response
export interface TemplateMaterialsResponse {
  success: boolean;
  data: TemplateActivityMaterial[];
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
  };
}

// Interface cho statistics response mới
export interface TemplateMaterialStatsResponse {
  success: boolean;
  statistics: TemplateMaterialStats;
}

// Interface cho statistics
export interface TemplateMaterialStats {
  total_materials: number;
  total_quantity: number;
  by_category: Record<string, {
    count: number;
    total_quantity: number;
    materials: Array<{
      id: number;
      material_name: string;
      quantity: number;
      unit: string;
    }>;
  }>;
  cost_estimate: string | number;
  feasibility: {
    feasible: boolean;
    insufficient_materials: Array<{
      material_name: string;
      required: number;
      available: string | number;
      unit: string;
      reason: string;
    }>;
    total_cost: string | number;
    materials_count: number;
  };
}

const templateMaterialService = {
  // Lấy danh sách materials của template
  getTemplateMaterials: async (templateId: number, params: any = {}): Promise<TemplateMaterialsResponse> => {
    const response = await axiosInstance.get(`/farming/pineapple_activity_templates/${templateId}/materials`, { params });
    return response.data as TemplateMaterialsResponse;
  },

  // Lấy chi tiết material của template
  getTemplateMaterial: async (templateId: number, materialId: number): Promise<any> => {
    const response = await axiosInstance.get(`/farming/pineapple_activity_templates/${templateId}/materials/${materialId}`);
    return response.data;
  },

  // Thêm material vào template
  addMaterialToTemplate: async (templateId: number, materialData: Omit<TemplateActivityMaterial, 'id' | 'template_id'>): Promise<any> => {
    const response = await axiosInstance.post(`/farming/pineapple_activity_templates/${templateId}/materials`, {
      template_material: materialData
    });
    return response.data;
  },

  // Cập nhật material trong template
  updateTemplateMaterial: async (templateId: number, materialId: number, materialData: Partial<TemplateActivityMaterial>): Promise<any> => {
    const response = await axiosInstance.put(`/farming/pineapple_activity_templates/${templateId}/materials/${materialId}`, {
      material: materialData
    });
    return response.data;
  },

  // Xóa material khỏi template
  removeMaterialFromTemplate: async (templateId: number, materialId: number): Promise<any> => {
    const response = await axiosInstance.delete(`/farming/pineapple_activity_templates/${templateId}/materials/${materialId}`);
    return response.data;
  },

  // Thêm nhiều materials vào template (batch)
  addMaterialsToTemplate: async (templateId: number, materials: Omit<TemplateActivityMaterial, 'id' | 'template_id'>[]): Promise<any> => {
    const response = await axiosInstance.post(`/farming/pineapple_activity_templates/${templateId}/materials/batch`, {
      materials
    });
    return response.data;
  },

  // Cập nhật nhiều materials trong template (batch)
  updateTemplateMaterials: async (templateId: number, materials: TemplateActivityMaterial[]): Promise<any> => {
    const response = await axiosInstance.put(`/farming/pineapple_activity_templates/${templateId}/materials/batch`, {
      materials
    });
    return response.data;
  },

  // Xóa nhiều materials khỏi template (batch)
  removeMaterialsFromTemplate: async (templateId: number, materialIds: number[]): Promise<any> => {
    const response = await axiosInstance.delete(`/farming/pineapple_activity_templates/${templateId}/materials/batch`, {
      params: { material_ids: materialIds }
    });
    return response.data;
  },

  // Lấy thống kê materials của template - Cập nhật cho response mới
  getTemplateMaterialStats: async (templateId: number): Promise<TemplateMaterialStatsResponse> => {
    const response = await axiosInstance.get(`/farming/pineapple_activity_templates/${templateId}/materials/statistics`);
    return response.data as TemplateMaterialStatsResponse;
  },

  // Kiểm tra tính khả thi của template
  checkTemplateFeasibility: async (templateId: number): Promise<{ success: boolean; feasibility: TemplateMaterialStats['feasibility'] }> => {
    const response = await axiosInstance.get(`/farming/pineapple_activity_templates/${templateId}/materials/feasibility`);
    return response.data as { success: boolean; feasibility: TemplateMaterialStats['feasibility'] };
  },

  // So sánh với inventory
  compareWithInventory: async (templateId: number): Promise<any> => {
    const response = await axiosInstance.get(`/farming/pineapple_activity_templates/${templateId}/materials/inventory_comparison`);
    return response.data;
  },

  // Lấy danh sách materials có sẵn (từ inventory)
  getAvailableMaterials: async (params: any = {}): Promise<{ status: string; materials: FarmMaterial[] }> => {
    const response = await axiosInstance.get('/farming/farm_materials', { params });
    return response.data as { status: string; materials: FarmMaterial[] };
  }
};

export default templateMaterialService; 