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
  total_items: number;
  low_stock_count: number;
  out_of_stock_count: number;
  categories: number;
  total_cost: number;
  by_category: CategoryStatistic[];
  most_used: MostUsedMaterial[];
  trends: {
    cost_change: number;
  };
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
  unit_price: number;
  total_price: number;
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
    
    return {
      materials: {
        total_items: materialStatsResponse.data.statistics?.total_items || 0,
        low_stock_count: materialStatsResponse.data.statistics?.low_stock_count || 0,
        out_of_stock_count: materialStatsResponse.data.statistics?.out_of_stock_count || 0,
        categories: materialStatsResponse.data.statistics?.categories || 0,
        total_cost: materialStatsResponse.data.statistics?.total_cost || 0,
        by_category: materialStatsResponse.data.statistics?.by_category || [],
        most_used: materialStatsResponse.data.statistics?.most_used || [],
        trend: {
          cost_change: materialStatsResponse.data.statistics?.trends?.cost_change || 0
        }
      },
      material_details: materialStatsResponse.data.details || [],
      monthly_data: materialStatsResponse.data.monthly_data || []
    };
  } catch (error) {
    console.error('Error fetching farm statistics:', error);
    throw error;
  }
};