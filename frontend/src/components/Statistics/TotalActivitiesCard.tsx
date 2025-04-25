import React from "react";

interface TotalActivitiesCardProps {
  count: number;
}

export default function TotalActivitiesCard({
  count,
}: TotalActivitiesCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Tổng số Hoạt động</p>
          <h3 className="text-2xl font-bold text-blue-600">{count}</h3>
        </div>
        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        {count > 0
          ? `${count} hoạt động được ghi nhận trong kỳ này`
          : "Không có hoạt động nào được ghi nhận trong kỳ này"}
      </div>
    </div>
  );
}
