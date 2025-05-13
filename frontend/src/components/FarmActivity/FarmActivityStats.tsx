import { useState, useEffect } from "react";
import { getFarmActivityStatistics } from "@/services/farming/farmService";
import ActivityTypeChart from "@/components/Statistics/ActivityTypeChart";
import StatusChart from "@/components/Statistics/StatusChart";
import CompletionRateCard from "@/components/Statistics/CompletionRateCard";
import TotalActivitiesCard from "@/components/Statistics/TotalActivitiesCard";

// Đổi tên component để phù hợp với tên file
export default function FarmActivityStats() {
  // State cho bộ lọc
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [quarter, setQuarter] = useState<number>(
    Math.floor((new Date().getMonth() + 3) / 3)
  );

  // State cho dữ liệu
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dữ liệu
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = { period, year };
        if (period === "month") params.month = month;
        if (period === "quarter") params.quarter = quarter;

        const response = (await getFarmActivityStatistics(params)) as {
          statistics: any;
        };
        setStatistics(response.statistics);
      } catch (err) {
        console.error("Error fetching statistics:", err);
        setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [period, year, month, quarter]);

  // Tạo options
  const yearOptions = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i <= 5; i++) {
    yearOptions.push(currentYear - i);
  }

  return (
    <div className="bg-gray-50 rounded-lg shadow">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-700">
          Thống kê Hoạt động
        </h2>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-4 p-4 items-end bg-white rounded-t-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thời kỳ
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="bg-white border border-gray-300 rounded px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="month">Tháng</option>
            <option value="quarter">Quý</option>
            <option value="year">Năm</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Năm
          </label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-white border border-gray-300 rounded px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {period === "month" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tháng
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-white border border-gray-300 rounded px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>
        )}

        {period === "quarter" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quý
            </label>
            <select
              value={quarter}
              onChange={(e) => setQuarter(Number(e.target.value))}
              className="bg-white border border-gray-300 rounded px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>
                  Quý {q}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Nội dung */}
      <div className="p-4 bg-white rounded-b-lg">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-500 border border-red-200 rounded-md">
            {error}
          </div>
        ) : statistics ? (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-700">
                {statistics.period}
              </h2>
            </div>

            {/* Thẻ thống kê */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <TotalActivitiesCard count={statistics.total_activities} />
              <CompletionRateCard rate={statistics.completion_rate} />
            </div>

            {/* Biểu đồ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <h3 className="text-md font-medium mb-3 text-gray-700">
                  Theo Loại Hoạt Động
                </h3>
                <ActivityTypeChart data={statistics.by_activity_type} />
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-100">
                <h3 className="text-md font-medium mb-3 text-gray-700">
                  Theo Trạng Thái
                </h3>
                <StatusChart data={statistics.by_status} />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-6">
            <p className="text-gray-500">Chọn thời kỳ để xem thống kê</p>
          </div>
        )}
      </div>
    </div>
  );
}
