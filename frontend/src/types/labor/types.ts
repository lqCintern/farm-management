// filepath: /home/lqccql/DATN/farm-management/frontend/src/types.ts

// Thêm các định nghĩa loại liên quan đến hoạt động nông trại

export interface Harvest {
  id?: number;
  date: string;
  quantity: number;
  notes?: string;
}

export interface FarmActivity {
  id?: number;
  activity_type: number | string;
  description: string;
  start_date: string;
  end_date: string;
  frequency: number;
  status?: number | string;
  field_id: number;
  crop_animal_id?: number;
  materials?: Record<string, any>;
    labor_requests?: {
    id: number;
    title: string;
    status: string;
    start_date: string;
    end_date: string;
  }[];
  actual_notes?: string;
    status_details?: {
    starting_soon?: boolean;
  };
  actual_completion_date?: string;
}

export interface Pagination {
  current_page: number;
  next_page: number | null;
  prev_page: number | null;
  total_pages: number;
  total_items: number;
}

export interface PaginationMetadata {
  current_page: number;
  total_items: number;
  total_pages: number;
  items_per_page: number;
}

export interface PineappleCrop {
  id?: number;
  name?: string;
  crop_type?: number;
  field_id?: number | string;
  planting_date: string;
  harvest_date?: string;
  field_area?: number;
  season_type?: string;
  planting_density?: number;
  status?: string;
  current_stage: string;
  current_stage_start_date?: string;
  description?: string;
  location?: string | null;
  variety?: string;
  source?: string;
  user_id?: number;
  quantity?: number | null;
  expected_yield?: number | null;
  actual_yield?: string;
  completion_percentage?: string;
  
  // Ngày quan trọng trong chu kỳ canh tác
  land_preparation_date?: string;
  expected_flower_date?: string;
  actual_flower_date?: string | null;
  flower_treatment_date?: string;
  tie_date?: string;
  
  // Dữ liệu bổ sung
  fertilizer_schedule?: any;
  farm_activities?: Array<FarmActivity>;
  harvests?: Harvest[];
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  
  // Hỗ trợ trường hợp nested (từ API field)
  currentCrop?: PineappleCrop;
}

export interface PineappleCropCreateParams {
  pineapple_crop: {
    name: string;
    field_id: number;
    planting_date: string;
    field_area: number;
    season_type: string;
    planting_density: number;
    current_stage: string;
    status: string;
    description?: string;
    variety: string;
    source?: string;
  }
}

export interface PineappleCropResponse {
  items: PineappleCrop[];  // Thay đổi từ data thành items
  pagination: PaginationMetadata;
}

export interface PineappleCropPreviewResponse {
  preview_activities: FarmActivity[];
}

export interface FarmActivityResponse {
  farm_activities: FarmActivity[];
  pagination: PaginationMetadata;
}
