import axiosInstance from "@/utils/axiosConfig";

export interface SupplierReview {
  supply_order_id: number;
  review: {
    rating: number;
    content: string;
  };
}

const reviewService = {
  // Nông dân: Đánh giá nhà cung cấp
  createReview: async (review: SupplierReview): Promise<any> => {
    const response = await axiosInstance.post("/supplier_reviews", review);
    return response.data;
  },

  // Xem đánh giá của nhà cung cấp
  getSupplierReviews: async (
    supplierId: number,
    params?: any
  ): Promise<any> => {
    const response = await axiosInstance.get(
      `/suppliers/${supplierId}/reviews`,
      { params }
    );
    return response.data;
  },
};

export default reviewService;
