import axiosInstance from "@/utils/axiosConfig";

export interface SupplyOrder {
  id?: number;
  supply_listing_id: number;
  name: string;
  category: string;
  quantity: number;
  note?: string;
  delivery_province: string;
  delivery_district: string;
  delivery_ward: string;
  delivery_address: string;
  contact_phone: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  status: string;
  rejection_reason?: string;

  price: number;
  unit: string;
  description?: string;
}

export interface CreateSupplyOrderRequest {
  supply_listing_id: number;
  supply_order: {
    quantity: number;
    note?: string;
    delivery_province?: string;
    delivery_district?: string;
    delivery_ward?: string;
    delivery_address: string;
    contact_phone: string;
    payment_method: string;
  };
}

const supplyOrderService = {
  // Nông dân: Đặt hàng mới
  createOrder: async (order: CreateSupplyOrderRequest): Promise<any> => {
    const response = await axiosInstance.post("/supply_chain/farmer_supply_orders", order);
    return response.data;
  },

  // Nông dân: Lấy danh sách đơn hàng
  getFarmerOrders: async (params?: any): Promise<any> => {
    const response = await axiosInstance.get("/supply_chain/farmer_supply_orders", { params });
    return response.data;
  },

  // Nông dân: Lấy chi tiết đơn hàng
  getFarmerOrderById: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/supply_chain/farmer_supply_orders/${id}`);
    return response.data;
  },

  // Nông dân: Hủy đơn hàng
  cancelOrder: async (id: number): Promise<any> => {
    const response = await axiosInstance.patch(`/supply_chain/farmer_supply_orders/${id}/cancel`);
    return response.data;
  },

  // Nông dân: Xác nhận đã nhận hàng
  completeOrder: async (orderId: number) => {
    try {
      const response = await axiosInstance.patch(`/supply_chain/farmer_supply_orders/${orderId}/complete`, {});
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Không thể hoàn thành đơn hàng');
      }
      throw error;
    }
  },

  // Nhà cung cấp: Lấy danh sách đơn hàng
  getSupplierOrders: async (params?: any): Promise<any> => {
    const response = await axiosInstance.get("/supply_chain/supply_orders", {
      params,
    });
    return response.data;
  },

  // Nhà cung cấp: Lấy chi tiết đơn hàng
  getSupplierOrderById: async (id: number): Promise<any> => {
    const response = await axiosInstance.get(`/supply_chain/supply_orders/${id}`);
    return response.data;
  },

  // Nhà cung cấp: Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (
    id: number,
    status: string,
    rejection_reason?: string
  ): Promise<any> => {
    const data: any = { status };
    if (rejection_reason) {
      data.rejection_reason = rejection_reason;
    }
    const response = await axiosInstance.put(
      `/supply_chain/supply_orders/${id}`,
      data
    );
    return response.data;
  },

  // Nhà cung cấp: Xem thống kê dashboard
  getSupplierDashboard: async (): Promise<any> => {
    const response = await axiosInstance.get("/dashboard");
    return response.data;
  },
};

export default supplyOrderService;
