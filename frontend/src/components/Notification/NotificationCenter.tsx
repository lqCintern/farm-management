// frontend/src/components/Notifications/NotificationCenter.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, Check } from 'react-feather';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead,
  Notification,
  NotificationCounts,
  NotificationResponse
} from '@/services/notifications/notificationService';

const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [counts, setCounts] = useState<NotificationCounts>({
    total: 0,
    farm: 0,
    labor: 0,
    marketplace: 0,
    supply: 0
  });
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  // Lấy số lượng thông báo chưa đọc
  const fetchUnreadCounts = async () => {
    try {
      const response = await getUnreadCount();
      setCounts(response.counts);
    } catch (error) {
      console.error('Failed to fetch notification counts', error);
    }
  };
  
  // Lấy danh sách thông báo
  const fetchNotifications = async (category = '') => {
    setIsLoading(true);
    try {
      const params: {
        page: number;
        per_page: number;
        category?: string;
      } = {
        page: 1,
        per_page: 10
      };

      if (category && category !== 'all') {
        params.category = category;
      }

      const response = await getNotifications(params);
      setNotifications(response.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Khởi tạo
  useEffect(() => {
    fetchUnreadCounts();
    
    // Lấy lại số lượng thông báo mỗi phút
    const interval = setInterval(() => {
      fetchUnreadCounts();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Lọc theo danh mục
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(activeFilter !== 'all' ? activeFilter : '');
    }
  }, [isOpen, activeFilter]);
  
  // Đánh dấu đã đọc
  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      fetchUnreadCounts();
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };
  
  // Đánh dấu tất cả đã đọc
  const handleMarkAllAsRead = async () => {
    try {
      const category = activeFilter !== 'all' ? activeFilter : undefined;
      await markAllAsRead(category);
      
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      fetchUnreadCounts();
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };
  
  // Xử lý click vào thông báo
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.action_url) {
      navigate(notification.action_url);
    }
    
    setIsOpen(false);
  };
  
  // Xử lý đóng mở popup
  const toggleNotificationCenter = () => {
    setIsOpen(prev => !prev);
  };
  
  return (
    <div className="relative">
      {/* Button with notification count */}
      <button 
        className="relative p-2 text-gray-600 hover:text-gray-900"
        onClick={toggleNotificationCenter}
      >
        <Bell size={20} />
        {counts.total > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {counts.total > 99 ? '99+' : counts.total}
          </span>
        )}
      </button>
      
      {/* Notification dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-md shadow-lg z-50 max-h-[80vh] overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">Thông báo</h3>
            <button 
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Đánh dấu đã đọc tất cả
            </button>
          </div>
          
          {/* Filter tabs */}
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button 
              className={`px-4 py-2 text-sm ${activeFilter === 'all' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveFilter('all')}
            >
              Tất cả ({counts.total})
            </button>
            <button 
              className={`px-4 py-2 text-sm ${activeFilter === 'farm' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveFilter('farm')}
            >
              Canh tác ({counts.farm})
            </button>
            <button 
              className={`px-4 py-2 text-sm ${activeFilter === 'labor' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveFilter('labor')}
            >
              Đổi công ({counts.labor})
            </button>
            <button 
              className={`px-4 py-2 text-sm ${activeFilter === 'marketplace' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveFilter('marketplace')}
            >
              Thị trường ({counts.marketplace})
            </button>
            <button 
              className={`px-4 py-2 text-sm ${activeFilter === 'supply' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
              onClick={() => setActiveFilter('supply')}
            >
              Vật tư ({counts.supply})
            </button>
          </div>
          
          {/* Notification list */}
          <div className="overflow-y-auto flex-grow">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <BellOff size={36} className="mb-2" />
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer flex ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="mr-4 text-xl">
                    {notification.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{notification.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{notification.message}</div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                      </span>
                      {!notification.read && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Mới
                        </span>
                      )}
                    </div>
                  </div>
                  {notification.read && (
                    <div className="ml-2 text-gray-400">
                      <Check size={16} />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 text-center">
            <button 
              onClick={() => navigate('/notifications')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
