import axiosInstance from "@/utils/axiosConfig";

// Harvest API
export const getHarvests = async () => {
  const response = await axiosInstance.get("/harvests");
  return response.data;
};

export const getHarvestById = async (id: number) => {
  const response = await axiosInstance.get(`/harvests/${id}`);
  return response.data;
};

export const createHarvest = async (harvestData: any) => {
  const response = await axiosInstance.post("/harvests", harvestData);
  return response.data;
};

export const updateHarvest = async (id: number, harvestData: any) => {
  const response = await axiosInstance.put(`/harvests/${id}`, harvestData);
  return response.data;
};

export const deleteHarvest = async (id: number) => {
  const response = await axiosInstance.delete(`/harvests/${id}`);
  return response.data;
};
