import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { format, addDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FarmActivity } from "@/types/labor/types";
import FlipPage from 'react-flip-page';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
      const endDate = endOfMonth(addDays(currentDate, 60));
      const daysArray = getDatesBetween(startDate, endDate);
      setPages(daysArray);
    }, [currentDate]);

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
      if (currentPage > 0 && flipPageRef.current) {
        flipPageRef.current.gotoPage(currentPage - 1);
      }
    };

    // Đi đến trang tiếp theo
    const handleNextPage = () => {
      if (currentPage < pages.length - 1 && flipPageRef.current) {
        flipPageRef.current.gotoPage(currentPage + 1);
      }
    };

    // Xử lý khi lật trang
    const handlePageFlip = (pageIndex: number) => {
      const newDate = pages[pageIndex];
      const prevDate = pages[currentPage];

      // Tiến: Nếu từ ngày cuối tháng sang ngày không phải 1 của tháng mới, tự động sang 1 của tháng mới
      const isEndOfMonth = newDate && prevDate &&
        prevDate.getMonth() !== newDate.getMonth() &&
        prevDate.getDate() === new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).getDate() &&
        newDate.getDate() !== 1;
      if (isEndOfMonth) {
        const firstOfMonthIdx = pages.findIndex(d => d.getMonth() === newDate.getMonth() && d.getDate() === 1);
        if (firstOfMonthIdx !== -1 && flipPageRef.current) {
          flipPageRef.current.gotoPage(firstOfMonthIdx);
          setCurrentPage(firstOfMonthIdx);
          setCurrentDate(pages[firstOfMonthIdx]);
          return;
        }
      }

      // Lùi: Nếu từ ngày 1 của tháng về ngày không phải cuối tháng trước, tự động về cuối tháng trước
      const isStartOfMonth = newDate && prevDate &&
        prevDate.getMonth() !== newDate.getMonth() &&
        prevDate.getDate() === 1 &&
        newDate.getDate() !== new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
      if (isStartOfMonth) {
        const lastOfPrevMonthIdx = pages.findIndex(d => d.getMonth() === prevDate.getMonth() && d.getDate() === new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 0).getDate());
        if (lastOfPrevMonthIdx !== -1 && flipPageRef.current) {
          flipPageRef.current.gotoPage(lastOfPrevMonthIdx);
          setCurrentPage(lastOfPrevMonthIdx);
          setCurrentDate(pages[lastOfPrevMonthIdx]);
          return;
        }
      }

      setCurrentPage(pageIndex);
      setCurrentDate(newDate);
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
      const idx = pages.findIndex(date => isSameDay(date, today));
      if (idx !== -1 && flipPageRef.current) {
        flipPageRef.current.gotoPage(idx);
      } else {
        setCurrentDate(today); // sẽ trigger useEffect tạo lại pages
      }
    };
    
    // Thêm hàm xử lý chọn ngày từ DatePicker
    const handleDateSelect = (date: Date | null) => {
      if (!date) return;
      const idx = pages.findIndex(pageDate => isSameDay(pageDate, date));
      if (idx !== -1 && flipPageRef.current) {
        flipPageRef.current.gotoPage(idx);
      } else {
        setCurrentDate(date); // sẽ trigger useEffect tạo lại pages
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
      const events = getEventsForDate(date);
      const weather = getWeatherForDate(date);
      const isToday = isSameDay(date, new Date());
      const dayNumber = format(date, 'd');
      const monthYear = formatVN(date, 'MMMM yyyy');

      // Ngày âm lịch đơn giản (placeholder)
      const lunarDayStr = `${date.getDate()}/${date.getMonth() + 1}`;
      const lunarInfo = `Ngày ${date.getDate()} tháng ${date.getMonth() + 1}`;

      // Phân loại sự kiện theo loại
      const farmActivities = events.filter(event => event.extendedProps?.type === 'farm_activity');
      const laborRequests = events.filter(event => event.extendedProps?.type === 'labor_request');

      const getWeatherBackground = () => {
        if (!weather || !weather.daily) return 'bg-gradient-to-br from-blue-500 to-purple-600';
        
        const condition = weather.daily.weather_condition?.toLowerCase();
        const temp = weather.daily.temp_max || 0;
        
        if (condition?.includes('rain')) return 'bg-gradient-to-br from-blue-600 to-cyan-500';
        if (condition?.includes('cloud')) return 'bg-gradient-to-br from-gray-600 to-blue-500';
        if (temp > 32) return 'bg-gradient-to-br from-orange-500 to-red-500';
        if (temp > 25) return 'bg-gradient-to-br from-yellow-500 to-orange-500';
        if (temp < 15) return 'bg-gradient-to-br from-blue-500 to-indigo-600';
        return 'bg-gradient-to-br from-green-500 to-emerald-600';
      };

      const getWeatherIcon = () => {
        if (!weather || !weather.daily) return '🌤️';
        
        const condition = weather.daily.weather_condition?.toLowerCase();
        if (condition?.includes('rain')) return '🌧️';
        if (condition?.includes('cloud')) return '☁️';
        if (weather.daily.temp_max > 32) return '☀️';
        return '🌤️';
      };

      return (
        <div
          className={`page-content flex flex-col h-full rounded-3xl overflow-hidden border-4 border-yellow-300 shadow-2xl bg-[#fffbe8]`}
          style={{ minHeight: 480 }}
        >
          {/* Header bloc đỏ */}
          <div className="p-4 text-center bg-gradient-to-b from-red-600 to-red-400 border-b-4 border-yellow-300">
            <div className="text-7xl font-extrabold text-white drop-shadow-lg mb-1" style={{fontFamily: 'Arial Rounded MT Bold, Quicksand, sans-serif'}}>{dayNumber}</div>
            <div className="text-lg font-semibold text-yellow-100 mb-1 tracking-wide" style={{letterSpacing: 1}}>{formatVN(date, 'EEEE, dd/MM/yyyy')}</div>
            <div className="text-base text-yellow-200">Âm lịch: <span className="font-bold">{lunarDayStr}</span></div>
          </div>
          {/* Thời tiết */}
          <div className="p-3 bg-yellow-50 border-b border-yellow-200">
            {weather && weather.daily ? (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getWeatherIcon()}</span>
                  <div>
                    <div className="font-semibold text-yellow-900">
                      {weather.daily.temp_min}°C - {weather.daily.temp_max}°C
                    </div>
                    <div className="text-yellow-700">{weather.daily.weather_condition}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); showWeatherDetails(date); }}
                  className="text-red-600 hover:text-red-800 text-xs underline"
                >
                  Chi tiết
                </button>
              </div>
            ) : (
              <div className="text-sm text-yellow-700 flex items-center"><span className="mr-2">🌤️</span>Không có dữ liệu thời tiết</div>
            )}
          </div>
          {/* Nội dung sự kiện của ngày */}
          <div className="flex-1 p-4 overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center text-gray-400 py-6">
                <div className="text-4xl mb-2">📅</div>
                Không có hoạt động
              </div>
            ) : (
              <div className="space-y-2">
                {farmActivities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-red-700 mb-1 flex items-center">🌱 Hoạt động canh tác:</h3>
                    {farmActivities.map((event, index) => (
                      <div key={`farm-${index}`} className="text-xs p-2 mb-1 rounded bg-red-50 border border-red-100 text-red-900 hover:bg-red-100 cursor-pointer transition-all hover:scale-105" onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}>
                        <span className="mr-1">{event.extendedProps.icon}</span>{event.title}
                      </div>
                    ))}
                  </div>
                )}
                {laborRequests.length > 0 && (
                  <div className="mt-2">
                    <h3 className="text-sm font-medium text-green-800 mb-1 flex items-center">👥 Yêu cầu nhân công:</h3>
                    {laborRequests.map((event, index) => (
                      <div key={`labor-${index}`} className="text-xs p-2 mb-1 rounded bg-green-50 border border-green-100 text-green-900 hover:bg-green-100 cursor-pointer transition-all hover:scale-105" onClick={(e) => { e.stopPropagation(); handleEventClick(event); }}>
                        <span className="mr-1">{event.extendedProps.icon}</span>{event.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Footer bloc */}
          <div className="p-2 border-t-2 border-yellow-300 text-xs text-center text-yellow-700 bg-yellow-50 font-medium">
            {isToday ? (
              <span className="flex items-center justify-center text-red-600 font-semibold">📌 Hôm nay</span>
            ) : (
              weather && weather.daily ? (
                <span className="flex items-center justify-center"><span className="mr-1">💡</span>{weather.daily.weather_condition === 'Rain' ? 'Có mưa, chuẩn bị dụng cụ che chắn' : weather.daily.temp_max > 32 ? 'Nắng nóng, nhớ bổ sung nước cho cây' : 'Kiểm tra thời tiết trước khi làm việc ngoài trời'}</span>
              ) : '💡 Tip: Kiểm tra thời tiết trước khi làm việc ngoài trời'
            )}
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
      <div className="bloc-calendar calendar-container animate-fadeIn">
        {/* Controls ở giữa, dễ thao tác */}
        <div className="flex flex-col items-center mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 text-base font-bold transition-all duration-200 hover:scale-105 border-2 border-yellow-300" onClick={goToToday}>📅 Hôm nay</button>
            <h3 className="text-2xl font-bold text-red-700 tracking-wide" style={{fontFamily: 'Quicksand, Arial Rounded MT Bold, sans-serif'}}>{pages.length > 0 && currentPage < pages.length ? formatVN(pages[currentPage], 'MMMM yyyy') : 'Lịch bloc'}</h3>
          </div>
          <div className="datepicker-container" style={{ width: '200px' }}>
            <DatePicker selected={pages[currentPage]} onChange={handleDateSelect} dateFormat="dd/MM/yyyy" className="px-4 py-2 border-2 border-yellow-300 rounded-lg w-full text-base focus:ring-2 focus:ring-red-400 focus:border-red-400" placeholderText="Chọn ngày..." />
          </div>
          <div className="flex items-center gap-6 mt-2">
            <button className={`w-12 h-12 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold border-2 border-yellow-300 transition-all duration-200 ${currentPage <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700 hover:scale-110'}`} onClick={handlePrevPage} disabled={currentPage <= 0}><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
            <span className="text-base text-red-700 font-semibold">Trang {currentPage + 1} / {pages.length}</span>
            <button className={`w-12 h-12 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center text-xl font-bold border-2 border-yellow-300 transition-all duration-200 ${currentPage >= pages.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700 hover:scale-110'}`} onClick={handleNextPage} disabled={currentPage >= pages.length - 1}> <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
          </div>
        </div>

        {/* Khôi phục hiệu ứng lật trang như lịch bloc thật */}
        <div className="relative mx-auto calendar-wrapper" style={{ height: '500px', maxWidth: '400px' }}>
          {pages.length > 0 ? (
            <FlipPage
              ref={flipPageRef}
              className="bloc-calendar"
              orientation="vertical"
              width={400}
              height={500}
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
                <div key={index} className="calendar-page bloc-calendar-page">
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
      </div>
    );
  }
);

// Đặt displayName cho forwardRef component giúp trong việc debug
BlocCalendar.displayName = 'BlocCalendar';

export default BlocCalendar;
