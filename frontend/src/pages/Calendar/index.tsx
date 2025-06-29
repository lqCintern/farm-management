import React, { useState, useEffect } from "react";
import BigCalendar from "@/components/Calendar/BigCalendar";
import { format } from "date-fns";
import { formatWithOptions } from "date-fns/fp";
import { vi } from "date-fns/locale";
import { getFarmActivities } from "@/services/farming/farmService";
import { getLaborRequests } from "@/services/labor/laborRequestService";
import { FarmActivity } from "@/types/labor/types";
import { LaborRequest } from "@/types/labor/laborRequest.types";
import EventPopup from "@/components/Calendar/EventPopup";
import Breadcrumb from "@/components/common/Breadcrumb";
import { Calendar as CalendarIcon, Clock, Activity } from "lucide-react";
import "./calendar.css";

export default function Calendar() {
  const [clickedDate, setClickedDate] = useState<string>(
    format(new Date(), "dd/MM/yyyy")
  );
  const [events, setEvents] = useState<any[]>([]);
  const [farmActivities, setFarmActivities] = useState<FarmActivity[]>([]);
  const [laborRequests, setLaborRequests] = useState<LaborRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FarmActivity | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

  const breadcrumbItems = [
    { label: "Trang chủ", path: "/" },
    { label: "Lịch trình" },
    { label: "Lịch hoạt động nông trại" }
  ];

  // Fetch dữ liệu hoạt động
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch farm activities
        const activitiesResponse = await getFarmActivities();
        setFarmActivities(activitiesResponse.farm_activities);

        // Fetch labor requests
        const laborResponse = await getLaborRequests();
        setLaborRequests(laborResponse.data);

        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Xử lý click vào hoạt động trong sidebar
  const handleEventClick = (event: any) => {
    if (event.extendedProps?.type === "farm_activity") {
      const activityId = parseInt(event.id.replace("activity-", ""));
      const activity = farmActivities.find(a => a.id === activityId);
      if (activity) {
        setSelectedEvent(activity);
        setIsPopupOpen(true);
      }
    }
  };

  // Xử lý click vào event từ BigCalendar
  const handleBigCalendarEventClick = (activity: FarmActivity) => {
    setSelectedEvent(activity);
    setIsPopupOpen(true);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 via-blue-50 to-emerald-50 min-h-screen">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg">
            <CalendarIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">
            Lịch Hoạt động Nông trại
          </h1>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-5 h-5 text-green-600" />
          <p className="text-lg">
            Xem và quản lý tất cả các hoạt động nông trại theo lịch
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Phần lịch chính - 3/4 màn hình */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-8 flex items-center justify-center min-h-[500px] border border-green-100">
              <div className="text-center">
                <div className="animate-spin w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-6 pulse-glow"></div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Đang tải lịch hoạt động...</h3>
                <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
                <div className="mt-4 flex justify-center">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-red-200">
              <div className="text-red-500 text-lg font-semibold">{error}</div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden">
              <BigCalendar
                setClickedDate={setClickedDate}
                setEvents={setEvents}
                farmActivities={farmActivities}
                laborRequests={laborRequests}
                onEventClick={handleBigCalendarEventClick}
              />
            </div>
          )}
        </div>

        {/* Phần hiển thị hoạt động - 1/4 màn hình */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6 h-full border border-green-100">
            <div className="pb-4 mb-6 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Hoạt động ngày {clickedDate}
                </h3>
              </div>
              <div className="text-sm text-gray-600">
                {events.length} hoạt động trong ngày
              </div>
            </div>

            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => {
                  const activityType = event.extendedProps?.activity_type || 1;
                  const status = event.extendedProps?.status || "pending";
                  const icon = event.extendedProps?.icon || "📝";

                  let statusColor;
                  let statusText;
                  let statusBgColor;

                  switch (status) {
                    case "pending":
                      statusColor = "#FFC107";
                      statusText = "Chờ thực hiện";
                      statusBgColor = "#FFF8E1";
                      break;
                    case "completed":
                      statusColor = "#4CAF50";
                      statusText = "Đã hoàn thành";
                      statusBgColor = "#E8F5E8";
                      break;
                    case "cancelled":
                      statusColor = "#F44336";
                      statusText = "Đã hủy";
                      statusBgColor = "#FFEBEE";
                      break;
                    case "in_progress":
                      statusColor = "#2196F3";
                      statusText = "Đang thực hiện";
                      statusBgColor = "#E3F2FD";
                      break;
                    default:
                      statusColor = "#9E9E9E";
                      statusText = status;
                      statusBgColor = "#F5F5F5";
                  }

                  return (
                    <div
                      key={event.id}
                      className="group p-4 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:border-green-300 bg-white"
                      style={{
                        borderLeft: `4px solid ${
                          event.borderColor || "#1E88E5"
                        }`,
                      }}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 flex items-center justify-center rounded-xl text-lg shadow-sm transition-transform duration-200 group-hover:scale-110"
                          style={{
                            backgroundColor: event.backgroundColor || "#E3F2FD",
                          }}
                        >
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className="font-semibold mb-2 text-gray-900 group-hover:text-green-600 transition-colors duration-200 truncate"
                            style={{ color: event.textColor || "#0277BD" }}
                          >
                            {event.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-4 h-4" />
                              {formatWithOptions({ locale: vi })(
                                "HH:mm",
                                new Date(event.start)
                              )}
                            </span>
                            <span 
                              className="px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 group-hover:scale-105"
                              style={{ 
                                backgroundColor: statusBgColor, 
                                color: statusColor 
                              }}
                            >
                              {statusText}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-700 mb-2">Không có hoạt động</h4>
                <p className="text-sm">Không có hoạt động nào vào ngày này</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Event Popup */}
      <EventPopup
        event={selectedEvent}
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}
