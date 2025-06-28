import axiosInstance from "@/utils/axiosConfig";

// Interface cho bộ lọc
interface StatisticsFilters {
  startDate?: Date;
  endDate?: Date;
  fieldId?: string;
  cropId?: string;
}

// Interfaces cho cấu trúc dữ liệu trả về từ API
interface MaterialStatistics {
  total_materials: number;
  total_quantity: number;
  total_cost: string;
  by_category: Record<string, number>;
  low_stock: number;
  out_of_stock: number;
  trends?: {
    cost_change: number;
  };
}

interface HarvestStatistics {
  monthly: Record<string, number>;
  by_crop: Record<string, number>;
  by_field: Record<string, number>;
  total_quantity: number;
  harvest_count: number;
  farming_harvests: number;
  marketplace_harvests: number;
  total_revenue: number;
  farming_details: Array<{
    id: number;
    type: string;
    quantity: number;
    harvest_date: string;
    field_name: string | null;
    crop_name: string | null;
    farm_activity_id: number | null;
    farm_activity_type: string | null;
    farm_activity_status: string | null;
    created_at: string;
    revenue: number;
  }>;
  marketplace_details: Array<{
    id: number;
    type: string;
    quantity: number;
    harvest_date: string;
    field_name: string | null;
    crop_name: string | null;
    order_id: number;
    order_title: string;
    buyer_name: string;
    farm_activity_id: number | null;
    farm_activity_type: string | null;
    farm_activity_status: string | null;
    created_at: string;
    revenue: number;
  }>;
}

interface CategoryStatistic {
  name: string;
  category: string;
  inventory_quantity: number;
  planned_usage: number;
  actual_usage: number | null;
  cost: number;
}

interface MostUsedMaterial {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  cost: number;
}

interface MaterialDetail {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  used_date: string;
  activity_name: string;
  field_name: string;
  unit_cost: string | number;
  total_cost: string | number;
}

interface MonthlyData {
  year: number;
  month: number;
  used_quantity: number;
  cost: number;
}

interface MaterialStatsResponse {
  status: string;
  statistics: MaterialStatistics;
  details: MaterialDetail[];
  monthly_data: MonthlyData[];
}

interface HarvestStatsResponse {
  message: string;
  data: HarvestStatistics;
}

export const getFarmStatistics = async (filters: StatisticsFilters = {}) => {
  try {
    // Xử lý các tham số query
    const params: Record<string, string> = {};
    
    // Định dạng ngày tháng cho API
    if (filters.startDate) {
      params.start_date = filters.startDate.toISOString().split('T')[0];
    }
    
    if (filters.endDate) {
      params.end_date = filters.endDate.toISOString().split('T')[0];
    }
    
    if (filters.fieldId) {
      params.field_id = filters.fieldId;
    }
    
    if (filters.cropId) {
      params.crop_id = filters.cropId;
    }
    
    // Gọi API thống kê với type parameter chỉ định kiểu dữ liệu trả về
    const materialStatsResponse = await axiosInstance.get<MaterialStatsResponse>(
      '/farming/farm_materials/statistics', 
      { params }
    );
    
    // Map dữ liệu để phù hợp với MaterialUsageStats component
    const apiStats = materialStatsResponse.data.statistics;
    const apiDetails = materialStatsResponse.data.details;
    
    return {
      materials: {
        total_materials: apiStats?.total_materials || 0,
        total_quantity: apiStats?.total_quantity || 0,
        total_cost: apiStats?.total_cost?.toString() || '0',
        by_category: apiStats?.by_category || {},
        low_stock: apiStats?.low_stock || 0,
        out_of_stock: apiStats?.out_of_stock || 0,
        trend: {
          cost_change: apiStats?.trends?.cost_change || 0
        }
      },
      material_details: apiDetails || [],
      monthly_data: materialStatsResponse.data.monthly_data || []
    };
  } catch (error) {
    console.error('Error fetching farm statistics:', error);
    throw error;
  }
};

export const getHarvestStatistics = async () => {
  try {
    const response = await axiosInstance.get<HarvestStatsResponse>('/farming/harvests/stats');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching harvest statistics:', error);
    throw error;
  }
};