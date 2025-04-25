import axiosInstance from "@/utils/axiosConfig";
import { FarmActivityResponse } from "@/types";

// Farm Activities API
export const getFarmActivities = async (): Promise<FarmActivityResponse> => {
  const params = {};
  const response = await axiosInstance.get<FarmActivityResponse>(
    "/farm_activities",
    {
      params,
    }
  );
  return response.data;
};

export const getFarmActivityById = async (id: number) => {
  return axiosInstance.get(`/farm_activities/${id}`);
};

export const createFarmActivity = async (activityData: any) => {
  return axiosInstance.post("/farm_activities", activityData);
};

export const updateFarmActivity = async (id: number, activityData: any) => {
  return axiosInstance.put(`/farm_activities/${id}`, activityData);
};

export const deleteFarmActivity = async (id: number) => {
  return axiosInstance.delete(`/farm_activities/${id}`);
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
    const response = await axiosInstance.get("/farm_activities/statistics", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching statistics:", error);
    throw error;
  }
};
