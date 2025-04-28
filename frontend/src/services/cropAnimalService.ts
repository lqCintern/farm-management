import axiosInstance from "@/utils/axiosConfig";

// Farm Activities API

import { CropAnimal } from "@/types/cropAnimal"; // Adjust the path as needed

interface GetCropAnimalsResponse {
  crop_animals: CropAnimal[];
}

export const getCropAnimals = async (
  id: number
): Promise<GetCropAnimalsResponse> => {
  const response = await axiosInstance.get<GetCropAnimalsResponse>(
    `/crop_animals`
  );
  return response.data;
};
