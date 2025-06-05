import React from "react";

interface CalendarHeaderProps {
  view: string;
  onViewChange: (viewName: string) => void;
  calendarType: "grid" | "bloc";
  onCalendarTypeChange: (type: "grid" | "bloc") => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  view,
  onViewChange,
  calendarType,
  onCalendarTypeChange,
}) => {
  // Xử lý click cho nút Today trong BigCalendar
  const handleTodayClick = () => {
    // Nếu đang ở chế độ grid, thay đổi view về today
    if (calendarType === "grid") {
      const calendarApi = document.querySelector(".fc")?.classList.contains("fc")
        ? (document.querySelector(".fc") as any)?.querySelector(".fc-today-button")
        : null;

      if (calendarApi) {
        calendarApi.click();
      }
    } else {
      // Kích hoạt một sự kiện tùy chỉnh để BlocCalendar có thể bắt và xử lý
      const event = new CustomEvent("bloc-calendar-today");
      window.dispatchEvent(event);
    }
  };

  return (
    <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
      <div>
        <button
          className="px-3 py-1 bg-green-500 text-white rounded mr-2 hover:bg-green-600"
          onClick={handleTodayClick}
        >
          Hôm nay
        </button>
      </div>

      <div className="flex items-center space-x-1">
        <span className="text-sm text-gray-600 mr-1">Chế độ xem:</span>

        {/* Grid/Bloc toggle */}
        <div className="flex border border-gray-300 rounded overflow-hidden">
          <button
            className={`px-3 py-1 text-sm ${
              calendarType === "grid" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
            onClick={() => onCalendarTypeChange("grid")}
          >
            Lưới
          </button>
          <button
            className={`px-3 py-1 text-sm ${
              calendarType === "bloc" ? "bg-blue-500 text-white" : "bg-gray-100"
            }`}
            onClick={() => onCalendarTypeChange("bloc")}
          >
            Bloc
          </button>
        </div>

        {/* View options (disabled when in bloc view) */}
        <div className="flex border border-gray-300 rounded overflow-hidden ml-2">
          <button
            className={`px-3 py-1 text-sm ${
              view === "dayGridMonth" ? "bg-blue-500 text-white" : "bg-gray-100"
            } ${calendarType === "bloc" ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => calendarType !== "bloc" && onViewChange("dayGridMonth")}
            disabled={calendarType === "bloc"}
          >
            Tháng
          </button>
          <button
            className={`px-3 py-1 text-sm ${
              view === "timeGridWeek" ? "bg-blue-500 text-white" : "bg-gray-100"
            } ${calendarType === "bloc" ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => calendarType !== "bloc" && onViewChange("timeGridWeek")}
            disabled={calendarType === "bloc"}
          >
            Tuần
          </button>
          <button
            className={`px-3 py-1 text-sm ${
              view === "timeGridDay" ? "bg-blue-500 text-white" : "bg-gray-100"
            } ${calendarType === "bloc" ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => calendarType !== "bloc" && onViewChange("timeGridDay")}
            disabled={calendarType === "bloc"}
          >
            Ngày
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;
