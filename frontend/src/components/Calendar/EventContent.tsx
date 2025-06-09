import React from "react";
import { EventContentArg } from "@fullcalendar/core";

interface EventContentProps {
  eventInfo: EventContentArg;
}

const EventContent: React.FC<EventContentProps> = ({ eventInfo }) => {
  const { event } = eventInfo;
  const { extendedProps } = event;
  const icon = extendedProps?.icon || "📝";
  const type = extendedProps?.type || "unknown";

  // Xác định màu sắc và style dựa trên loại sự kiện
  let cardClass =
    "px-2 py-1 rounded overflow-hidden whitespace-nowrap overflow-ellipsis ";

  if (type === "farm_activity") {
    cardClass += "bg-blue-50 border-l-2 border-blue-500 text-blue-800";
  } else if (type === "labor_request") {
    cardClass += "bg-pink-50 border-l-2 border-pink-500 text-pink-800";
  } else {
    cardClass += "bg-gray-50 border-l-2 border-gray-500 text-gray-800";
  }

  // Xử lý trạng thái
  const status = extendedProps?.status;
  let statusBadge = null;

  if (status) {
    let badgeClass =
      "ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ";

    if (status === "completed") {
      badgeClass += "bg-green-100 text-green-800";
    } else if (status === "pending") {
      badgeClass += "bg-orange-100 text-orange-800";
    } else if (status === "in_progress") {
      badgeClass += "bg-blue-100 text-blue-800";
    } else {
      badgeClass += "bg-gray-100 text-gray-800";
    }

    statusBadge = (
      <span className={badgeClass}>
        {status === "completed"
          ? "Hoàn thành"
          : status === "pending"
          ? "Đang chờ"
          : status === "in_progress"
          ? "Đang làm"
          : status}
      </span>
    );
  }

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-1">
        <span className="shrink-0">{icon}</span>
        <div className="text-sm font-medium truncate">{event.title}</div>
      </div>
      {statusBadge && <div className="mt-0.5">{statusBadge}</div>}
    </div>
  );
};

export default EventContent;
