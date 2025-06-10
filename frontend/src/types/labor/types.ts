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
  id: number;
  name: string;
  field_id: number;
  planting_date: string;
  harvest_date?: string;
  field_area: number;
  season_type: string;
  planting_density: number;
  current_stage: string;
  status: string;
  description?: string;
  variety: string;
  source?: string;
  expected_yield?: number;
  location?: string;
  created_at: string;
  updated_at: string;
  harvests?: Harvest[];
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
