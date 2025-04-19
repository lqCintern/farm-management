import FullCalendar from "@fullcalendar/react";
import { EventClickArg } from "@fullcalendar/core";
import { DateClickArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { useRef, useState } from "react";
import { FarmActivity } from "@/types";
import EventDetailPopup from "../Popup/EventDetailPopup";

interface BigCalendarProps {
  setClickedDate: (date: string) => void;
  setEvents: (events: any[]) => void;
  farmActivities: FarmActivity[];
}

export default function BigCalendar({
  setClickedDate,
  setEvents,
  farmActivities,
}: BigCalendarProps) {
  const calendarRef = useRef<FullCalendar | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<FarmActivity | null>(null); // Lưu sự kiện được chọn
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false); // Trạng thái mở/đóng popup

  function parseDate(dateString: string): string {
    const [day, month, year] = dateString.split("-");
    return `${year}-${month}-${day}`;
  }

  const events = farmActivities.map((activity) => ({
    id: activity.id.toString(),
    title: activity.description,
    start: parseDate(activity.start_date),
    end: activity.end_date ? parseDate(activity.end_date) : undefined,
  }));

  console.log("Events for FullCalendar:", events);

  const handleEventClick = (info: EventClickArg) => {
    const eventId = info.event.id;
    const eventDetails = farmActivities.find(
      (activity) => activity.id.toString() === eventId
    );
    setSelectedEvent(eventDetails || null); // Lưu chi tiết sự kiện được chọn
    setIsPopupOpen(true); // Mở popup
  };

  const handleDateClick = (info: DateClickArg) => {
    const date = new Date(info.dateStr || info.date.toISOString());
    setClickedDate(date.toDateString());
    const events = calendarRef.current?.getApi().getEvents() || [];
    console.log(events);
    const result: any[] = [];
    for (const event of events) {
      const start = event.start?.getDate();
      const end = event.end?.getDate();
      if (
        start !== undefined &&
        end !== undefined &&
        start <= date.getDate() &&
        date.getDate() <= end
      ) {
        console.log(start <= date.getDate() && date.getDate() <= end);
        result.push(event);
      }
    }
    setEvents(result);
  };

  return (
    <div className="w-8/12 h-1/2 pl-5 pt-2">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          start: "title prev,next",
          end: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        dateClick={handleDateClick}
        height="75vh"
        ref={calendarRef}
        eventClick={(event) => handleEventClick(event)}
      />

      {/* Sử dụng EventDetailPopup */}
      {isPopupOpen && (
        <EventDetailPopup
          event={selectedEvent}
          onClose={() => setIsPopupOpen(false)} // Đóng popup
        />
      )}
    </div>
  );
}
