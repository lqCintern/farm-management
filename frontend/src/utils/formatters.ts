// Định dạng tiền tệ
export const formatCurrency = (price: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(price);
};

// Định dạng ngày tháng
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
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
