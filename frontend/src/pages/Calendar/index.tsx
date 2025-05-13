import React, { useState, useEffect } from "react";
import BigCalendar from "@/components/Calendar/BigCalendar";
import { format } from "date-fns";
import { formatWithOptions } from "date-fns/fp";
import { vi } from "date-fns/locale";
import { getFarmActivities } from "@/services/farming/farmService";
import { FarmActivity } from "@/types";

export default function Calendar() {
  const [clickedDate, setClickedDate] = useState<string>(
    format(new Date(), "dd/MM/yyyy")
  );
  const [events, setEvents] = useState<any[]>([]);
  const [farmActivities, setFarmActivities] = useState<FarmActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dữ liệu hoạt động
  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        const response = await getFarmActivities();
        setFarmActivities(response.farm_activities);
        setError(null);
      } catch (err) {
        console.error("Error fetching farm activities:", err);
        setError("Không thể tải dữ liệu hoạt động");
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Lịch Hoạt động Nông trại
        </h1>
        <p className="text-gray-600 mt-1">
          Xem và quản lý tất cả các hoạt động nông trại theo lịch
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Phần lịch chính - 3/4 màn hình */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center min-h-[500px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center text-red-500">
              {error}
            </div>
          ) : (
            <BigCalendar
              setClickedDate={setClickedDate}
              setEvents={setEvents}
              farmActivities={farmActivities}
            />
          )}
        </div>

        {/* Phần hiển thị hoạt động - 1/4 màn hình */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4 h-full">
            <div className="pb-3 mb-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-800">
                Hoạt động ngày {clickedDate}
              </h3>
            </div>

            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event) => {
                  const activityType = event.extendedProps?.activity_type || 1;
                  const status = event.extendedProps?.status || "pending";
                  const icon = event.extendedProps?.icon || "📝";

                  let statusColor;
                  let statusText;

                  switch (status) {
                    case "pending":
                      statusColor = "#FFC107";
                      statusText = "Chưa hoàn thành";
                      break;
                    case "completed":
                      statusColor = "#4CAF50";
                      statusText = "Đã hoàn thành";
                      break;
                    case "cancelled":
                      statusColor = "#F44336";
                      statusText = "Đã hủy";
                      break;
                    default:
                      statusColor = "#9E9E9E";
                      statusText = status;
                  }

                  return (
                    <div
                      key={event.id}
                      className="p-3 rounded-md border border-gray-100 hover:shadow-md transition-shadow"
                      style={{
                        borderLeft: `4px solid ${
                          event.borderColor || "#1E88E5"
                        }`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-8 h-8 flex items-center justify-center rounded-full text-sm"
                          style={{
                            backgroundColor: event.backgroundColor || "#E3F2FD",
                          }}
                        >
                          {icon}
                        </div>
                        <div className="flex-1">
                          <h4
                            className="font-medium mb-1"
                            style={{ color: event.textColor || "#0277BD" }}
                          >
                            {event.title}
                          </h4>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="text-gray-600">
                              {formatWithOptions({ locale: vi })(
                                "HH:mm",
                                new Date(event.start)
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <span
                                className="inline-block w-2 h-2 rounded-full"
                                style={{ backgroundColor: statusColor }}
                              ></span>
                              <span>{statusText}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto mb-2 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p>Không có hoạt động nào vào ngày này</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
