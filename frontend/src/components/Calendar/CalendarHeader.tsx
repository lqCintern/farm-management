import React from "react";

interface CalendarHeaderProps {
  view: string;
  onViewChange: (view: string) => void;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  view,
  onViewChange,
}) => {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-gray-800">
        Lịch Hoạt động Nông trại
      </h2>
      <div className="flex space-x-2">
        {/* Các nút chuyển đổi chế độ xem tùy chỉnh */}
        <button
          onClick={() => onViewChange("dayGridMonth")}
          className={`px-3 py-1 rounded-md text-sm ${
            view === "dayGridMonth"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Tháng
        </button>
        <button
          onClick={() => onViewChange("timeGridWeek")}
          className={`px-3 py-1 rounded-md text-sm ${
            view === "timeGridWeek"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Tuần
        </button>
        <button
          onClick={() => onViewChange("timeGridDay")}
          className={`px-3 py-1 rounded-md text-sm ${
            view === "timeGridDay"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Ngày
        </button>
        <button
          onClick={() => onViewChange("listWeek")}
          className={`px-3 py-1 rounded-md text-sm ${
            view === "listWeek"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Danh sách
        </button>
      </div>
    </div>
  );
};

export default CalendarHeader;
