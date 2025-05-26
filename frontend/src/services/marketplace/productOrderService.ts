import axiosInstance from "@/utils/axiosConfig";

export interface ProductOrder {
  id: number;
  product_listing_id: number;
  buyer_id: number;
  quantity: number;
  price: number;
  status: string;
  note?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  product_listing?: any;
  buyer?: any;
}

export interface ProductOrderParams {
  product_listing_id: number;
  quantity: number;
  price: number;
  note?: string;
}

export const getProductOrders = async (params?: { status?: string }) => {
  try {
    const response = await axiosInstance.get('/marketplace/product_orders', { 
      params 
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching product orders:', error);
    throw error;
  }
};

export const getProductOrderById = async (id: number) => {
  try {
    const response = await axiosInstance.get(`/marketplace/product_orders/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product order details:', error);
    throw error;
  }
};

export const createProductOrder = async (data: { product_order: ProductOrderParams }) => {
  try {
    const response = await axiosInstance.post('/marketplace/product_orders', data);
    return response.data;
  } catch (error) {
    console.error('Error creating product order:', error);
    throw error;
  }
};

export async function updateProductOrderStatus(
  orderId: number, 
  status: 'accept' | 'reject' | 'complete', 
  extraData?: any
) {
  // Sửa endpoint đúng theo route của backend
  const response = await axiosInstance.patch(
  `/marketplace/product_orders/${orderId}`, 
  { status: status, ...extraData }
);
  
  return response.data;
}

export const updateProductOrder = async (
  id: number,
  data: { quantity?: number; price?: number; note?: string }
) => {
  try {
    const response = await axiosInstance.patch(`/marketplace/product_orders/${id}`, {
      product_order: data
    });
    return response.data;
  } catch (error) {
    console.error('Error updating product order:', error);
    throw error;
  }
};