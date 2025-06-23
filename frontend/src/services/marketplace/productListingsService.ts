import axiosInstance from "@/utils/axiosConfig";

// Type definitions
export interface ProductImage {
  id?: number;
  image_url: string;
}

export interface ProductListing {
  id?: number;
  user_id: number;
  crop_animal_id?: number;
  title: string;
  description: string;
  status: number;
  product_type: string;
  quantity?: number;
  total_weight?: number;
  average_size?: number;
  price_expectation?: number;
  province: string;
  district: string;
  ward: string;
  address: string;
  latitude?: number;
  longitude?: number;
  harvest_start_date?: string;
  harvest_end_date?: string;
  view_count?: number;
  message_count?: number;
  order_count?: number;
  created_at?: string;
  updated_at?: string;
  product_images?: ProductImage[];
  estimated_weight?: number;
  seller_name?: string;
  location_text?: string;
  google_maps_url?: string;
  thumbnail?: string;
  seller_detail?: {
    user_name?: string;
    fullname?: string;
    phone?: string;
  };
  pineapple_crop?: {
    variety?: string;
    planting_date?: string;
    current_stage?: string;
    field_id?: string;
  };
}

export interface ProductListingFilters {
  product_type?: string;
  province?: string;
  min_price?: number;
  max_price?: number;
  ready_to_harvest?: boolean;
  user_id?: number;
  query?: string;
  page?: number;
  per_page?: number;
}

// API functions
export const getProductListings = async (filters?: ProductListingFilters) => {
  const response = await axiosInstance.get("/marketplace/product_listings", {
    params: filters,
  });
  return response.data;
};

export const getMyProductListings = async (
  status?: number,
  page = 1,
  per_page = 10
) => {
  const response = await axiosInstance.get("/marketplace/product_listings/my_listings", {
    params: { status, page, per_page },
  });
  return response.data;
};

export const getProductListingById = async (id: number) => {
  const response = await axiosInstance.get(`/marketplace/product_listings/${id}`);
  return response.data;
};

export const createProductListing = async (productData: FormData) => {
  const response = await axiosInstance.post("/marketplace/product_listings", productData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateProductListing = async (id: number, formData: FormData) => {
  console.log("Updating product listing id:", id);
  console.log("Form data keys:", Array.from(formData.keys()));
  
  try {
    // Đảm bảo content type là 'multipart/form-data'
    const response = await axiosInstance.put(
      `/marketplace/product_listings/${id}`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    // Log kết quả trả về từ API
    console.log("API response:", response.data);
    
    return response.data;
  } catch (error) {
    console.error("Error in updateProductListing API call:", error);
    throw error;
  }
};

export const deleteProductListing = async (id: number) => {
  const response = await axiosInstance.delete(`/controllers/api/v1/marketplace/product_listings/${id}`);
  return response.data;
};

export const toggleProductListingStatus = async (
  id: number,
  status: "activate" | "hide" | "draft"
) => {
  const response = await axiosInstance.put(
    `/controllers/api/v1/marketplace/product_listings/${id}/toggle_status`,
    { status }
  );
  return response.data;
};
