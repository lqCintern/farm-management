export interface SocketEvent {
  type: string;
  data: any;
  timestamp: number;
}

export interface SocketMessage {
  id: string;
  conversation_id: string;
  user_id: number;
  content: string | { content: string };
  created_at: string;
  read?: boolean;
  read_at?: string;
  image_url?: string;
  type?: 'text' | 'image' | 'payment' | 'schedule';
  payment_info?: {
    amount: number;
    date: string;
    notes?: string;
  };
  metadata?: {
    scheduled_date?: string;
    location?: string;
    estimated_quantity?: number;
  };
  user_name?: string;
  user_avatar?: string;
}

export interface SocketNotification {
  id: string;
  user_id: number;
  type: string;
  title: string;
  message: string;
  data: any;
  created_at: string;
}

export interface SocketActivity {
  id: string;
  type: string;
  status: string;
  data: any;
  created_at: string;
}

export interface SocketInventory {
  id: string;
  product_id: string;
  quantity: number;
  updated_at: string;
}

export interface SocketWeather {
  location: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  updated_at: string;
}

export interface SocketLabor {
  id: string;
  user_id: number;
  status: string;
  location: string;
  updated_at: string;
}

export interface SocketPrice {
  product_id: string;
  price: number;
  currency: string;
  updated_at: string;
}

export interface SocketEquipment {
  id: string;
  status: string;
  location: string;
  maintenance_status: string;
  updated_at: string;
}

export interface SocketBalance {
  user_id: number;
  amount: number;
  currency: string;
  updated_at: string;
}

export interface SocketDocument {
  id: string;
  type: string;
  status: string;
  updated_at: string;
}

export interface SocketSystem {
  status: string;
  message: string;
  updated_at: string;
} 