// filepath: /Users/chien.le/projects/farm-management/frontend/src/pages/Notifications/NotificationDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowLeft } from 'react-feather';
import axios from '@/utils/axiosConfig';
import { markAsRead, Notification } from '@/services/notifications/notificationService';

const NotificationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchNotificationDetail = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        // Lấy chi tiết thông báo
        const response = await axios.get(`/notifications/notifications/${id}`);
        const notificationData = response.data as Notification;
        setNotification(notificationData);
        
        // Đánh dấu đã đọc
        if (!notificationData.read) {
          await markAsRead(Number(id));
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching notification:', err);
        setError('Không thể tải thông báo. Thông báo có thể đã bị xóa hoặc bạn không có quyền xem.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotificationDetail();
  }, [id]);
  
  const handleActionClick = () => {
    if (notification?.action_url) {
      navigate(notification.action_url);
    }
  };
  
  const getMetadataDisplay = (metadata: any) => {
    if (!metadata) return null;
    
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Thông tin chi tiết:</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(metadata).map(([key, value]) => {
            // Skip internal fields or fields already displayed elsewhere
            if (['id', 'notification_id'].includes(key)) return null;
            
            // Format dates
            if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}(T|\s)/)) {
              value = format(new Date(value as string), 'dd/MM/yyyy HH:mm', { locale: vi });
            }
            
            // Format title for display
            const formattedKey = key
              .replace(/_/g, ' ')
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase());
            
            return (
              <React.Fragment key={key}>
                <div className="text-sm font-medium text-gray-600">{formattedKey}:</div>
                <div className="text-sm text-gray-800">{value as React.ReactNode}</div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !notification) {
    return (
      <div className="container mx-auto px-4 py-10">
        <button 
          onClick={() => navigate('/notifications')}
          className="flex items-center text-blue-600 mb-4"
        >
          <ArrowLeft size={16} className="mr-1" /> Quay lại danh sách thông báo
        </button>
        
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p>{error || 'Không tìm thấy thông báo'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <button 
        onClick={() => navigate('/notifications')}
        className="flex items-center text-blue-600 mb-4"
      >
        <ArrowLeft size={16} className="mr-1" /> Quay lại danh sách thông báo
      </button>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 p-6 border-b">
          <h1 className="text-xl font-bold">{notification.title}</h1>
          <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
            <div>
              <span className="font-medium">Từ:</span> {notification.sender_name}
            </div>
            <div>
              {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="text-gray-800">
            {notification.message}
          </div>
          
          {/* Metadata */}
          {notification.metadata && getMetadataDisplay(notification.metadata)}
          
          {/* Action button */}
          {notification.action_url && (
            <div className="mt-6">
              <button
                onClick={handleActionClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Xem chi tiết
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationDetailPage;
