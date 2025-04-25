import { useState } from "react";
import FarmActivityList from "@/components/FarmActivity/FarmActivityList";
import FarmActivityStats from "@/components/FarmActivity/FarmActivityStats";
import { useNavigate } from "react-router-dom";

export default function FarmActivities() {
  const [activeTab, setActiveTab] = useState<"list" | "stats">("list");
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Hoạt động Nông trại
        </h1>
        <button
          onClick={() => navigate("/farm-activities/new")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Thêm hoạt động mới
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("list")}
          className={`py-3 px-6 font-medium text-sm focus:outline-none ${
            activeTab === "list"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Danh sách hoạt động
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`py-3 px-6 font-medium text-sm focus:outline-none ${
            activeTab === "stats"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Thống kê
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "list" ? <FarmActivityList /> : <FarmActivityStats />}
    </div>
  );
}
