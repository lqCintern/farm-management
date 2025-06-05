import React, { useState, useEffect } from 'react';
import { 
  getNotificationSettings, 
  updateNotificationSetting,
  resetNotificationSettings,
  NotificationSetting
} from '@/services/notifications/notificationService';
import { RefreshCw } from 'react-feather';

const NotificationSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{ id: number, status: 'saving' | 'saved' | 'error' } | null>(null);
  
  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await getNotificationSettings();
      setSettings(response);
    } catch (error) {
      console.error('Failed to fetch notification settings', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const handleToggle = async (settingId: number, field: keyof NotificationSetting, value: boolean) => {
    setSaveStatus({ id: settingId, status: 'saving' });
    
    try {
      const updatedSetting = await updateNotificationSetting(settingId, {
        [field]: value
      });
      
      setSettings(prev => 
        prev.map(s => s.id === settingId ? updatedSetting : s)
      );
      
      setSaveStatus({ id: settingId, status: 'saved' });
      
      // Clear status after 2 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 2000);
    } catch (error) {
      console.error(`Failed to update ${field}`, error);
      setSaveStatus({ id: settingId, status: 'error' });
      
      // Clear error status after 3 seconds
      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    }
  };
  
  const handleReset = async () => {
    if (confirm('Bạn có chắc chắn muốn khôi phục cài đặt mặc định?')) {
      setIsLoading(true);
      try {
        const response = await resetNotificationSettings();
        setSettings(response.settings);
      } catch (error) {
        console.error('Failed to reset notification settings', error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Group settings by category
  const getCategorySettings = (category: string): NotificationSetting[] => {
    // Thêm kiểm tra null trước khi gọi .filter()
    if (!settings) {
      return []; // Trả về mảng rỗng nếu settings chưa tải xong
    }
    
    return settings.filter(item => item.category === category);
  };
  
  // Get a specific setting
  const getGeneralSetting = (key: string): any => {
    if (!settings || settings.length === 0) {
      return key === 'id' ? undefined : true; // Default values if settings not loaded
    }

    // Assume the "general" setting is the one with category 'all' and event_type null
    const setting = settings.find(item => item.category === 'all' && item.event_type === null);
    if (key === 'id') {
      return setting ? setting.id : undefined;
    }
    if (!setting) return true;
    if (key === 'in_app_enabled') return setting.in_app_enabled;
    if (key === 'email_enabled') return setting.email_enabled;
    if (key === 'push_enabled') return setting.push_enabled;
    return true;
  };
  
  // Translate category name
  const getCategoryName = (category: string): string => {
    switch (category) {
      case 'farm': return 'Canh tác';
      case 'labor': return 'Đổi công';
      case 'marketplace': return 'Thị trường';
      case 'supply': return 'Vật tư';
      case 'system': return 'Hệ thống';
      case 'all': return 'Tất cả thông báo';
      default: return category;
    }
  };
  
  // Translate event type name
  const getEventTypeName = (eventType: string | null): string => {
    if (!eventType) return 'Tất cả sự kiện';
    
    switch (eventType) {
      case 'activity_reminder': return 'Nhắc nhở hoạt động';
      case 'activity_overdue': return 'Hoạt động quá hạn';
      case 'activity_updated': return 'Cập nhật hoạt động';
      case 'activity_completed': return 'Hoàn thành hoạt động';
      case 'crop_stage_changed': return 'Thay đổi giai đoạn cây trồng';
      case 'harvest_ready': return 'Thu hoạch sẵn sàng';
      case 'new_request': return 'Yêu cầu mới';
      case 'request_updated': return 'Cập nhật yêu cầu';
      case 'assignment_created': return 'Phân công mới';
      case 'assignment_reminder': return 'Nhắc nhở phân công';
      case 'new_order': return 'Đơn hàng mới';
      case 'order_updated': return 'Cập nhật đơn hàng';
      case 'new_message': return 'Tin nhắn mới';
      case 'new_supply_order': return 'Đơn vật tư mới';
      case 'supply_order_updated': return 'Cập nhật đơn vật tư';
      case 'review_reminder': return 'Nhắc nhở đánh giá';
      default: return eventType;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Cài đặt thông báo</h1>
      
      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : !settings ? (
        <div className="text-center py-10">
          <p>Không thể tải cài đặt thông báo. Vui lòng thử lại sau.</p>
        </div>
      ) : (
        <>
          {/* Phần General Settings */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Cài đặt chung</h2>
            <div className="space-y-4">
              {getGeneralSetting('all') && (
                <div className="grid grid-cols-4 gap-4 items-center py-2">
                  <div className="col-span-1 font-medium">Tất cả thông báo</div>
                  <div className="text-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        className="sr-only peer"
                        checked={getGeneralSetting('in_app_enabled')}
                        onChange={(e) => handleToggle(getGeneralSetting('id'), 'in_app_enabled', e.target.checked)}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="text-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        className="sr-only peer"
                        checked={getGeneralSetting('email_enabled')}
                        onChange={(e) => handleToggle(getGeneralSetting('id'), 'email_enabled', e.target.checked)}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="text-center">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox"
                        className="sr-only peer"
                        checked={getGeneralSetting('push_enabled')}
                        onChange={(e) => handleToggle(getGeneralSetting('id'), 'push_enabled', e.target.checked)}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Phần Categories Settings */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Tùy chỉnh thông báo theo loại</h2>
            {['farm', 'labor', 'marketplace', 'supply', 'system'].map(category => (
              <div key={category} className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-lg font-medium mb-4">{getCategoryName(category)}</h2>
                <div className="grid grid-cols-4 gap-4 mb-2 font-medium text-gray-500">
                  <div className="col-span-1">Loại thông báo</div>
                  <div className="text-center">Trong ứng dụng</div>
                  <div className="text-center">Email</div>
                  <div className="text-center">Push</div>
                </div>
                
                {getCategorySettings(category).map(setting => (
                  <div 
                    key={`${setting.id}-${setting.category}-${setting.event_type}`}
                    className="grid grid-cols-4 gap-4 items-center py-2 border-t border-gray-100"
                  >
                    <div className="col-span-1">{getEventTypeName(setting.event_type)}</div>
                    <div className="text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox"
                          className="sr-only peer"
                          checked={setting.in_app_enabled}
                          onChange={(e) => handleToggle(setting.id, 'in_app_enabled', e.target.checked)}
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        
                        {saveStatus && saveStatus.id === setting.id && (
                          <span className={`ml-2 text-sm ${saveStatus.status === 'saved' ? 'text-green-500' : saveStatus.status === 'error' ? 'text-red-500' : 'text-gray-500'}`}>
                            {saveStatus.status === 'saving' ? 'Đang lưu...' : 
                             saveStatus.status === 'saved' ? 'Đã lưu' : 'Lỗi!'}
                          </span>
                        )}
                      </label>
                    </div>
                    <div className="text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox"
                          className="sr-only peer"
                          checked={setting.email_enabled}
                          onChange={(e) => handleToggle(setting.id, 'email_enabled', e.target.checked)}
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="text-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox"
                          className="sr-only peer"
                          checked={setting.push_enabled}
                          onChange={(e) => handleToggle(setting.id, 'push_enabled', e.target.checked)}
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationSettingsPage;