import axiosInstance from '@/utils/axiosConfig';
import axios from 'axios';

export const getMarketplaceHarvests = async (params: any = {}) => {
  const response = await axiosInstance.get('/marketplace/harvests', { params });
  return response.data;
};

export const getMarketplaceHarvestById = async (id: number) => {
  const response = await axiosInstance.get(`/marketplace/harvests/${id}`);
  return response.data;
};

export const createMarketplaceHarvest = async (data: any) => {
  const response = await axiosInstance.post('/marketplace/harvests', data);
  return response.data;
};

export const updateMarketplaceHarvest = async (id: number, data: any) => {
  const response = await axiosInstance.put(`/marketplace/harvests/${id}`, data);
  return response.data;
};

export const uploadPaymentProof = async (harvestId: number, formData: FormData) => {
  const response = await axiosInstance.post(
    `/marketplace/harvests/${harvestId}/payment_proof`, 
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const deleteHarvest = async (id: number) => {
  const response = await axiosInstance.delete(`/marketplace/harvests/${id}`);
  return response.data;
};

export const getActiveHarvest = async (productListingId: number) => {
  try {
    const response = await axiosInstance.get(`/marketplace/harvests/active_by_product?product_listing_id=${productListingId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting active harvest:', error);
    throw error;
  }
};

export const getMyHarvests = () =>
  axios.get('/api/v1/marketplace/harvests/my_harvests').then(res => res.data);

export const getHarvestDetail = (id: string) =>
  axios.get(`/api/v1/marketplace/harvests/${id}`).then(res => res.data.harvest);

export const updateHarvestStatus = (id: string, data: any) =>
  axios.patch(`/api/v1/marketplace/harvests/${id}`, data).then(res => res.data);
