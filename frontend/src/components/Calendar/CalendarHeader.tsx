import React from "react";

interface CalendarHeaderProps {
  view: string;
  onViewChange: (view: string) => void;
  calendarType: "grid" | "bloc";
  onCalendarTypeChange: (type: "grid" | "bloc") => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  view,
  onViewChange,
  calendarType,
  onCalendarTypeChange,
}) => {
  // Xử lý click vào nút Today
  const handleTodayClick = () => {
    // Phân tán sự kiện cho lịch bloc nếu đang ở chế độ bloc
    if (calendarType === "bloc") {
      window.dispatchEvent(new CustomEvent("bloc-calendar-today"));
    } else {
      // Xử lý cho lịch grid
      const calendarElement = document.querySelector(".fc");
      const todayButton = calendarElement?.querySelector(".fc-today-button");

      if (todayButton) {
        (todayButton as HTMLButtonElement).click();
      }
    }
  };

  return (
    <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          Lịch hoạt động
        </h2>
        <p className="text-sm text-gray-500">
          Quản lý các hoạt động nông trại của bạn
        </p>
      </div>

      <div className="flex items-center space-x-3">
        {/* Nút "Hôm nay" */}
        <button
          className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-md 
                     border border-blue-200 transition-colors flex items-center gap-1.5 text-sm shadow-sm"
          onClick={handleTodayClick}
        >
          <span className="w-4 h-4 flex items-center justify-center text-xs bg-blue-600 text-white rounded-full">
            {new Date().getDate()}
          </span>
          Hôm nay
        </button>

        {/* Grid/Bloc toggle - đặt Bloc đầu tiên */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              calendarType === "bloc"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => onCalendarTypeChange("bloc")}
          >
            Bloc
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              calendarType === "grid"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => onCalendarTypeChange("grid")}
          >
            Lưới
          </button>
        </div>

        {/* View options (disabled when in bloc view) */}
        {calendarType === "grid" && (
          <div className="flex border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <button
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                view === "dayGridMonth"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => onViewChange("dayGridMonth")}
            >
              Tháng
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                view === "timeGridWeek"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => onViewChange("timeGridWeek")}
            >
              Tuần
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                view === "timeGridDay"
                  ? "bg-green-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() => onViewChange("timeGridDay")}
            >
              Ngày
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarHeader;
