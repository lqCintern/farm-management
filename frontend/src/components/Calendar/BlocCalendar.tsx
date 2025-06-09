import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { format, addDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FarmActivity } from "@/types/labor/types";
import FlipPage from 'react-flip-page';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Import styles
import { Typography, Tooltip, Modal, Spin } from 'antd';
import { EnvironmentOutlined, CloudOutlined, DownOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import CurrentWeather from '@/components/Weather/CurrentWeather';
import HourlyForecast from '@/components/Weather/HourlyForecast';
import weatherService from '@/services/weatherService';

const { Text } = Typography;

// Tự implement hàm thay thế eachDayOfInterval
const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// Helper function để format với locale
const formatVN = (date: Date, formatStr: string) => {
  // @ts-ignore
  return format(date, formatStr, { locale: vi });
};

// Định nghĩa props interface
interface BlocCalendarProps {
  farmActivities: FarmActivity[];
  laborRequests?: any[];
  onDateClick: (date: Date) => void;
  weatherEnabled?: boolean; // Thêm prop để bật/tắt tính năng thời tiết
}

// Interface cho phương thức public của BlocCalendar
export interface BlocCalendarHandle {
  goToToday: () => void;
  goToDate: (date: Date) => void;
}

// Định nghĩa component với forwardRef
const BlocCalendar = forwardRef<BlocCalendarHandle, BlocCalendarProps>(
  function BlocCalendar({ farmActivities, laborRequests = [], onDateClick, weatherEnabled = true }, ref) {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [pages, setPages] = useState<Date[]>([]);
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [weatherData, setWeatherData] = useState<Record<string, any>>({});
    const [loadingWeather, setLoadingWeather] = useState<boolean>(false);
    const [weatherError, setWeatherError] = useState<string | null>(null);
    const [showWeatherModal, setShowWeatherModal] = useState<boolean>(false);
    const [selectedDateForWeather, setSelectedDateForWeather] = useState<Date | null>(null);
    const flipPageRef = useRef<any>(null);
    const [currentPage, setCurrentPage] = useState(0);
    // Thêm state để theo dõi lần init đầu tiên
    const [initialized, setInitialized] = useState(false);
    
    // Tạo danh sách các ngày để hiển thị
    useEffect(() => {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(addDays(currentDate, 60)); // Hiển thị 2 tháng
      
      const daysArray = getDatesBetween(startDate, endDate);
      setPages(daysArray);
      
      // Chỉ nhảy tới ngày hiện tại khi lần đầu khởi tạo
      if (!initialized) {
        const today = new Date();
        const todayIndex = daysArray.findIndex(date => isSameDay(date, today));
        
        if (todayIndex !== -1 && flipPageRef.current) {
          setTimeout(() => {
            try {
              flipPageRef.current.gotoPage(todayIndex);
              setCurrentPage(todayIndex);
              setInitialized(true); // Đánh dấu đã khởi tạo
            } catch (error) {
              console.error("Error navigating to today's page", error);
            }
          }, 500);
        } else {
          setInitialized(true); // Vẫn đánh dấu đã khởi tạo nếu không tìm thấy hôm nay
        }
      }
    }, [currentDate, initialized]);

    // Kết hợp tất cả các sự kiện
    useEffect(() => {
      // Xử lý Farm Activities
      const farmActivityEvents = farmActivities.map((activity) => ({
        id: `activity-${activity.id}`,
        title: activity.description,
        start: new Date(activity.start_date),
        end: new Date(activity.end_date),
        extendedProps: {
          type: "farm_activity",
          activity_type: activity.activity_type,
          status: activity.status,
          icon: "🌱",
        },
      }));

      // Xử lý Labor Requests
      const laborRequestEvents = laborRequests.map((request) => ({
        id: `labor-${request.id}`,
        title: request.title,
        start: new Date(request.start_date),
        end: new Date(request.end_date),
        extendedProps: {
          type: "labor_request",
          request_type: request.request_type,
          status: request.status,
          icon: "👥",
        },
      }));

      setAllEvents([...farmActivityEvents, ...laborRequestEvents]);
    }, [farmActivities, laborRequests]);

    // Fetch dữ liệu thời tiết cho 7 ngày sắp tới
    useEffect(() => {
      if (!weatherEnabled) return;
      
      const fetchWeatherData = async () => {
        try {
          setLoadingWeather(true);
          const response = await weatherService.fetchWeatherForecast({});
          
          if (response && response.status === "success") {
            // Tạo một object với key là ngày tháng và value là dữ liệu thời tiết
            const weatherByDate: Record<string, any> = {};
            
            // Xử lý dữ liệu thời tiết hàng ngày
            if (response.data && response.data.daily) {
              response.data.daily.forEach((day: any) => {
                const date = typeof day.dt === 'string' ? new Date(day.dt) : new Date(day.dt * 1000);
                const dateKey = format(date, 'yyyy-MM-dd');
                
                weatherByDate[dateKey] = {
                  ...weatherByDate[dateKey] || {},
                  daily: day
                };
              });
            }
            
            // Xử lý dữ liệu thời tiết giờ, nhóm theo ngày
            if (response.data && response.data.hourly) {
              response.data.hourly.forEach((hour: any) => {
                const date = typeof hour.dt === 'string' ? new Date(hour.dt) : new Date(hour.dt * 1000);
                const dateKey = format(date, 'yyyy-MM-dd');
                
                if (!weatherByDate[dateKey]) {
                  weatherByDate[dateKey] = { hourly: [] };
                } else if (!weatherByDate[dateKey].hourly) {
                  weatherByDate[dateKey].hourly = [];
                }
                
                weatherByDate[dateKey].hourly.push(hour);
              });
            }
            
            // Thêm dữ liệu thời tiết hiện tại cho ngày hôm nay
            const today = format(new Date(), 'yyyy-MM-dd');
            if (response.data && response.data.current) {
              weatherByDate[today] = {
                ...weatherByDate[today] || {},
                current: response.data.current
              };
            }
            
            setWeatherData(weatherByDate);
          } else {
            setWeatherError(response?.message || "Không thể tải dữ liệu thời tiết");
          }
        } catch (error) {
          console.error("Error fetching weather data:", error);
          setWeatherError("Lỗi kết nối tới dịch vụ thời tiết");
        } finally {
          setLoadingWeather(false);
        }
      };
      
      fetchWeatherData();
    }, [weatherEnabled]);
    
    // Tìm các sự kiện cho một ngày cụ thể
    const getEventsForDate = (date: Date) => {
      return allEvents.filter(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        return (
          (date >= eventStart && date <= eventEnd) || 
          isSameDay(date, eventStart) ||
          isSameDay(date, eventEnd)
        );
      });
    };

    // Hàm để lấy thông tin thời tiết cho một ngày cụ thể
    const getWeatherForDate = (date: Date) => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return weatherData[dateKey];
    };
    
    // Xử lý khi click vào ngày
    const handleDateClick = (date: Date) => {
      onDateClick(date);
    };

    // Đi đến trang trước
    const handlePrevPage = () => {
      if (flipPageRef.current && currentPage > 0) {
        try {
          flipPageRef.current.gotoPreviousPage();
        } catch (error) {
          console.error("Error navigating to previous page:", error);
        }
      }
    };

    // Đi đến trang tiếp theo
    const handleNextPage = () => {
      if (flipPageRef.current && currentPage < pages.length - 1) {
        try {
          flipPageRef.current.gotoNextPage();
        } catch (error) {
          console.error("Error navigating to next page:", error);
        }
      }
    };

    // Xử lý khi lật trang
    const handlePageFlip = (pageIndex: number) => {
      setCurrentPage(pageIndex);
      if (pageIndex < pages.length) {
        setCurrentDate(pages[pageIndex]);
      }
    };

    // Xử lý khi click vào sự kiện cụ thể
    const handleEventClick = (event: any) => {
      const eventId = event.id;
      
      // Phân biệt loại sự kiện dựa vào prefix trong id hoặc type
      if (eventId.startsWith('activity-') || event.extendedProps?.type === 'farm_activity') {
        // Lấy ID thực (bỏ prefix 'activity-')
        const activityId = eventId.startsWith('activity-') ? eventId.replace('activity-', '') : eventId;
        // Chuyển hướng đến trang chi tiết hoạt động nông trại
        navigate(`/farm-activities/${activityId}`);
      } 
      else if (eventId.startsWith('labor-') || event.extendedProps?.type === 'labor_request') {
        // Lấy ID thực (bỏ prefix 'labor-')
        const requestId = eventId.startsWith('labor-') ? eventId.replace('labor-', '') : eventId;
        // Chuyển hướng đến trang chi tiết yêu cầu nhân công
        navigate(`/labor/requests/${requestId}`);
      }
    };

    // Thêm hàm để nhảy tới ngày hôm nay
    const goToToday = () => {
      const today = new Date();
      const todayIndex = pages.findIndex(date => isSameDay(date, today));
      
      if (todayIndex !== -1 && flipPageRef.current) {
        try {
          flipPageRef.current.gotoPage(todayIndex);
          setCurrentPage(todayIndex);
          setCurrentDate(today);
        } catch (error) {
          console.error("Error navigating to today's page", error);
        }
      }
    };
    
    // Thêm hàm xử lý chọn ngày từ DatePicker
    const handleDateSelect = (date: Date | null) => {
      if (!date) return;
      
      const selectedIndex = pages.findIndex(pageDate => isSameDay(pageDate, date));
      
      if (selectedIndex !== -1 && flipPageRef.current) {
        try {
          flipPageRef.current.gotoPage(selectedIndex);
          setCurrentPage(selectedIndex);
          // Không gọi setCurrentDate ở đây để tránh trigger useEffect
        } catch (error) {
          console.error("Error navigating to selected date", error);
        }
      } else {
        // Nếu ngày không nằm trong phạm vi hiện tại, mới cập nhật currentDate
        setCurrentDate(date);
      }
    };
    
    // Hàm mở modal xem chi tiết thời tiết
    const showWeatherDetails = (date: Date) => {
      setSelectedDateForWeather(date);
      setShowWeatherModal(true);
    };

    // Expose các phương thức cho component cha
    useImperativeHandle(ref, () => ({
      goToToday,
      goToDate: handleDateSelect
    }));

    // Render nội dung trang
    const renderPageContent = (date: Date) => {
      if (!date) return null;
      
      const events = getEventsForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();
      const weather = weatherEnabled ? getWeatherForDate(date) : null;
      
      // Format date with locale
      const weekdayName = formatVN(date, 'EEEE');
      const dayNumber = format(date, 'd');
      const monthYear = formatVN(date, 'MMMM yyyy');

      // Phân loại sự kiện theo loại
      const farmActivities = events.filter(event => event.extendedProps?.type === 'farm_activity');
      const laborRequests = events.filter(event => event.extendedProps?.type === 'labor_request');
      
      // Cập nhật bảng màu gradient thời tiết
      const getWeatherBackground = () => {
        if (!weather || !weather.daily) return 'from-blue-500 to-blue-400';
        
        const weatherCondition = weather.daily.weather_condition || '';
        const temp = weather.daily.temp_max || 0;
        
        if (weatherCondition.includes('Rain')) return 'from-indigo-600 to-blue-500';
        if (weatherCondition.includes('Cloud')) return 'from-blue-300 to-gray-400';
        if (weatherCondition.includes('Clear') && temp > 30) return 'from-amber-400 to-orange-300';
        if (weatherCondition.includes('Clear')) return 'from-sky-400 to-blue-300';
        if (weatherCondition.includes('Snow')) return 'from-blue-100 to-gray-200';
        
        return 'from-blue-500 to-blue-400';
      };
      
      // Biểu tượng thời tiết tùy chỉnh
      const getWeatherIcon = () => {
        if (!weather || !weather.daily) return null;
        return weather.daily.weather_icon ? 
          <img 
            src={`https://openweathermap.org/img/wn/${weather.daily.weather_icon}.png`}
            alt={weather.daily.weather_description}
            className="w-8 h-8 inline-block"
          /> : <CloudOutlined />;
      };

      return (
        <div 
          className={`bloc-calendar-page ${isToday ? 'today' : ''}`}
          onClick={() => handleDateClick(date)}
        >
          <div className={`page-content ${isToday ? 'bg-yellow-50' : 'bg-white'} border shadow-sm h-full flex flex-col rounded-lg`}>
            {/* Header ngày với thông tin thời tiết - thêm rounded-t-lg và giảm padding */}
            <div className={`flex flex-col items-center justify-center p-3 border-b bg-gradient-to-b ${getWeatherBackground()} text-white rounded-t-lg`}>
              <div className="text-xs uppercase tracking-wide">{monthYear}</div>
              <div className="text-4xl font-bold mb-1">{dayNumber}</div>
              <div className="text-sm font-medium capitalize">{weekdayName}</div>
              
              {/* Hiển thị thông tin thời tiết cơ bản nếu có */}
              {weather && weather.daily && (
                <Tooltip title="Xem chi tiết thời tiết">
                  <div 
                    className="weather-preview mt-2 flex items-center bg-white/20 px-3 py-1 rounded-full cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      showWeatherDetails(date);
                    }}
                  >
                    {getWeatherIcon()}
                    <Text className="text-white font-medium ml-1">
                      {Math.round(weather.daily.temp_max)}°
                      <span className="text-white/70 text-xs ml-1">
                        {Math.round(weather.daily.temp_min)}°
                      </span>
                      {weather.daily.pop > 30 && (
                        <span className="ml-2 text-xs">
                          💧 {weather.daily.pop}%
                        </span>
                      )}
                    </Text>
                  </div>
                </Tooltip>
              )}
            </div>

            {/* Nội dung sự kiện của ngày */}
            <div className="flex-1 p-3 overflow-y-auto">
              {events.length === 0 ? (
                <div className="text-center text-gray-500 py-6">
                  Không có hoạt động
                </div>
              ) : (
                <div className="space-y-2">
                  {farmActivities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 mb-1">Hoạt động canh tác:</h3>
                      {farmActivities.map((event, index) => (
                        <div 
                          key={`farm-${index}`} 
                          className="text-xs p-1.5 mb-1 rounded bg-blue-50 border border-blue-100 text-blue-900 hover:bg-blue-100 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                        >
                          <span className="mr-1">{event.extendedProps.icon}</span>
                          {event.title}
                        </div>
                      ))}
                    </div>
                  )}

                  {laborRequests.length > 0 && (
                    <div className="mt-2">
                      <h3 className="text-sm font-medium text-pink-800 mb-1">Yêu cầu nhân công:</h3>
                      {laborRequests.map((event, index) => (
                        <div 
                          key={`labor-${index}`} 
                          className="text-xs p-1.5 mb-1 rounded bg-pink-50 border border-pink-100 text-pink-900 hover:bg-pink-100 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                        >
                          <span className="mr-1">{event.extendedProps.icon}</span>
                          {event.title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer - giảm padding */}
            <div className="p-1.5 border-t text-xs text-center text-gray-600 bg-gray-50 rounded-b-lg">
              {isToday ? '📌 Hôm nay' : (
                weather && weather.daily ? (
                  <span className="flex items-center justify-center">
                    <span className="mr-1">💡</span> 
                    {weather.daily.weather_condition === 'Rain' ? 'Có mưa, chuẩn bị dụng cụ che chắn' : 
                     weather.daily.temp_max > 32 ? 'Nắng nóng, nhớ bổ sung nước cho cây' : 
                     'Kiểm tra thời tiết trước khi làm việc ngoài trời'}
                  </span>
                ) : '💡 Tip: Kiểm tra thời tiết trước khi làm việc ngoài trời'
              )}
            </div>
          </div>
        </div>
      );
    };
    
    // Render modal thông tin thời tiết chi tiết
    const renderWeatherModal = () => {
      if (!selectedDateForWeather) return null;
      
      const dateKey = format(selectedDateForWeather, 'yyyy-MM-dd');
      const weather = weatherData[dateKey];
      const formattedDate = formatVN(selectedDateForWeather, 'EEEE, dd/MM/yyyy');
      
      return (
        <Modal
          title={`Thời tiết: ${formattedDate}`}
          open={showWeatherModal}
          onCancel={() => setShowWeatherModal(false)}
          footer={null}
          width={700}
        >
          {loadingWeather ? (
            <div className="text-center py-10">
              <Spin size="large" />
              <div className="mt-3">Đang tải dữ liệu thời tiết...</div>
            </div>
          ) : weather ? (
            <div className="weather-details">
              {/* Thời tiết hiện tại */}
              {weather.current && (
                <div className="current-weather mb-4">
                  <h3 className="text-lg font-medium mb-2">Thời tiết hiện tại</h3>
                  <CurrentWeather data={weather.current} />
                </div>
              )}
              
              {/* Dự báo theo giờ */}
              {weather.hourly && weather.hourly.length > 0 && (
                <div className="hourly-forecast mb-4">
                  <h3 className="text-lg font-medium mb-2">Dự báo theo giờ</h3>
                  <HourlyForecast data={weather.hourly} />
                </div>
              )}
              
              {/* Thông tin nông nghiệp */}
              <div className="agriculture-tips mt-5 p-4 bg-green-50 rounded-lg border border-green-100">
                <h3 className="text-green-800 font-medium">Lời khuyên canh tác:</h3>
                <ul className="mt-2 space-y-1">
                  {weather.daily && weather.daily.weather_condition === 'Rain' && (
                    <>
                      <li>• Hạn chế phun thuốc trong thời tiết mưa</li>
                      <li>• Kiểm tra hệ thống thoát nước cho cây trồng</li>
                      <li>• Có thể trì hoãn công việc làm đất và gieo hạt</li>
                    </>
                  )}
                  {weather.daily && weather.daily.temp_max > 32 && (
                    <>
                      <li>• Bổ sung nước đầy đủ cho cây vào buổi sáng sớm hoặc chiều muộn</li>
                      <li>• Tránh làm việc ngoài trời từ 11h đến 15h</li>
                      <li>• Tạo bóng râm cho cây non và cây mới trồng</li>
                    </>
                  )}
                  {weather.daily && weather.daily.wind_speed > 7 && (
                    <>
                      <li>• Gió mạnh có thể ảnh hưởng đến việc phun thuốc và phân bón</li>
                      <li>• Kiểm tra hệ thống đỡ cây để tránh gãy đổ</li>
                    </>
                  )}
                  <li>• Cập nhật thông tin thời tiết thường xuyên để lên kế hoạch canh tác hiệu quả</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-5">
              <Text type="secondary">
                Không có dữ liệu thời tiết cho ngày này. Vui lòng thử lại sau.
              </Text>
            </div>
          )}
        </Modal>
      );
    };

    return (
      <div className="bloc-calendar-container bg-white rounded-lg shadow-md p-4 w-full">
        <div className="flex flex-col mb-4 space-y-3">
          {/* Hàng 1: Controls chính */}
          <div className="flex justify-between items-center">
            <button 
              className={`px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                          flex items-center gap-1 transition-all ${
                            currentPage <= 0 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
              onClick={handlePrevPage}
              disabled={currentPage <= 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Trước
            </button>
            <h3 className="text-lg font-semibold text-gray-700">
              {pages.length > 0 && currentPage < pages.length 
                ? formatVN(pages[currentPage], 'MMMM yyyy')
                : 'Lịch bloc'}
            </h3>
            <button 
              className={`px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                          flex items-center gap-1 transition-all ${
                            currentPage >= pages.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
              onClick={handleNextPage}
              disabled={currentPage >= pages.length - 1}
            >
              Sau
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Hàng 2: DatePicker và nút Hôm nay */}
          <div className="flex justify-between items-center">
            <div className="datepicker-container" style={{ width: '180px' }}>
              <DatePicker
                selected={pages[currentPage]}
                onChange={handleDateSelect}
                dateFormat="dd/MM/yyyy"
                className="px-3 py-1 border border-gray-300 rounded w-full text-sm"
                placeholderText="Chọn ngày..."
              />
            </div>
            <button 
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              onClick={goToToday}
            >
              Hôm nay
            </button>
          </div>
        </div>

        <div className="relative mx-auto calendar-wrapper" style={{ height: '450px', maxWidth: '350px' }}>
          {pages.length > 0 ? (
            <FlipPage
              ref={flipPageRef}
              className="bloc-calendar"
              orientation="vertical"
              width={350}
              height={450}
              uncutPages={false}
              animationDuration={400}
              showSwipeHint={false}
              style={{ margin: '0 auto' }}
              onPageChange={handlePageFlip}
              pageBackground="#f8fafc"
              treshold={10}
              maxAngle={25}
            >
              {pages.map((date, index) => (
                <div key={index} className="calendar-page">
                  {renderPageContent(date)}
                </div>
              ))}
            </FlipPage>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
              <p className="text-gray-500">Đang tải lịch...</p>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-600 mt-4">
          <p>Kéo góc trang để lật sang ngày tiếp theo hoặc sử dụng các nút điều hướng</p>
        </div>
        
        {/* Hiển thị modal thời tiết chi tiết */}
        {renderWeatherModal()}

        {/* Giữ lại styles cũ và thêm styles mới */}
        <style>{`
          .calendar-wrapper {
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            border-radius: 8px;
          }
          
          .calendar-page {
            padding: 0;
            width: 100%;
            height: 100%;
            transform-origin: top center;
          }
          
          .page-content {
            border-radius: 8px;
            overflow: hidden;
            height: 100%;
            transition: all 0.3s;
          }
          
          .bloc-calendar-page.today .page-content {
            box-shadow: 0 0 0 2px #f59e0b;
          }
          
          .weather-preview {
            transition: all 0.2s;
            backdrop-filter: blur(8px);
            background-color: rgba(255,255,255,0.2);
          }
          
          .weather-preview:hover {
            background-color: rgba(255,255,255,0.3);
            transform: scale(1.05);
          }
          
          /* Cải thiện hiệu ứng cho các sự kiện */
          .text-center .text-xs.p-1\.5 {
            transition: all 0.2s;
          }
          .text-center .text-xs.p-1\.5:hover {
            transform: translateX(3px);
          }
        `}</style>
      </div>
    );
  }
);

// Đặt displayName cho forwardRef component giúp trong việc debug
BlocCalendar.displayName = 'BlocCalendar';

export default BlocCalendar;
