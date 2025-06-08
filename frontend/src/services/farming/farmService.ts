import axiosInstance from "@/utils/axiosConfig";
import { FarmActivityResponse } from "@/types/labor/types";

// Farm Activities API
export const getFarmActivities = async (): Promise<FarmActivityResponse> => {
  const params = {};
  const response = await axiosInstance.get<FarmActivityResponse>(
    "/farming/farm_activities",
    {
      params,
    }
  );
  return response.data;
};

export const getFarmActivityById = async (id: number) => {
  return axiosInstance.get(`/farming/farm_activities/${id}`);
};

// Cập nhật phương thức createFarmActivity với kiểu dữ liệu chính xác
export const createFarmActivity = async (activityData: any) => {
  try {
    // Khai báo kiểu dữ liệu phù hợp cho materialsToSend
    let materialsToSend: Record<number, number> | null = {};
    
    // Nếu materials tồn tại, chuyển đổi thành dạng object với key là number
    if (activityData.materials) {
      Object.keys(activityData.materials).forEach(key => {
        if (activityData.materials[key] > 0) {
          // Sử dụng key là số nguyên, không phải chuỗi
          materialsToSend![parseInt(key)] = activityData.materials[key];
        }
      });
    }
    
    // Đảm bảo có ít nhất một vật tư
    if (materialsToSend && Object.keys(materialsToSend).length === 0) {
      materialsToSend = null; // Để backend báo lỗi nếu cần
    }
    
    // Chuẩn bị payload cuối cùng
    const payload = {
      farm_activity: {
        ...activityData,
        materials: materialsToSend
      }
    };
    
    // Log payload để kiểm tra
    console.log("Sending payload to server:", JSON.stringify(payload, null, 2));
    
    return axiosInstance.post("/farming/farm_activities", payload);
  } catch (error) {
    console.error("Error creating farm activity:", error);
    throw error;
  }
};

export const updateFarmActivity = async (id: number, data: any): Promise<any> => {
  try {
    const response = await axiosInstance.put(`/farming/farm_activities/${id}`, {
      farm_activity: data
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating farm activity ${id}:`, error);
    throw error;
  }
};

export const deleteFarmActivity = async (id: number) => {
  return axiosInstance.delete(`/farming/farm_activities/${id}`);
};

// Farm Materials API
export const getFarmMaterials = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get('/farming/farm_materials');
    
    // Nhất quán trong xử lý dữ liệu
    const responseData = response.data;
    
    // Chuyển đổi cấu trúc dữ liệu từ JSONAPI thành dạng đơn giản
    if (responseData && typeof responseData === 'object' && 'materials' in responseData && typeof responseData.materials === 'object' && responseData.materials && 'data' in responseData.materials) {
      // Chuyển đổi ID thành số nguyên
      return {
        data: (responseData.materials.data as Array<{ id: string; attributes: any }>).map((item) => ({
          id: parseInt(item.id), // Chuyển đổi ID thành số
          ...item.attributes
        })),
        pagination: 'pagination' in responseData ? responseData.pagination : undefined
      };
    }
    
    return responseData;
  } catch (error) {
    console.error('Error fetching farm materials:', error);
    throw error;
  }
};

export const getFarmMaterialById = async (id: number) => {
  return axiosInstance.get(`/farm_materials/${id}`);
};

export const createFarmMaterial = async (materialData: any) => {
  return axiosInstance.post("/farm_materials", materialData);
};

export const updateFarmMaterial = async (id: number, materialData: any) => {
  return axiosInstance.put(`/farm_materials/${id}`, materialData);
};

export const deleteFarmMaterial = async (id: number) => {
  return axiosInstance.delete(`/farm_materials/${id}`);
};
interface StatisticsParams {
  period: "month" | "quarter" | "year";
  year: number;
  month?: number;
  quarter?: number;
}

export const getFarmActivityStatistics = async (params: StatisticsParams) => {
  try {
    const response = await axiosInstance.get("/farming/farm_activities/statistics", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching statistics:", error);
    throw error;
  }
};

export const completeFarmActivity = async (id: number, data: {
  actual_notes?: string;
  actual_materials: Record<string, number>;
}): Promise<any> => {
  try {
    const response = await axiosInstance.post(`/farming/farm_activities/${id}/complete`, data);
    return response.data;
  } catch (error) {
    console.error(`Error completing farm activity ${id}:`, error);
    throw error;
  }
};
