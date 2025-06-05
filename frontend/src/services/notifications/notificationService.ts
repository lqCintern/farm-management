import axiosInstance from "@/utils/axiosConfig";

export interface Notification {
  id: number;
  title: string;
  message: string;
  category: string;
  event_type: string;
  priority: string;
  created_at: string;
  read: boolean;
  sender_name: string;
  action_url: string;
  icon: string;
  metadata?: any;
  notifiable_type?: string;
  notifiable_id?: number;
}

export interface NotificationCounts {
  total: number;
  farm: number;
  labor: number;
  marketplace: number;
  supply: number;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    total_pages: number;
    current_page: number;
    total_items: number;
  };
}

export interface NotificationSetting {
  id: number;
  category: string;
  event_type: string | null;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
}

// Lấy danh sách thông báo
export const getNotifications = async (params: {
  page: number;
  per_page: number;
  category?: string;
  status?: 'read' | 'unread';
}): Promise<NotificationResponse> => {
  try {
    const response = await axiosInstance.get<NotificationResponse>('/notifications/notifications', { params });
    console.log('Raw API response:', response.data);
    return response.data; // Make sure you're returning response.data, not just response
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error; // Re-throw to handle in component
  }
};

// Lấy số lượng thông báo chưa đọc
export const getUnreadCount = async (): Promise<{ counts: NotificationCounts }> => {
  const response = await axiosInstance.get<{ data: { counts: NotificationCounts } }>('/notifications/notifications/unread_count');
  return response.data.data;
};

// Đánh dấu một thông báo đã đọc
export const markAsRead = async (id: number): Promise<{ success: boolean, notification: Notification }> => {
  const response = await axiosInstance.post<{ data: { success: boolean, notification: Notification } }>(`/notifications/notifications/${id}/mark_as_read`);
  return response.data.data;
};

// Đánh dấu một thông báo chưa đọc
export const markAsUnread = async (id: number): Promise<{ success: boolean, notification: Notification }> => {
  const response = await axiosInstance.post<{ data: { success: boolean, notification: Notification } }>(`/notifications/notifications/${id}/mark_as_unread`);
  return response.data.data;
};

// Đánh dấu tất cả thông báo đã đọc
export const markAllAsRead = async (category?: string): Promise<{ success: boolean, count: number }> => {
  const response = await axiosInstance.post<{ data: { success: boolean, count: number } }>('/notifications/notifications/mark_all_as_read', { category });
  return response.data.data;
};

// Xóa một thông báo
export const deleteNotification = async (id: number): Promise<{ success: boolean }> => {
  const response = await axiosInstance.delete<{ data: { success: boolean } }>(`/notifications/notifications/${id}`);
  return response.data.data;
};

// Lấy cài đặt thông báo của người dùng
export const getNotificationSettings = async (): Promise<NotificationSetting[]> => {
  const response = await axiosInstance.get<{ data: NotificationSetting[] }>('/notifications/settings');
  return response.data.data;
};

// Cập nhật cài đặt thông báo
export const updateNotificationSetting = async (
  id: number, 
  settings: Partial<NotificationSetting>
): Promise<NotificationSetting> => {
  const response = await axiosInstance.put<{ data: NotificationSetting }>(`/notifications/settings/${id}`, settings);
  return response.data.data;
};

// Khôi phục cài đặt thông báo về mặc định
export const resetNotificationSettings = async (): Promise<{ success: boolean, settings: NotificationSetting[] }> => {
  const response = await axiosInstance.post<{ data: { success: boolean, settings: NotificationSetting[] } }>('/notifications/settings/reset_to_default');
  return response.data.data;
};