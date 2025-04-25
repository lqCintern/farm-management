import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFarmActivities } from "@/services/farmService";
import { FarmActivity, Pagination } from "@/types";

export default function FarmActivityList() {
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    activity_type: "",
    status: "",
    crop_animal_id: "",
    start_date: "",
    end_date: "",
  });

  const navigate = useNavigate();

  // Fetch activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await getFarmActivities();
        setActivities(response.farm_activities);
        setPagination(response.pagination);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch activities:", err);
        setError("Không thể tải danh sách hoạt động");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (!pagination) return;
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Chưa hoàn thành";
      case "completed":
        return "Đã hoàn thành";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div>
            <label
              htmlFor="activity_type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Loại hoạt động
            </label>
            <select
              id="activity_type"
              name="activity_type"
              value={filters.activity_type}
              onChange={handleFilterChange}
              className="bg-white border border-gray-300 rounded px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="1">Tưới nước</option>
              <option value="2">Bón phân</option>
              <option value="3">Thu hoạch</option>
              <option value="4">Phun thuốc</option>
              <option value="5">Làm đất</option>
              <option value="6">Gieo trồng</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Trạng thái
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="bg-white border border-gray-300 rounded px-3 py-2 w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chưa hoàn thành</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>

          {/* Thêm các filter khác nếu cần */}
        </div>
      </div>

      {/* Activities List */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-500 border border-red-200 rounded-md m-4">
            {error}
          </div>
        ) : activities.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Loại hoạt động
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Mô tả
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Thời gian
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Trạng thái
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activity.activity_type === 1 && "Tưới nước"}
                    {activity.activity_type === 2 && "Bón phân"}
                    {activity.activity_type === 3 && "Thu hoạch"}
                    {activity.activity_type === 4 && "Phun thuốc"}
                    {activity.activity_type === 5 && "Làm đất"}
                    {activity.activity_type === 6 && "Gieo trồng"}
                    {activity.activity_type > 6 &&
                      `Loại ${activity.activity_type}`}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {activity.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(activity.start_date).toLocaleDateString()} -{" "}
                      {new Date(activity.end_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                        activity.status_label
                      )}`}
                    >
                      {activity.status_label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() =>
                        navigate(`/farm-activities/${activity.id}`)
                      }
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Chi tiết
                    </button>
                    <button
                      onClick={() =>
                        navigate(`/farm-activities/${activity.id}/edit`)
                      }
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center p-6">
            <p className="text-gray-500">Không có hoạt động nào phù hợp.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Hiển thị{" "}
                <span className="font-medium">
                  {(pagination.current_page - 1) * 10 + 1}
                </span>{" "}
                đến{" "}
                <span className="font-medium">
                  {Math.min(
                    pagination.current_page * 10,
                    pagination.total_items
                  )}
                </span>{" "}
                trong{" "}
                <span className="font-medium">{pagination.total_items}</span>{" "}
                kết quả
              </p>
            </div>
            <div>
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  disabled={!pagination.prev_page}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.prev_page
                      ? "text-gray-500 hover:bg-gray-50"
                      : "text-gray-300 cursor-not-allowed"
                  }`}
                >
                  &laquo; Trước
                </button>

                {/* Render page numbers */}
                {[...Array(pagination.total_pages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      pagination.current_page === i + 1
                        ? "bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                  disabled={!pagination.next_page}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    pagination.next_page
                      ? "text-gray-500 hover:bg-gray-50"
                      : "text-gray-300 cursor-not-allowed"
                  }`}
                >
                  Tiếp &raquo;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
