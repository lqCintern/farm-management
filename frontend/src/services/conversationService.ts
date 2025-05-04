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
}

export const getConversations = async (): Promise<{
  conversations: Conversation[];
}> => {
  const response = await axiosInstance.get<{ conversations: Conversation[] }>(
    `/conversations`
  );
  return response.data;
};

export const getMessages = async (
  conversationId: number
): Promise<{ messages: Message[] }> => {
  const response = await axiosInstance.get<{ messages: Message[] }>(
    `/conversations/${conversationId}/messages`
  );
  return response.data;
};

export const sendMessage = async (
  conversationId: number,
  message: string
): Promise<{ message_id: string }> => {
  const response = await axiosInstance.post<{ message_id: string }>(
    `/conversations/${conversationId}/messages`,
    {
      message,
    }
  );
  return response.data;
};

// Thêm service mới để tạo/tìm cuộc hội thoại
export const createOrFindConversation = async (
  productListingId: number | string,
  userId: number | string,
  initialMessage?: string
): Promise<{ conversation_id: number }> => {
  const response = await axiosInstance.post<{
    conversation_id: number;
    message?: string;
  }>(`/conversations`, {
    product_listing_id: productListingId,
    user_id: userId,
    message: initialMessage || "Xin chào, tôi quan tâm đến sản phẩm của bạn!",
  });
  return response.data;
};
