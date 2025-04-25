import { parse, format } from "date-fns";
// Removed parseISO as it is not exported by date-fns
import { vi } from "date-fns/locale";

// Chuẩn hóa định dạng ngày tháng
export const parseDate = (dateString: string): Date => {
  // Thử phân tích cú pháp từ nhiều định dạng có thể có
  try {
    if (dateString.includes("-")) {
      const parts = dateString.split("-");
      if (parts.length === 3) {
        // Kiểm tra xem nếu là dd-mm-yyyy
        if (parts[0].length === 2 && parts[1].length === 2) {
          return parse(dateString, "dd-MM-yyyy", new Date());
        }
        // Kiểm tra xem nếu là yyyy-mm-dd
        if (parts[0].length === 4) {
          return parse(dateString, "yyyy-MM-dd", new Date());
        }
      }
    }
    // Mặc định trả về ngày hiện tại nếu không thể phân tích
    return new Date(dateString);
  } catch (error) {
    console.error("Error parsing date:", dateString, error);
    return new Date(); // Trả về ngày hiện tại nếu có lỗi
  }
};

// Format date to display format
export const formatDate = (dateString: string): string => {
  try {
    const date = parseDate(dateString);
    return format(date, "EEEE, dd/MM/yyyy", { locale: vi });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Return original string if error
  }
};
