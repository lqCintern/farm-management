export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
export type RequestType = 'exchange' | 'paid' | 'mixed';

export interface FarmHousehold {
  id: number;
  name: string;
  address?: string;
  owner_id: number;
}

export interface LaborRequest {
  id: number;
  title: string;
  description: string;
  workers_needed: number;
  request_type: RequestType;
  rate?: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  status: RequestStatus;
  requesting_household_id: number;
  requesting_household?: FarmHousehold;
  providing_household_id?: number;
  providing_household?: FarmHousehold;
  farm_activity_id?: number;
  parent_request_id?: number;
  request_group_id?: string;
  is_public: boolean;
  max_acceptors?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GroupStatus {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  completed?: number;
  cancelled?: number;
  group_id: string;
  parent_id: number;
}

export interface LaborRequestFormData {
  title: string;
  description: string;
  workers_needed: number;
  request_type: RequestType;
  rate?: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  farm_activity_id?: number;
  providing_household_id?: number;
}

export interface CreateMixedRequestParams {
  labor_request: LaborRequestFormData;
  provider_ids: number[];
  is_public: boolean;
  max_acceptors?: number;
}

export interface LaborRequestResponse {
  success: boolean;
  data: LaborRequest;
}

export interface LaborRequestsResponse {
  success: boolean;
  data: LaborRequest[];
}

export interface CreateMixedRequestResponse {
  success: boolean;
  data: {
    parent_request: LaborRequest;
    child_requests: LaborRequest[];
  };
}

export interface ProcessRequestResponse {
  success: boolean;
  data: {
    request: LaborRequest;
    group_status?: GroupStatus;
  };
}

export interface GroupStatusResponse {
  success: boolean;
  data: GroupStatus;
}