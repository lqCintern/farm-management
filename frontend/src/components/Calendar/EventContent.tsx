import React from "react";
import { EventContentArg } from "@fullcalendar/core";
import {
  activityTypeColors,
  getStatusColor,
  getStatusText,
} from "@/constants/activityColors";

interface EventContentProps {
  eventInfo: EventContentArg;
}

const EventContent: React.FC<EventContentProps> = ({ eventInfo }) => {
  const { activity_type, status, icon } = eventInfo.event.extendedProps;
  const styling = activityTypeColors[activity_type as number] || {
    background: "#ECEFF1",
    text: "#607D8B",
    icon: "📝",
  };

  return (
    <div
      className="p-1 rounded-md flex items-center gap-2 w-full overflow-hidden"
      style={{
        backgroundColor: styling.background,
        borderLeft: `3px solid ${styling.text}`,
      }}
    >
      <span className="text-sm">{icon}</span>
      <div className="flex-1 truncate">
        <p className="text-xs font-medium truncate">{eventInfo.event.title}</p>
      </div>
      <div
        className="w-2 h-2 rounded-full mr-1"
        style={{ backgroundColor: getStatusColor(status) }}
        title={getStatusText(status)}
      />
    </div>
  );
};

export default EventContent;
