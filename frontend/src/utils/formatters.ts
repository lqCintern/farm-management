// Định dạng tiền tệ
export const formatCurrency = (price: number): string => {
  // Làm tròn số và loại bỏ phần thập phân nếu là số nguyên
  const roundedPrice = Math.round(price);

  // Định dạng số với dấu phân cách hàng nghìn
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(roundedPrice)
    .replace("₫", "đ") // Thay ký hiệu tiền tệ mặc định bằng "đ"
    .trim(); // Loại bỏ khoảng trắng thừa
};

// Định dạng ngày tháng
export const formatDate = (dateString?: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const formatDateTime = (dateString?: string) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

// Lấy tên trạng thái từ mã
export const getStatusLabel = (status: number): string => {
  switch (status) {
    case 0:
      return "Bản nháp";
    case 1:
      return "Đang rao bán";
    case 2:
      return "Đã bán";
    case 3:
      return "Đã ẩn";
    default:
      return "Không xác định";
  }
};

// Lấy màu cho trạng thái
export const getStatusColor = (status: number): string => {
  switch (status) {
    case 0:
      return "bg-gray-500";
    case 1:
      return "bg-green-500";
    case 2:
      return "bg-blue-500";
    case 3:
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

export const formatTime = (timeString?: string) => {
  if (!timeString) return "";

  // Nếu timeString có dạng HH:MM:SS
  if (timeString.indexOf(":") > 0) {
    return timeString.substring(0, 5); // Lấy chỉ HH:MM
  }

  // Nếu timeString là ISO string
  const date = new Date(timeString);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
