import axiosInstance from "@/utils/axiosConfig";

interface Conversation {
  id: number;
  product_listing: { title: string };
  receiver: { fullname: string };
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  user_id: number;
  created_at: string;
  image_url?: string;
  type?: string;
  payment_info?: any;
  metadata?: any;
  read?: boolean;
}

export const getConversations = async (): Promise<{
  conversations: Conversation[];
}> => {
  const response = await axiosInstance.get<{ conversations: Conversation[] }>(
    `/marketplace/conversations`
  );
  return response.data;
};

export const getMessages = async (
  conversationId: number
): Promise<{ messages: Message[]; user_id: number }> => {
  const response = await axiosInstance.get<{ messages: Message[]; user_id: number }>(
    `/marketplace/conversations/${conversationId}/messages`
  );
  return response.data;
};

export const sendMessage = async (
  conversationId: number,
  data: string | FormData
) => {
  let response;

  if (typeof data === "string") {
    // Gửi tin nhắn text thông thường - Sửa lại cách gửi tin nhắn
    response = await axiosInstance.post(
      `/marketplace/conversations/${conversationId}/messages`,
      {
        message: data  // Gửi trực tiếp chuỗi tin nhắn, không bọc trong object
      }
    );
  } else {
    // Gửi tin nhắn với hình ảnh (FormData)
    response = await axiosInstance.post(
      `/marketplace/conversations/${conversationId}/messages`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
  }

  return response.data;
};

// Thêm hàm mới để gửi tin nhắn với thông tin thanh toán
export const sendPaymentMessage = async (
  conversationId: number,
  content: string,
  paymentInfo: {
    amount: number;
    date: string;
    notes?: string;
  }
) => {
  const response = await axiosInstance.post(
    `/marketplace/conversations/${conversationId}/messages`,
    {
      message: content,
      payment_info: paymentInfo,
      type: "payment"
    }
  );
  return response.data;
};

// Thêm hàm mới để gửi tin nhắn với thông tin lịch trình thu hoạch
export const sendHarvestScheduleMessage = async (
  conversationId: number,
  content: string,
  harvestInfo: {
    scheduled_date: string;
    location: string;
    estimated_quantity?: number;
  }
) => {
  const response = await axiosInstance.post(
    `/marketplace/conversations/${conversationId}/messages`,
    {
      message: content,
      harvest_info: harvestInfo,
      type: "schedule"
    }
  );
  return response.data;
};

export const createOrFindConversation = async (
  productListingId: number | string,
  userId: number | string,
  initialMessage?: string
): Promise<{ conversation_id: number }> => {
  const response = await axiosInstance.post<{
    conversation_id: number;
    message?: string;
  }>(`/marketplace/conversations`, {
    product_listing_id: productListingId,
    user_id: userId,
    message: initialMessage || "Xin chào, tôi quan tâm đến sản phẩm của bạn!",
  });
  return response.data;
};
