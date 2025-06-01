import { FarmActivity } from "@/types/labor/types";
import { parseDate } from "./dateUtils";
import { activityTypeColors } from "@/constants/activityColors";

// Biến đổi dữ liệu hoạt động thành sự kiện lịch
export const transformActivitiesToEvents = (farmActivities: FarmActivity[]) => {
  return farmActivities.map((activity) => {
    // Đảm bảo activityType luôn là number hoặc string hợp lệ
    const activityType = activity.activity_type || 1;
    
    // Chỉ định kiểu cho activityTypeColors để tránh lỗi index
    const styling = activityTypeColors[activityType as keyof typeof activityTypeColors] || {
      background: "#ECEFF1",
      text: "#607D8B",
      icon: "📝",
    };

    const startDate = parseDate(activity.start_date);
    const endDate = activity.end_date
      ? parseDate(activity.end_date)
      : undefined;

    // Thêm một ngày vào ngày kết thúc cho hiển thị FullCalendar
    const endDateForDisplay = endDate ? new Date(endDate) : new Date(startDate);
    endDateForDisplay.setDate(endDateForDisplay.getDate() + 1);

    return {
      // Kiểm tra null/undefined cho activity.id
      id: activity.id ? activity.id.toString() : `temp-${Date.now()}`,
      title: activity.description || '',
      start: startDate,
      end: endDateForDisplay,
      extendedProps: {
        activity_type: activity.activity_type,
        // Fix lỗi status_label không tồn tại trong FarmActivity
        status: activity.status || '', // Thay thế status_label bằng status
        icon: styling.icon,
      },
      backgroundColor: styling.background,
      borderColor: styling.text,
      textColor: styling.text,
      allDay: true,
    };
  });
};

// Lọc sự kiện theo ngày
export const filterEventsByDate = (events: any[], date: Date) => {
  return events.filter((event) => {
    const eventStart = event.start ? new Date(event.start.valueOf()) : null;
    const eventEnd = event.end ? new Date(event.end.valueOf()) : null;

    if (!eventStart) return false;

    const clickedDate = new Date(date);

    // Reset thời gian để so sánh theo ngày
    clickedDate.setHours(0, 0, 0, 0);
    const startDate = new Date(eventStart);
    startDate.setHours(0, 0, 0, 0);

    if (!eventEnd) {
      // Nếu không có ngày kết thúc, chỉ kiểm tra ngày bắt đầu
      return startDate.getTime() === clickedDate.getTime();
    }

    const endDate = new Date(eventEnd);
    endDate.setHours(0, 0, 0, 0);
    // Ngày được chọn nằm trong khoảng từ start đến end
    return clickedDate >= startDate && clickedDate < endDate;
  });
};
