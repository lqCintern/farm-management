// Dữ liệu màu sắc cho các loại hoạt động
export const activityTypeColors: Record<
  number,
  { background: string; text: string; icon: string }
> = {
  1: { background: "#E3F2FD", text: "#0277BD", icon: "💧" }, // Tưới nước - xanh nhạt
  2: { background: "#E8F5E9", text: "#2E7D32", icon: "🌱" }, // Bón phân - xanh lá
  3: { background: "#FFF3E0", text: "#EF6C00", icon: "🍎" }, // Thu hoạch - cam
  4: { background: "#F3E5F5", text: "#7B1FA2", icon: "🧪" }, // Phun thuốc - tím
  5: { background: "#FFFDE7", text: "#F57F17", icon: "🚜" }, // Làm đất - vàng
  6: { background: "#E0F7FA", text: "#00838F", icon: "🌾" }, // Gieo trồng - xanh ngọc
};

// Hàm trợ giúp để lấy văn bản trạng thái
export const getStatusText = (status: string): string => {
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

// Hàm trợ giúp để lấy màu sắc theo trạng thái
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "pending":
      return "#FFC107"; // Vàng
    case "completed":
      return "#4CAF50"; // Xanh lá
    case "cancelled":
      return "#F44336"; // Đỏ
    default:
      return "#9E9E9E"; // Xám
  }
};

// Hàm lấy tên loại hoạt động
export const getActivityTypeName = (type: number): string => {
  const types: Record<number, string> = {
    1: "Tưới nước",
    2: "Bón phân",
    3: "Thu hoạch",
    4: "Phun thuốc",
    5: "Làm đất",
    6: "Gieo trồng",
  };
  return types[type] || `Loại ${type}`;
};
