import { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import { EventClickArg } from "@fullcalendar/core";
import { DateClickArg } from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import viLocale from "@fullcalendar/core/locales/vi";
import { FarmActivity } from "@/types/labor/types";
import { format } from "date-fns";

// Import các component con và util
import CalendarHeader from "./CalendarHeader";
import CalendarLegend from "./CalendarLegend";
import EventContent from "./EventContent";
import EventPopup from "./EventPopup";
import {
  transformActivitiesToEvents,
  filterEventsByDate,
} from "@/utils/eventUtils";

interface BigCalendarProps {
  setClickedDate: React.Dispatch<React.SetStateAction<string>>;
  setEvents: React.Dispatch<React.SetStateAction<any[]>>;
  farmActivities: FarmActivity[];
  laborRequests?: any[]; // Thêm prop này
}

export default function BigCalendar({
  setClickedDate,
  setEvents,
  farmActivities,
  laborRequests,
}: BigCalendarProps) {
  const calendarRef = useRef<FullCalendar | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FarmActivity | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [view, setView] = useState<string>("dayGridMonth");

  // Áp dụng thay đổi view khi state thay đổi
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && calendarApi.view.type !== view) {
      calendarApi.changeView(view);
    }
  }, [view]);

  // Tạo sự kiện từ hoạt động nông trại
  const events = transformActivitiesToEvents(farmActivities);

  // Xử lý khi click vào sự kiện
  const handleEventClick = (info: EventClickArg) => {
    const eventId = parseInt(info.event.id);
    const eventDetails = farmActivities.find(
      (activity) => activity.id === eventId
    );
    setSelectedEvent(eventDetails || null);
    setIsPopupOpen(true);
  };

  // Xử lý khi click vào ngày
  const handleDateClick = (info: DateClickArg) => {
    const date = new Date(info.dateStr);
    setClickedDate(format(date, "dd/MM/yyyy"));

    // Lọc các sự kiện trong ngày
    const events = calendarRef.current?.getApi().getEvents() || [];
    const filteredEvents = filterEventsByDate(events, date);

    setEvents(
      filteredEvents.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        extendedProps: event.extendedProps,
      }))
    );
  };

  // Xử lý khi đổi chế độ xem
  const handleViewChange = (viewName: string) => {
    setView(viewName);
  };

  // Trong xử lý dữ liệu
  useEffect(() => {
    // Xử lý Farm Activities
    const farmActivityEvents = farmActivities.map((activity) => {
      // Mã xử lý hiện tại
      return {
        id: `activity-${activity.id}`,
        title: activity.description,
        start: new Date(activity.start_date),
        end: new Date(activity.end_date),
        backgroundColor: "#E3F2FD",
        borderColor: "#1E88E5",
        textColor: "#0277BD",
        extendedProps: {
          type: "farm_activity",
          activity_type: activity.activity_type,
          status: activity.status,
          icon: "🌱",
        },
      };
    });

    // Xử lý Labor Requests nếu có
    const laborRequestEvents = laborRequests
      ? laborRequests.map((request) => {
          return {
            id: `labor-${request.id}`,
            title: request.title,
            start: new Date(request.start_date),
            end: new Date(request.end_date),
            backgroundColor: "#FCE4EC",
            borderColor: "#EC407A",
            textColor: "#AD1457",
            extendedProps: {
              type: "labor_request",
              request_type: request.request_type,
              status: request.status,
              icon: "👥",
            },
          };
        })
      : [];

    // Kết hợp cả hai loại sự kiện
    const allEvents = [...farmActivityEvents, ...laborRequestEvents];

    setEvents(allEvents);
  }, [farmActivities, laborRequests]);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-full">
      <CalendarHeader view={view} onViewChange={handleViewChange} />

      <div className="rounded-lg overflow-hidden border border-gray-200">
        <FullCalendar
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
          ]}
          initialView={view}
          locale={viLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
          }}
          buttonText={{
            today: "Hôm nay",
            month: "Tháng",
            week: "Tuần",
            day: "Ngày",
            list: "Danh sách",
          }}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventContent={(info) => <EventContent eventInfo={info} />}
          height="auto"
          aspectRatio={1.8}
          ref={calendarRef}
          dayMaxEvents={3}
          dayMaxEventRows={3}
          moreLinkText={(n) => `+${n} hoạt động`}
          moreLinkClick="popover"
          nowIndicator={true}
          weekNumbers={false}
          fixedWeekCount={false}
          firstDay={1}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
            hour12: false,
          }}
        />
      </div>

      <CalendarLegend />

      <EventPopup
        event={selectedEvent}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
      />
    </div>
  );
}
