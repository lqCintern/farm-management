import React, { useState, useEffect, useCallback } from "react";
import {
  getConversations,
  getMessages,
  sendMessage,
  sendPaymentMessage,
  sendHarvestScheduleMessage
} from "@/services/marketplace/conversationService";
import { useNavigate } from "react-router-dom";
import ConversationList from "@/components/Conversation/ConversationList";
import MessageList from "@/components/Conversation/MessageList";
import MessageInput from "@/components/Conversation/MessageInput";
import ScheduleHarvestModal from "@/components/Conversation/ScheduleHarvestModal";
import TransactionConfirmModal from "@/components/Conversation/TransactionConfirmModal";
import UserVerification from "@/components/Conversation/UserVerification";
import {
  ArrowLeftIcon,
  PhoneIcon,
  InformationCircleIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { message } from "antd";
import { getActiveHarvest } from "@/services/marketplace/harvestService";

interface Conversation {
  id: number;
  product_listing_id: number;
  sender_id: number;
  receiver_id: number;
  created_at: string;
  updated_at: string;
  unread_count: number;
  last_message_at: string | null;
  product_listing: {
    id: number;
    title: string;
    status: string;
    product_images?: { 
      image_url: string; // Đơn giản hóa chỉ giữ image_url
    }[];
  };
  sender: { user_id: number; user_name: string; fullname: string };
  receiver: { user_id: number; user_name: string; fullname: string };
  last_message?: {
    content: string;
    created_at: string;
  };
}

interface Message {
  id: string;
  content: string | { content: string };  // Hỗ trợ cả object content
  user_id: number;
  created_at: string;
  conversation_id?: number;
  read?: boolean;
  read_at?: string;
  image_url?: string; // Thêm trường cho URL hình ảnh
  type?: string; // Thêm trường cho loại tin nhắn
  payment_info?: any; // Thông tin thanh toán
  metadata?: any; // Metadata khác
}

const ConversationPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [userRole, setUserRole] = useState<"farmer" | "trader" | null>(null);
  const [pendingAction, setPendingAction] = useState<'schedule' | 'payment' | null>(null);
  const [currentHarvest, setCurrentHarvest] = useState<any>(null);
  const navigate = useNavigate();

  const getCurrentUserId = () => {
    try {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        return parsed.user_id;
      }
    } catch (error) {
      console.error("Error parsing user info:", error);
    }
    return 4;
  };

  const currentUserId = getCurrentUserId();

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  useEffect(() => {
    setLoading(true);
    getConversations()
      .then((data) => {
        setConversations(
          data.conversations.map((conv: any) => ({
            id: conv.id,
            product_listing_id: conv.product_listing_id,
            sender_id: conv.sender_id,
            receiver_id: conv.receiver_id,
            created_at: conv.created_at,
            updated_at: conv.updated_at,
            unread_count: conv.unread_count,
            last_message_at: conv.last_message_at,
            product_listing: {
              ...conv.product_listing,
              product_images: conv.product_listing.product_images?.map((img: any) => ({
                image_url: img.image_url || "", // Ensure image_url is always a string
              })),
            },
            sender: conv.sender,
            receiver: conv.receiver,
          }))
        );
        setError(null);
      })
      .catch((err) => {
        console.error("Error loading conversations:", err);
        setError("Không thể tải danh sách hội thoại. Vui lòng thử lại sau.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      setLoading(true);
      getMessages(selectedConversationId)
        .then((data) => {
          setMessages(data.messages);
          setError(null);
        })
        .catch((err) => {
          console.error("Error loading messages:", err);
          setError("Không thể tải tin nhắn. Vui lòng thử lại sau.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [selectedConversationId]);

  // Xác định vai trò người dùng dựa vào conversation hiện tại
  useEffect(() => {
    if (selectedConversation) {
      // Nếu người dùng hiện tại là người gửi tin nhắn đầu tiên -> trader
      // Người nhận tin nhắn (chủ sản phẩm) -> farmer
      if (selectedConversation.sender.user_id === currentUserId) {
        setUserRole("trader");
      } else {
        setUserRole("farmer");
      }
    }
  }, [selectedConversation, currentUserId]);

  useEffect(() => {
    // Lấy user_type từ localStorage
    let userType = null;
    try {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        userType = parsed.user_type;
      }
    } catch (error) {
      console.error("Error parsing user info:", error);
    }
    
    // Xác định vai trò dựa trên user_type
    if (userType === "farmer") {
      setUserRole("farmer");
    } else if (userType === "trader") {
      setUserRole("trader");
    } else {
      setUserRole(null);
    }
  }, []);

  // Callback để xử lý tin nhắn mới từ Firebase listener
  const handleNewMessages = useCallback(
    (newMessages: Message[]) => {
      // Cập nhật state messages với tin nhắn mới
      setMessages(newMessages);

      // Nếu có tin nhắn mới, cập nhật last_message trong danh sách hội thoại
      if (newMessages.length > 0 && selectedConversationId) {
        const latestMessage = newMessages[newMessages.length - 1];

        // Cập nhật conversations để hiển thị tin nhắn mới nhất
        setConversations((prevConversations) =>
          prevConversations.map((conv) =>
            conv.id === selectedConversationId
              ? {
                  ...conv,
                  last_message: {
                    // Xử lý trường hợp content là object
                    content:
                      typeof latestMessage.content === "object"
                        ? latestMessage.content.content
                        : latestMessage.content,
                    created_at: latestMessage.created_at,
                  },
                  // Nếu người gửi không phải là current user, tăng unread_count
                  unread_count:
                    latestMessage.user_id !== currentUserId
                      ? conv.unread_count + 1
                      : conv.unread_count,
                }
              : conv
          )
        );
      }
    },
    [selectedConversationId, currentUserId]
  );

  // Cập nhật hàm handleSendMessage
  const handleSendMessage = async (message: string, image?: File) => {
    if (!selectedConversationId) return;

    try {
      let data;
      
      if (image) {
        // Tạo FormData nếu có hình ảnh
        const formData = new FormData();
        formData.append('message', message);
        formData.append('image', image);
        
        data = await sendMessage(selectedConversationId, formData);
      } else {
        // Gửi tin nhắn text thông thường
        data = await sendMessage(selectedConversationId, message);
      }

      // Không cần thêm tin nhắn vào state nếu đang dùng Firebase listener
      // Firebase sẽ tự động cập nhật tin nhắn mới
      console.log("Tin nhắn đã gửi thành công:", data);

      // Cập nhật danh sách hội thoại với tin nhắn mới nhất
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === selectedConversationId
            ? {
                ...conv,
                last_message: {
                  content: message, // Tin nhắn mới gửi luôn là string
                  created_at: new Date().toISOString(),
                },
              }
            : conv
        )
      );

      return data;
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    }
  };

  const handleScheduleHarvest = async (scheduleData: {
    scheduled_date: string;
    location: string;
    estimated_quantity?: number;
  }) => {
    if (!selectedConversationId) return;

    try {
      const message = `Đã lên lịch thu hoạch vào ngày ${new Date(scheduleData.scheduled_date).toLocaleDateString('vi-VN')} tại ${scheduleData.location}`;
      
      await sendHarvestScheduleMessage(
        selectedConversationId,
        message,
        scheduleData
      );
      
      setShowScheduleModal(false);
    } catch (error) {
      console.error("Error sending harvest schedule:", error);
    }
  };

  const handleConfirmPayment = async (paymentData: {
    amount: number;
    date: string;
    notes?: string;
  }, paymentImage?: File) => {
    if (!selectedConversationId) return;

    try {
      const message = `Đã thanh toán ${paymentData.amount.toLocaleString('vi-VN')}đ vào ngày ${new Date(paymentData.date).toLocaleDateString('vi-VN')}`;
      
      if (paymentImage) {
        const formData = new FormData();
        formData.append('message', message);
        formData.append('image', paymentImage);
        formData.append('payment_info', JSON.stringify(paymentData));
        formData.append('type', 'payment');
        
        await sendMessage(selectedConversationId, formData);
      } else {
        await sendPaymentMessage(selectedConversationId, message, paymentData);
      }
      
      setShowPaymentModal(false);
    } catch (error) {
      console.error("Error confirming payment:", error);
    }
  };

  // Chỉnh sửa các hàm xử lý nút
  const handleScheduleButtonClick = () => {
    setPendingAction('schedule');
    setShowVerificationModal(true);
  };

  const handlePaymentButtonClick = async () => {
    if (!selectedConversation) return;
    
    try {
      // Lấy lịch thu hoạch mới nhất cho sản phẩm này
      const response = await getActiveHarvest(selectedConversation.product_listing.id);
      
      if (response && (response as { harvest?: any }).harvest) {
        setCurrentHarvest((response as { harvest: any }).harvest);
        setPendingAction('payment');
        setShowVerificationModal(true);
      } else {
        message.error('Chưa có lịch thu hoạch cho sản phẩm này');
      }
    } catch (error) {
      console.error('Error fetching harvest:', error);
      message.error('Không thể tải thông tin lịch thu hoạch');
    }
  };

  // Xử lý sau khi xác thực thành công
  const handleVerificationSuccess = () => {
    setShowVerificationModal(false);
    
    // Thực hiện hành động tiếp theo dựa trên pendingAction
    if (pendingAction === 'schedule') {
      setShowScheduleModal(true);
    } else if (pendingAction === 'payment') {
      setShowPaymentModal(true);
    }
    
    // Reset pending action
    setPendingAction(null);
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-2 px-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Tin nhắn</h1>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Conversation List */}
        <div
          className={`w-full md:w-80 flex-shrink-0 ${
            showSidebar ? "block" : "hidden md:block"
          }`}
        >
          {loading && conversations.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse text-gray-400">Đang tải...</div>
            </div>
          ) : error && conversations.length === 0 ? (
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-red-500 text-center">{error}</div>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              onSelectConversation={(id) => {
                setSelectedConversationId(id);
                setShowSidebar(false);
              }}
              selectedId={selectedConversationId}
            />
          )}
        </div>

        {/* Chat Area */}
        <div
          className={`flex-1 flex flex-col ${
            !showSidebar ? "block" : "hidden md:flex"
          }`}
        >
          {selectedConversationId && selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-3 flex items-center">
                <button
                  className="md:hidden mr-2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowSidebar(true)}
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>

                <div
                  className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden mr-3 cursor-pointer"
                  onClick={() =>
                    navigate(
                      `/products/${selectedConversation.product_listing.id}`
                    )
                  }
                >
                  {selectedConversation.product_listing.product_images?.[0]
                    ?.image_url ? (
                    <img
                      src={
                        selectedConversation.product_listing.product_images[0]
                          .image_url
                      }
                      alt="Product"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-green-100 text-green-500">
                      <span className="text-sm font-medium">SP</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-medium">
                    {selectedConversation.product_listing.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {currentUserId === selectedConversation.sender.user_id
                      ? selectedConversation.receiver.fullname
                      : selectedConversation.sender.fullname}
                  </p>
                </div>

                {/* Menu chức năng dựa trên vai trò */}
                <div className="flex space-x-2">
                  {userRole === "farmer" && (
                    <button 
                      className="text-blue-500 hover:text-blue-700 p-1 flex items-center"
                      onClick={handleScheduleButtonClick}
                    >
                      <CalendarIcon className="h-5 w-5 mr-1" />
                      <span className="text-sm">Lên lịch</span>
                    </button>
                  )}
                  {userRole === "trader" && (
                    <button 
                      className="text-green-500 hover:text-green-700 p-1 flex items-center"
                      onClick={handlePaymentButtonClick}
                    >
                      <CurrencyDollarIcon className="h-5 w-5 mr-1" />
                      <span className="text-sm">Thanh toán</span>
                    </button>
                  )}
                  <button className="text-gray-500 hover:text-gray-700 p-1">
                    <InformationCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-pulse text-gray-400">
                    Đang tải tin nhắn...
                  </div>
                </div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-red-500 text-center">{error}</div>
                </div>
              ) : (
                <MessageList
                  messages={messages}
                  currentUserId={currentUserId}
                  senderInfo={selectedConversation?.sender}
                  receiverInfo={selectedConversation?.receiver}
                  conversationId={selectedConversationId}
                  onNewMessages={handleNewMessages}
                />
              )}

              {/* Message Input */}
              <MessageInput onSendMessage={handleSendMessage} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
              <div className="text-center text-gray-500">
                <div className="mb-4">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Chọn hội thoại
                </h3>
                <p className="max-w-sm mx-auto">
                  Chọn một hội thoại từ danh sách bên trái để bắt đầu trò chuyện
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

        {showScheduleModal && selectedConversation && (
          <ScheduleHarvestModal
            visible={showScheduleModal}
            onClose={() => setShowScheduleModal(false)}
            productListingId={selectedConversation.product_listing.id}
            traderId={
          currentUserId === selectedConversation.sender.user_id
            ? selectedConversation.receiver.user_id
            : selectedConversation.sender.user_id
            }
            productListing={selectedConversation.product_listing}
            order={undefined}
            onSuccess={() => {
          setShowScheduleModal(false);
          // Handle success logic if needed
            }}
            />

            )}

            {showPaymentModal && selectedConversation && currentHarvest && (
            <TransactionConfirmModal
              visible={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              harvestId={currentHarvest.id} // Truyền đúng harvest ID
              onSuccess={() => {
                handleConfirmPayment({ amount: currentHarvest.final_price || 0, date: new Date().toISOString() });
                setCurrentHarvest(null); // Reset sau khi hoàn thành
              }}
            />
            )}

            {showVerificationModal && selectedConversation && (
            <UserVerification
              userId={
              currentUserId === selectedConversation.sender.user_id
                ? selectedConversation.receiver.user_id
                : selectedConversation.sender.user_id
              }
              visible={showVerificationModal}
              onClose={() => setShowVerificationModal(false)}
              onVerified={handleVerificationSuccess}
            />
            )}
      </div>
  );
};

export default ConversationPage;
