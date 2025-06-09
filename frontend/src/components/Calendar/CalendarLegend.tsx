import React from "react";

const CalendarLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-gray-100">
      <div className="text-sm text-gray-700 font-medium">Chú thích:</div>
      <div className="flex items-center gap-6">
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-500 mr-2"></span>
          <span className="text-sm text-gray-700">Hoạt động canh tác</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-pink-100 border-2 border-pink-500 mr-2"></span>
          <span className="text-sm text-gray-700">Yêu cầu nhân công</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-green-100 border-2 border-green-500 mr-2"></span>
          <span className="text-sm text-gray-700">Hoàn thành</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-orange-100 border-2 border-orange-500 mr-2"></span>
          <span className="text-sm text-gray-700">Chưa hoàn thành</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarLegend;
