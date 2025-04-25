// filepath: /home/lqccql/DATN/farm-management/frontend/src/types.ts

// Thêm các định nghĩa loại liên quan đến hoạt động nông trại

export interface FarmActivity {
  id: number;
  activity_type: number;
  description: string;
  start_date: string;
  end_date: string;
  status_label: string;
  status_details: {
    starting_soon: boolean;
    ending_soon: boolean;
    overdue: boolean;
    overdue_days: number;
  };
  notes?: string;
  completion_date?: string;
  completion_note?: string;
  crop_animal?: {
    id: number;
    name: string;
    type: string;
  };
}

export interface Pagination {
  current_page: number;
  next_page: number | null;
  prev_page: number | null;
  total_pages: number;
  total_items: number;
}

export interface FarmActivityResponse {
  farm_activities: FarmActivity[];
  pagination: Pagination;
}
