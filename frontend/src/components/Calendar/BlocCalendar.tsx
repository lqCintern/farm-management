import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { format, addDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { FarmActivity } from "@/types/labor/types";
import FlipPage from 'react-flip-page';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css'; // Import styles

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
}

// Interface cho phương thức public của BlocCalendar
export interface BlocCalendarHandle {
  goToToday: () => void;
  goToDate: (date: Date) => void;
}

// Định nghĩa component với forwardRef
const BlocCalendar = forwardRef<BlocCalendarHandle, BlocCalendarProps>(
  function BlocCalendar({ farmActivities, laborRequests = [], onDateClick }, ref) {
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [pages, setPages] = useState<Date[]>([]);
    const [allEvents, setAllEvents] = useState<any[]>([]);
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
    
    // Expose các phương thức cho component cha
    useImperativeHandle(ref, () => ({
      goToToday,
      goToDate: handleDateSelect
    }));

    // Render nội dung trang
    const renderPageContent = (date: Date) => {
      if (!date) return null;
      
      const events = getEventsForDate(date);
      const isToday = isSameDay(date, new Date());
      
      // Format date with locale
      const weekdayName = formatVN(date, 'EEEE');
      const dayNumber = format(date, 'd');
      const monthYear = formatVN(date, 'MMMM yyyy');

      // Phân loại sự kiện theo loại
      const farmActivities = events.filter(event => event.extendedProps?.type === 'farm_activity');
      const laborRequests = events.filter(event => event.extendedProps?.type === 'labor_request');

      return (
        <div 
          className={`bloc-calendar-page ${isToday ? 'today' : ''}`}
          onClick={() => handleDateClick(date)}
        >
          <div className={`page-content ${isToday ? 'bg-yellow-50' : 'bg-white'} border shadow-sm h-full flex flex-col`}>
            {/* Header ngày */}
            <div className="flex flex-col items-center justify-center p-4 border-b bg-gradient-to-b from-blue-500 to-blue-600 text-white">
              <div className="text-xs uppercase tracking-wide">{monthYear}</div>
              <div className="text-4xl font-bold mb-1">{dayNumber}</div>
              <div className="text-sm font-medium capitalize">{weekdayName}</div>
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
                            e.stopPropagation(); // Ngăn không cho sự kiện bubble lên cha
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
                            e.stopPropagation(); // Ngăn không cho sự kiện bubble lên cha
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
            
            {/* Footer với ghi chú hoặc quote về nông nghiệp */}
            <div className="p-2 border-t text-xs text-center text-gray-600 bg-gray-50">
              {isToday ? '📌 Hôm nay' : '💡 Tip: Kiểm tra thời tiết trước khi làm việc ngoài trời'}
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="bloc-calendar-container bg-white rounded-lg shadow-md p-4 w-full">
        <div className="flex flex-col mb-4 space-y-3">
          {/* Hàng 1: Controls chính */}
          <div className="flex justify-between items-center">
            <button 
              className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 ${currentPage <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handlePrevPage}
              disabled={currentPage <= 0}
            >
              Ngày trước
            </button>
            <h3 className="text-lg font-semibold">
              {pages.length > 0 && currentPage < pages.length 
                ? formatVN(pages[currentPage], 'MMMM yyyy')
                : 'Lịch bloc'}
            </h3>
            <button 
              className={`px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 ${currentPage >= pages.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleNextPage}
              disabled={currentPage >= pages.length - 1}
            >
              Ngày sau
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
              orientation="vertical" // Thay đổi từ horizontal sang vertical
              width={350}
              height={450}
              uncutPages={false} // Đổi thành false để hiệu ứng lật cả trang
              animationDuration={400} // Giảm xuống cho hiệu ứng nhanh hơn
              showSwipeHint={false}
              style={{ margin: '0 auto' }}
              onPageChange={handlePageFlip}
              pageBackground="#f8fafc"
              treshold={10} // Giảm ngưỡng kéo để lật trang dễ dàng hơn
              maxAngle={25} // Giới hạn góc lật để trang lật nhanh hơn
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

        <style>{`
          .calendar-wrapper {
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            border-radius: 5px;
          }
          
          .calendar-page {
            padding: 0;
            width: 100%;
            height: 100%;
            transform-origin: top center; /* Đặt điểm gốc ở phía trên để lật giống lịch bloc */
          }
          
          .page-content {
            border-radius: 0;
            overflow: hidden;
            height: 100%;
          }
          
          .bloc-calendar-page.today .page-content {
            box-shadow: inset 0 0 0 2px #f59e0b;
          }
        `}</style>
      </div>
    );
  }
);

// Đặt displayName cho forwardRef component giúp trong việc debug
BlocCalendar.displayName = 'BlocCalendar';

export default BlocCalendar;
