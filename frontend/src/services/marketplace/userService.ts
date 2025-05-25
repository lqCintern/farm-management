import axiosInstance from '@/utils/axiosConfig';

export const verifyUser = async (userId: number) => {
  const response = await axiosInstance.get(`/marketplace/users/${userId}/verify`);
  return response.data;
};