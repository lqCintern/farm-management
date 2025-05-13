import axiosInstance from "@/utils/axiosConfig";
import { FarmActivityResponse } from "@/types";

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

export const createFarmActivity = async (activityData: any) => {
  return axiosInstance.post("/farming/farm_activities", activityData);
};

export const updateFarmActivity = async (id: number, activityData: any) => {
  return axiosInstance.put(`/farming/farm_activities/${id}`, activityData);
};

export const deleteFarmActivity = async (id: number) => {
  return axiosInstance.delete(`/farming/farm_activities/${id}`);
};

// Farm Materials API
export const getFarmMaterials = async () => {
  return axiosInstance.get("/farm_materials");
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

export const completeFarmActivity = async (activityId: number, completionData: { 
  farm_activity: { 
    actual_notes?: string; 
    actual_completion_date?: string;
    actual_materials?: Array<{
      farm_material_id: number;
      quantity: number;
      unit: string;
    }>;
  }; 
}) => {
  try {
    const response = await axiosInstance.post(
      `/farming/farm_activities/${activityId}/complete`, 
      completionData
    );
    return response.data;
  } catch (error) {
    console.error("Error completing farm activity:", error);
    throw error;
  }
};
