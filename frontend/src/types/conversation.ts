import { User } from "./user";

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  read: boolean;
  type: 'text' | 'image' | 'file';
  read_at?: string;
  image_url?: string;
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
}

export interface Conversation {
  id: number;
  product_id: number;
  buyer_id: number;
  seller_id: number;
  created_at: string;
  updated_at: string;
  messages: Message[];
  product?: {
    id: number;
    name: string;
    price: number;
    image_url: string;
  };
  buyer?: {
    id: number;
    fullname: string;
    avatar_url?: string;
  };
  seller?: {
    id: number;
    fullname: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  unread_count: number;
} 