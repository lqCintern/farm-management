import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  Title,
} from "chart.js";

// Đăng ký các thành phần Chart.js cần thiết
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, Title);

// Đối chiếu type với tên loại hoạt động
const activityTypeNames = {
  1: "Tưới nước",
  2: "Bón phân",
  3: "Thu hoạch",
  4: "Phun thuốc",
  5: "Làm đất",
  6: "Gieo trồng",
};

// Màu sắc cho các loại hoạt động
const COLORS = [
  "rgba(54, 162, 235, 0.8)", // Xanh dương
  "rgba(75, 192, 192, 0.8)", // Xanh lá
  "rgba(255, 159, 64, 0.8)", // Cam
  "rgba(153, 102, 255, 0.8)", // Tím
  "rgba(255, 99, 132, 0.8)", // Hồng
  "rgba(255, 206, 86, 0.8)", // Vàng
];

interface ActivityTypeChartProps {
  data: Record<string, number>;
}

export default function ActivityTypeChart({ data }: ActivityTypeChartProps) {
  // Chuyển đổi dữ liệu để hiển thị trong biểu đồ
  const chartLabels = Object.entries(data).map(([type]) => {
    return (
      activityTypeNames[type as unknown as keyof typeof activityTypeNames] ||
      `Loại ${type}`
    );
  });

  const chartValues = Object.values(data);

  // Cấu hình biểu đồ
  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        data: chartValues,
        backgroundColor: COLORS,
        borderColor: COLORS.map((color) => color.replace("0.8", "1")),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          boxWidth: 15,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.raw || 0;
            const dataset = context.dataset;
            const total = dataset.data.reduce(
              (acc: number, data: number) => acc + data,
              0
            );
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Kiểm tra dữ liệu trống
  if (Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Không có dữ liệu loại hoạt động
      </div>
    );
  }

  return (
    <div style={{ height: "300px" }}>
      <Pie data={chartData} options={options} />
    </div>
  );
}
