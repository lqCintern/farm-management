import axiosInstance from "@/utils/axiosConfig";

// Lấy danh sách các mối liên hệ đổi công
export const getHouseholdExchanges = async () => {
  const response = await axiosInstance.get("/labor/exchanges");
  return response.data;
};

export const getExchangeSummary = async () => {
  const response = await axiosInstance.get("/labor/exchanges");
  return response.data as RecalculationResponse;
};

// Lấy chi tiết trao đổi công với một hộ cụ thể
export const getExchangeDetails = async (householdId: number) => {
  // Sử dụng endpoint show_by_household để lấy chi tiết
  const response = await axiosInstance.get(`/labor/exchanges/households/${householdId}`);
  return response.data;
};

// Lấy lịch sử giao dịch với một hộ khác
export const getExchangeTransactionHistory = async (
  householdId: number,
  page: number = 1,
  perPage: number = 20
) => {
  const response = await axiosInstance.get("/labor/exchanges/transaction_history", {
    params: {
      household_id: householdId,
      page,
      per_page: perPage
    }
  });
  return response.data;
};

// Reset số dư công về 0
export const resetExchangeBalance = async (exchangeId: number) => {
  const response = await axiosInstance.post(`/labor/exchanges/${exchangeId}/reset_balance`);
  return response.data;
};

// Điều chỉnh số dư công thủ công
export const adjustExchangeBalance = async (
  householdId: number,
  hours: number,
  notes: string
) => {
  const response = await axiosInstance.post("/labor/exchanges/adjust_balance", {
    household_id: householdId,
    hours,
    notes
  });
  return response.data;
};

// Tính lại số dư
export const recalculateBalance = async (householdId: number) => {
  const response = await axiosInstance.post(`/labor/exchanges/households/${householdId}/recalculate`);
  return response.data;
};

// Tính lại tất cả số dư
export const recalculateAllBalances = async () => {
  const response = await axiosInstance.post("/labor/exchanges/recalculate_all");
  return response.data;
};

// Reset số dư
export const resetBalance = async (exchangeId: number) => {
  const response = await axiosInstance.post(`/labor/exchanges/${exchangeId}/reset_balance`);
  return response.data;
};

interface RecalculationResponse {
  data: {
    exchange: any;
    old_balance: number;
    new_balance: number;
    difference: number;
  };
}

// Tính lại số dư công với một hộ
export const recalculateExchangeBalance = async (householdId: number): Promise<RecalculationResponse> => {
  const response = await axiosInstance.post<RecalculationResponse>(
    `/labor/exchanges/households/${householdId}/recalculate`
  );
  return response.data;
};

// Tính lại số dư công với tất cả các hộ
export const recalculateAllExchangeBalances = async () => {
  const response = await axiosInstance.post("/labor/exchanges/recalculate_all");
  return response.data;
};

// Tạo dữ liệu đổi công ban đầu từ các assignment đã hoàn thành
export const initializeExchangeData = async () => {
  const response = await axiosInstance.post("/labor/exchanges/initialize");
  return response.data;
};
