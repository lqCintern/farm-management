import axiosInstance from "@/utils/axiosConfig";
import { FarmHousehold } from "@/types/labor/laborRequest.types";

interface FarmHouseholdResponse {
  success: boolean;
  data: FarmHousehold[];
}

// Lấy danh sách hộ sản xuất
export const getFarmHouseholds = async () => {
  const response = await axiosInstance.get<FarmHouseholdResponse>("/labor/farm_households");
  return response.data;
};

// Lấy chi tiết hộ sản xuất
export const getFarmHouseholdById = async (id: number) => {
  const response = await axiosInstance.get(`/labor/farm_households/${id}`);
  return response.data;
};
