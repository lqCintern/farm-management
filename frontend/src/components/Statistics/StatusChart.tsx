import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Đăng ký các thành phần Chart.js cần thiết
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Đối chiếu status với tên trạng thái
const statusNames = {
  pending: "Chưa hoàn thành",
  completed: "Đã hoàn thành",
  cancelled: "Đã hủy",
};

// Màu sắc cho các trạng thái
const STATUS_COLORS = {
  pending: "rgba(255, 159, 64, 0.7)", // Cam
  completed: "rgba(75, 192, 192, 0.7)", // Xanh lá
  cancelled: "rgba(255, 99, 132, 0.7)", // Hồng
};

interface StatusChartProps {
  data: Record<string, number>;
}

export default function StatusChart({ data }: StatusChartProps) {
  // Chuyển đổi dữ liệu để hiển thị trong biểu đồ
  const labels = Object.entries(data).map(([status]) => {
    return statusNames[status as keyof typeof statusNames] || status;
  });

  const values = Object.values(data);
  const backgroundColors = Object.keys(data).map(
    (status) =>
      STATUS_COLORS[status as keyof typeof STATUS_COLORS] ||
      "rgba(54, 162, 235, 0.7)"
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Số lượng",
        data: values,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map((color) => color.replace("0.7", "1")),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `Số lượng: ${context.raw}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          stepSize: 1,
        },
      },
    },
  };

  // Kiểm tra dữ liệu trống
  if (Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Không có dữ liệu trạng thái
      </div>
    );
  }

  return (
    <div style={{ height: "300px" }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
