import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  InformationCircleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { message } from "antd";
import { socketService } from '@/services/socketService';
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ScheduleHarvestModal from "./ScheduleHarvestModal";
import TransactionConfirmModal from "./TransactionConfirmModal";
import UserVerification from "./UserVerification";
import { getActiveHarvest } from "@/services/marketplace/harvestService";
import {
  sendMessage,
  sendPaymentMessage,
  sendHarvestScheduleMessage,
} from "@/services/marketplace/conversationService";

interface ConversationProps {
  conversation: {
    id: number;
    product_listing: {
      id: number;
      title: string;
      user_id: number;
      product_images?: { image_url: string }[];
    };
    sender: { user_id: number; fullname: string };
    receiver: { user_id: number; fullname: string };
    unread_count: number;
    last_message?: {
      content: string;
      created_at: string;
    };
  };
  messages: any[];
  loading: boolean;
  error: string | null;
  onNewMessages: (messages: any[]) => void;
  onClose: () => void;
}

const Conversation: React.FC<ConversationProps> = ({
  conversation,
  messages,
  loading,
  error,
  onNewMessages,
  onClose,
}) => {
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

  useEffect(() => {
    if (conversation) {
      if (conversation.product_listing.user_id === currentUserId) {
        setUserRole("farmer");
      } else {
        setUserRole("trader");
      }
    }
  }, [conversation, currentUserId]);

  const handleSendMessage = async (messageText: string, image?: File) => {
    try {
      let data;
      if (image) {
        const formData = new FormData();
        formData.append('message', messageText);
        formData.append('image', image);
        data = await sendMessage(conversation.id, formData);
      } else {
        data = await sendMessage(conversation.id, messageText);
      }

      // Gửi tin nhắn qua WebSocket
      socketService.send({
        type: "chat",
        conversation_id: conversation.id,
        content: messageText,
        user_id: currentUserId,
        created_at: new Date().toISOString(),
      });

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
    try {
      const message = `Đã lên lịch thu hoạch vào ngày ${new Date(scheduleData.scheduled_date).toLocaleDateString('vi-VN')} tại ${scheduleData.location}`;
      
      await sendHarvestScheduleMessage(
        conversation.id,
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
    try {
      const message = `Đã thanh toán ${paymentData.amount.toLocaleString('vi-VN')}đ vào ngày ${new Date(paymentData.date).toLocaleDateString('vi-VN')}`;
      
      if (paymentImage) {
        const formData = new FormData();
        formData.append('message', message);
        formData.append('image', paymentImage);
        formData.append('payment_info', JSON.stringify(paymentData));
        formData.append('type', 'payment');
        
        await sendMessage(conversation.id, formData);
      } else {
        await sendPaymentMessage(conversation.id, message, paymentData);
      }
      
      setShowPaymentModal(false);
    } catch (error) {
      console.error("Error confirming payment:", error);
    }
  };

  const handleScheduleButtonClick = () => {
    setPendingAction('schedule');
    setShowVerificationModal(true);
  };

  const handlePaymentButtonClick = async () => {
    try {
      const response = await getActiveHarvest(conversation.product_listing.id);
      
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

  const handleVerificationSuccess = () => {
    setShowVerificationModal(false);
    
    if (pendingAction === 'schedule') {
      setShowScheduleModal(true);
    } else if (pendingAction === 'payment') {
      setShowPaymentModal(true);
    }
    
    setPendingAction(null);
  };

  // Kết nối WebSocket khi component mount
  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    socketService.connect(token);

    // Lắng nghe tin nhắn mới
    socketService.onMessage((data: any) => {
      if (data.type === "chat" && data.conversation_id === conversation.id) {
        onNewMessages([...messages, data]);
      }
    });

    return () => {
      // Cleanup nếu cần
    };
  }, [conversation.id, messages, onNewMessages]);

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-white border-b border-gray-200 p-3 flex items-center">
        <button
          className="md:hidden mr-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>

        <div
          className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden mr-3 cursor-pointer"
          onClick={() => navigate(`/products/${conversation.product_listing.id}`)}
        >
          {conversation.product_listing.product_images?.[0]?.image_url ? (
            <img
              src={conversation.product_listing.product_images[0].image_url}
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
          <h3 className="font-medium">{conversation.product_listing.title}</h3>
          <p className="text-sm text-gray-500">
            {currentUserId === conversation.sender.user_id
              ? conversation.receiver.fullname
              : conversation.sender.fullname}
          </p>
        </div>

        <div className="flex space-x-2">
          {userRole === "trader" && (
            <button 
              className="text-blue-500 hover:text-blue-700 p-1 flex items-center"
              onClick={handleScheduleButtonClick}
            >
              <CalendarIcon className="h-5 w-5 mr-1" />
              <span className="text-sm">Lên lịch</span>
            </button>
          )}
          {userRole && (
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
          senderInfo={conversation.sender}
          receiverInfo={conversation.receiver}
          conversationId={conversation.id}
          onNewMessages={onNewMessages}
        />
      )}

      <MessageInput onSendMessage={handleSendMessage} />

      {showScheduleModal && (
        <ScheduleHarvestModal
          visible={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          productListingId={conversation.product_listing.id}
          traderId={
            currentUserId === conversation.sender.user_id
              ? conversation.receiver.user_id
              : conversation.sender.user_id
          }
          onSuccess={() => {
            setShowScheduleModal(false);
          }}
        />
      )}

      {showPaymentModal && currentHarvest && (
        <TransactionConfirmModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          harvestId={currentHarvest.id}
          onSuccess={() => {
            handleConfirmPayment({ 
              amount: currentHarvest.final_price || 0, 
              date: new Date().toISOString() 
            });
            setCurrentHarvest(null);
          }}
        />
      )}

      {showVerificationModal && (
        <UserVerification
          userId={
            currentUserId === conversation.sender.user_id
              ? conversation.receiver.user_id
              : conversation.sender.user_id
          }
          visible={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          onVerified={handleVerificationSuccess}
        />
      )}
    </div>
  );
};

export default Conversation; 