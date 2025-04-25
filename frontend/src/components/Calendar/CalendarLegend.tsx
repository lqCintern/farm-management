import React from "react";
import {
  activityTypeColors,
  getActivityTypeName,
} from "@/constants/activityColors";

const CalendarLegend: React.FC = () => {
  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-md">
      <h3 className="text-sm font-medium text-gray-700 mb-2">
        Loại hoạt động:
      </h3>
      <div className="flex flex-wrap gap-3">
        {Object.entries(activityTypeColors).map(([type, styling]) => (
          <div key={type} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: styling.text }}
            />
            <span className="text-xs text-gray-600">
              {getActivityTypeName(Number(type))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarLegend;
