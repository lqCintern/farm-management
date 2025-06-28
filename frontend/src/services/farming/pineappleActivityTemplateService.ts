import axiosInstance from "@/utils/axiosConfig";

// Enum cho stage
export enum PineappleStage {
  PREPARATION = 0,             // Chuẩn bị đất & mật độ trồng
  SEEDLING_PREPARATION = 1,    // Chuẩn bị giống & vật tư
  PLANTING = 2,                // Trồng dứa
  LEAF_TYING = 3,              // Buộc lá (tránh chính vụ)
  FIRST_FERTILIZING = 4,       // Bón phân thúc lần 1
  SECOND_FERTILIZING = 5,      // Bón phân thúc lần 2
  FLOWER_TREATMENT = 6,        // Xử lý ra hoa
  SUN_PROTECTION = 7,          // Buộc tránh nắng / Che lưới đen
  FRUIT_DEVELOPMENT = 8,       // Bón phân thúc quả lớn
  HARVESTING = 9,              // Thu hoạch
  SPROUT_COLLECTION = 10,      // Tách chồi giống
  FIELD_CLEANING = 11          // Dọn vườn
}

// Enum cho activity_type
export enum PineappleActivityType {
  SOIL_PREPARATION = 0,      // Chuẩn bị đất
  SEEDLING_PREPARATION = 1,  // Chuẩn bị giống & vật tư
  PLANTING = 2,              // Trồng dứa
  LEAF_TYING = 3,            // Buộc lá
  FERTILIZING = 4,           // Bón phân
  PESTICIDE = 5,             // Phun thuốc
  SUN_PROTECTION = 6,        // Che nắng
  FRUIT_DEVELOPMENT = 7,     // Thúc quả
  HARVESTING = 8,            // Thu hoạch
  SPROUT_COLLECTION = 9,     // Tách chồi
  FIELD_CLEANING = 10,       // Dọn vườn
  WATERING = 11,             // Tưới nước
  WEEDING = 12,              // Làm cỏ
  OTHER = 13                 // Khác
}

// Định nghĩa kiểu dữ liệu cho PineappleActivityTemplate
export interface PineappleActivityTemplate {
  id?: number;
  name: string;
  description?: string;
  activity_type: number;  // Sửa thành number để khớp với enum
  stage: number;          // Sửa thành number để khớp với enum
  day_offset: number;
  duration_days: number;
  season_specific?: string;
  is_required?: boolean;
  user_id?: number;
}

// Interface cho params API
export interface PineappleTemplateParams {
  stage?: number | string;
  activity_type?: number | string;
  [key: string]: any; // Cho phép các tham số khác
}

export interface ApplyTemplateParams {
  template_id: number;
  crop_id: number;
}

const pineappleActivityTemplateService = {
  // Lấy danh sách templates
  getTemplates: async (params: PineappleTemplateParams = {}): Promise<any> => {
    const response = await axiosInstance.get("/farming/pineapple_activity_templates", { 
      params 
    });
    return response.data;
  },

  // Lấy chi tiết template
  getTemplateById: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/farming/pineapple_activity_templates/${id}`);
    return response.data;
  },

  // Tạo template mới
  createTemplate: async (templateData: { template: PineappleActivityTemplate }): Promise<any> => {
    const response = await axiosInstance.post("/farming/pineapple_activity_templates", templateData);
    return response.data;
  },

  // Cập nhật template
  updateTemplate: async (id: number, templateData: { template: PineappleActivityTemplate }): Promise<any> => {
    const response = await axiosInstance.put(`/farming/pineapple_activity_templates/${id}`, templateData);
    return response.data;
  },

  // Xóa template
  deleteTemplate: async (id: number): Promise<any> => {
    const response = await axiosInstance.delete(`/farming/pineapple_activity_templates/${id}`);
    return response.data;
  },

  // Áp dụng template cho một vụ dứa
  applyToCrop: async (params: ApplyTemplateParams): Promise<any> => {
    const response = await axiosInstance.post("/farming/pineapple_activity_templates/apply_to_crop", params);
    return response.data;
  }
};

export default pineappleActivityTemplateService;
