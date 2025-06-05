import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Check, Trash2 } from 'react-feather';
import { 
  getNotifications, 
  markAsRead,
  markAsUnread, 
  markAllAsRead,
  deleteNotification,
  Notification,
  NotificationResponse
} from '@/services/notifications/notificationService';

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });
  
  const navigate = useNavigate();
  
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const params: {
        page: number;
        per_page: number;
        category?: string;
        status?: 'read' | 'unread';
      } = {
        page: pagination.currentPage,
        per_page: 20
      };
      
      if (activeCategory !== 'all') {
        params.category = activeCategory;
      }
      
      if (activeTab === 'unread') {
        params.status = 'unread';
      }
      
      const response = await getNotifications(params);

      setNotifications(response.notifications);
      setPagination({
        currentPage: response.pagination.current_page,
        totalPages: response.pagination.total_pages,
        totalCount: response.pagination.total_items
      });
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchNotifications();
  }, [activeTab, activeCategory, pagination.currentPage]);
  
  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };
  
  const handleMarkAsUnread = async (id: number) => {
    try {
      await markAsUnread(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: false } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as unread', error);
    }
  };
  
  const handleMarkAllAsRead = async () => {
    try {
      const category = activeCategory !== 'all' ? activeCategory : undefined;
      await markAllAsRead(category);
      
      if (activeTab === 'unread') {
        // Refresh to show updated list
        fetchNotifications();
      } else {
        // Just mark all as read in UI
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };
  
  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  };
  
  const handlePageChange = (page: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page
    }));
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Thông báo</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Đánh dấu tất cả đã đọc
          </button>
          <button
            onClick={() => navigate('/notifications/settings')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cài đặt thông báo
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-4 border-b">
        <button
          className={`px-4 py-2 ${activeTab === 'all' ? 'border-b-2 border-blue-500 font-medium text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('all')}
        >
          Tất cả
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'unread' ? 'border-b-2 border-blue-500 font-medium text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('unread')}
        >
          Chưa đọc
        </button>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          className={`px-3 py-1 rounded-full ${activeCategory === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => setActiveCategory('all')}
        >
          Tất cả
        </button>
        <button
          className={`px-3 py-1 rounded-full ${activeCategory === 'farm' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => setActiveCategory('farm')}
        >
          Canh tác
        </button>
        <button
          className={`px-3 py-1 rounded-full ${activeCategory === 'labor' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => setActiveCategory('labor')}
        >
          Đổi công
        </button>
        <button
          className={`px-3 py-1 rounded-full ${activeCategory === 'marketplace' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => setActiveCategory('marketplace')}
        >
          Thị trường
        </button>
        <button
          className={`px-3 py-1 rounded-full ${activeCategory === 'supply' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => setActiveCategory('supply')}
        >
          Vật tư
        </button>
      </div>

      {/* Notifications list */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Không có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 border rounded-lg flex items-start ${!notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
            >
              <div className="mr-4 text-xl self-center">
                {notification.icon}
              </div>
              <div 
                className="flex-1" 
                onClick={() => navigate(notification.action_url || `/notifications/${notification.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex justify-between">
                  <h3 className="font-medium">{notification.title}</h3>
                  <span className="text-sm text-gray-500">
                    {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{notification.message}</p>
                <div className="mt-2 text-sm">
                  <span className={`inline-block px-2 py-1 rounded-full mr-2 ${getCategoryColor(notification.category)}`}>
                    {getCategoryName(notification.category)}
                  </span>
                  {notification.sender_name !== "Hệ thống" && (
                    <span className="text-gray-500">Từ: {notification.sender_name}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center ml-4">
                {notification.read ? (
                  <button
                    onClick={() => handleMarkAsUnread(notification.id)}
                    className="p-2 text-gray-400 hover:text-blue-600"
                    title="Đánh dấu chưa đọc"
                  >
                    <Check size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="p-2 text-gray-400 hover:text-green-600"
                    title="Đánh dấu đã đọc"
                  >
                    <Check size={18} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notification.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                  title="Xóa thông báo"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="inline-flex rounded-md shadow">
            <button
              disabled={pagination.currentPage === 1}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              className="px-3 py-1 rounded-l-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 border-t border-b border-gray-300 ${
                  page === pagination.currentPage
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              className="px-3 py-1 rounded-r-md bg-white border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              Sau
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getCategoryColor(category: string): string {
  switch (category) {
    case 'farm':
      return 'bg-green-100 text-green-800';
    case 'labor':
      return 'bg-blue-100 text-blue-800';
    case 'marketplace':
      return 'bg-yellow-100 text-yellow-800';
    case 'supply':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getCategoryName(category: string): string {
  switch (category) {
    case 'farm':
      return 'Canh tác';
    case 'labor':
      return 'Đổi công';
    case 'marketplace':
      return 'Thị trường';
    case 'supply':
      return 'Vật tư';
    default:
      return 'Hệ thống';
  }
}

export default NotificationsPage;