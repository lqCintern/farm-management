export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  province?: string;
  district?: string;
  rating?: number;
  total_sales?: number;
}

export interface SupplyImage {
  id: number;
  url: string;
  is_main: boolean;
}

export interface SupplyListing {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  discount_price?: number;
  unit: string;
  available_quantity: number;
  min_order_quantity?: number;
  max_order_quantity?: number;
  brand?: string;
  manufacturer?: string;
  origin?: string;
  manufacturing_date?: string;
  expiry_date?: string;
  specifications?: Record<string, string>;
  usage_instructions?: string;
  status: 'active' | 'inactive' | 'out_of_stock';
  province?: string;
  district?: string;
  village?: string;
  created_at: string;
  updated_at: string;
  supplier: Supplier;
  images: SupplyImage[];
  main_image?: string;
}

export interface SupplyOrderItem {
  supply_listing_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export interface SupplyOrder {
  id: number;
  order_number: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'rejected';
  total_amount: number;
  created_at: string;
  updated_at: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  shipping_address: {
    province: string;
    district: string;
    ward: string;
    address: string;
    recipient_name: string;
    phone: string;
  };
  payment_method: string;
  payment_status: 'unpaid' | 'paid' | 'refunded';
  notes?: string;
  cancellation_reason?: string;
  rejection_reason?: string;
  items: SupplyOrderItem[];
  supplier: Supplier;
}

export interface SupplyListingFilter {
  category?: string;
  province?: string;
  district?: string;
  min_price?: number;
  max_price?: number;
  keyword?: string;
  brand?: string;
  sort_by?: 'price_asc' | 'price_desc' | 'newest' | 'popularity';
  page?: number;
  per_page?: number;
}

export interface SupplyOrderFormData {
  items: {
    supply_listing_id: number;
    quantity: number;
    notes?: string;
  }[];
  shipping_address: {
    province: string;
    district: string;
    ward: string;
    address: string;
    recipient_name: string;
    phone: string;
  };
  payment_method: 'cod' | 'bank_transfer' | 'e_wallet';
  notes?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  errors: string[] | Record<string, string[]>;
  message: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
