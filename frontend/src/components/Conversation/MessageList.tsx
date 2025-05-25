import React, { useEffect, useRef, useState } from "react";
import { listenToMessages, testFirebaseConnection } from "@/utils/firebase";
import {
  CheckIcon,
  CheckCircleIcon,
  UserCircleIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  CalendarIcon
} from "@heroicons/react/24/solid";

interface Message {
  id: string;
  content: string | { content: string }; // Cập nhật kiểu để hỗ trợ cả object
  user_id: number;
  created_at: string;
  read?: boolean;
  read_at?: string;
  image_url?: string; // Hỗ trợ ảnh
  type?: string; // Loại tin nhắn
  payment_info?: any; // Thông tin thanh toán
  metadata?: any; // Metadata khác
}

interface Props {
  messages: Message[];
  currentUserId: number;
  senderInfo?: { user_id: number; fullname: string };
  receiverInfo?: { user_id: number; fullname: string };
  conversationId?: number;
  onNewMessages?: (messages: Message[]) => void;
}

const MessageList: React.FC<Props> = ({
  messages,
  currentUserId,
  senderInfo,
  receiverInfo,
  conversationId,
  onNewMessages,
}) => {
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const normalizedCurrentUserId = Number(currentUserId);

  // Utility function to compare user IDs
  const isSameUser = (id1: any, id2: any): boolean => {
    return Number(id1) === Number(id2);
  };
  
  // Hàm xử lý nội dung tin nhắn
  const renderMessageContent = (message: Message) => {
    const content = getMessageContent(message);
    
    // Nếu là tin nhắn hình ảnh
    if (message.image_url || message.type === 'image') {
      return (
        <div>
          <p>{content}</p>
          {message.image_url && (
            <img 
              src={message.image_url} 
              alt="Message image" 
              className="mt-2 rounded-md max-w-[200px] max-h-[200px] object-cover cursor-pointer"
              onClick={() => window.open(message.image_url, '_blank')} 
            />
          )}
        </div>
      );
    }
    
    // Nếu là tin nhắn thanh toán
    if (message.type === 'payment' && message.payment_info) {
      return (
        <div className="payment-message">
          <p>{content}</p>
          <div className="mt-2 text-xs bg-white bg-opacity-20 p-2 rounded">
            <div>Số tiền: {message.payment_info.amount?.toLocaleString('vi-VN')} đ</div>
            <div>Ngày: {new Date(message.payment_info.date).toLocaleDateString('vi-VN')}</div>
          </div>
          {message.image_url && (
            <img 
              src={message.image_url} 
              alt="Payment proof" 
              className="mt-2 rounded-md max-w-[200px] max-h-[200px] object-cover cursor-pointer"
              onClick={() => window.open(message.image_url, '_blank')} 
            />
          )}
        </div>
      );
    }
    
    // Tin nhắn thông thường
    return <p>{content}</p>;
  };

  // Hàm xử lý nội dung tin nhắn
  const getMessageContent = (message: Message): string => {
    if (typeof message.content === 'object') {
      // Nếu content là object thì lấy thuộc tính content của nó
      return message.content.content || JSON.stringify(message.content);
    }
    
    // Nếu content là string thì trả về trực tiếp
    return message.content;
  };

  // Debug info khi component render
  useEffect(() => {
    console.log("MessageList rendered with props:", {
      messagesCount: messages.length,
      conversationId,
      hasCallback: !!onNewMessages,
      localMessagesCount: localMessages.length,
    });
  }, [messages, conversationId, onNewMessages, localMessages.length]);

  // Scroll to bottom khi messages thay đổi
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  // Ban đầu chỉ set localMessages từ props một lần, dùng để hiển thị ban đầu
  // khi Firebase chưa kết nối xong
  useEffect(() => {
    if (!isInitializedRef.current && messages.length > 0) {
      console.log("Initializing localMessages from props:", messages.length);
      
      // Chuẩn hóa messages để đảm bảo nội dung là string
      const normalizedMessages = messages.map(msg => {
        // Nếu content là object, giữ nguyên để xử lý trong renderMessageContent
        return msg;
      });
      
      setLocalMessages(normalizedMessages);
      isInitializedRef.current = true;
    }
  }, [messages]);

  // Test Firebase connection
  useEffect(() => {
    testFirebaseConnection().then((isConnected) => {
      console.log(
        "Firebase connection test result:",
        isConnected ? "Connected" : "Failed"
      );
    });
  }, []);

  // Thiết lập Firebase Realtime Database listener
  useEffect(() => {
    if (!conversationId) {
      console.log("No conversationId provided, skipping Firebase setup");
      return;
    }

    console.log(
      `Setting up Firebase listener for conversation ${conversationId}`
    );

    // Đăng ký lắng nghe tin nhắn mới
    try {
      const unsubscribe = listenToMessages(
        conversationId,
        (fetchedMessages) => {
          console.log(
            `Received ${fetchedMessages.length} messages from Firebase`
          );

          if (fetchedMessages.length > 0) {
            console.log("Sample message:", fetchedMessages[0]);

            // Kiểm tra trùng lặp trước khi cập nhật
            // Tạo một Map để lưu tin nhắn theo ID
            const messageMap = new Map<string, Message>();

            // Thêm các tin nhắn mới từ Firebase
            fetchedMessages.forEach((msg) => {
              messageMap.set(msg.id, msg);
            });

            // Chuyển Map thành mảng
            const uniqueMessages = Array.from(messageMap.values());

            // Sắp xếp theo thời gian
            const sortedMessages = uniqueMessages.sort(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime()
            );

            // Cập nhật local state
            setLocalMessages(sortedMessages);

            // Gọi callback nếu được cung cấp
            if (onNewMessages) {
              console.log("Calling onNewMessages with fetched messages");
              onNewMessages(sortedMessages);
            }
          }
        }
      );

      // Lưu hàm unsubscribe để cleanup khi unmount
      unsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error("Error setting up Firebase listener:", error);
    }

    // Cleanup function
    return () => {
      console.log(
        "Cleaning up Firebase listener for conversation",
        conversationId
      );
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [conversationId, onNewMessages]);

  // Các hàm và logic hiển thị tin nhắn giữ nguyên
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return (
        date.toLocaleDateString([], { day: "2-digit", month: "2-digit" }) +
        " " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    }
  };

  const groupMessages = (messages: Message[]) => {
    const groups: { userId: number; messages: Message[] }[] = [];

    messages.forEach((message) => {
      // Chuẩn hóa message user_id thành number
      const messageUserId = Number(message.user_id);

      const lastGroup = groups[groups.length - 1];

      if (lastGroup && isSameUser(lastGroup.userId, messageUserId)) {
        lastGroup.messages.push(message);
      } else {
        groups.push({ userId: messageUserId, messages: [message] });
      }
    });

    return groups;
  };

  // Đảm bảo tin nhắn được sắp xếp theo thời gian
  const sortedMessages = [...localMessages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const messageGroups = groupMessages(sortedMessages);

  const getUserName = (userId: number) => {
    if (senderInfo && senderInfo.user_id === userId) return senderInfo.fullname;
    if (receiverInfo && receiverInfo.user_id === userId)
      return receiverInfo.fullname;
    return userId === currentUserId ? "Bạn" : "Người khác";
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
      {localMessages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-400 text-center">
            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
          </p>
        </div>
      ) : (
        messageGroups.map((group, groupIndex) => {
          // Sử dụng function để đảm bảo so sánh đúng
          const isSent = isSameUser(group.userId, normalizedCurrentUserId);
          const userName = getUserName(group.userId);

          return (
            <div
              key={groupIndex}
              className={`space-y-1 ${isSent ? "items-end" : "items-start"}`}
            >
              <div
                className={`flex items-center ${
                  isSent ? "justify-end" : "justify-start"
                } mb-1`}
              >
                {!isSent && (
                  <UserCircleIcon className="h-5 w-5 text-gray-400 mr-1" />
                )}
                <span className="text-xs text-gray-500">{userName}</span>
                {isSent && (
                  <UserCircleIcon className="h-5 w-5 text-gray-400 ml-1" />
                )}
              </div>

              {group.messages.map((message, messageIndex) => (
                <div
                  key={message.id}
                  className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[70%] break-words
                      ${
                        messageIndex === 0
                          ? isSent
                            ? "rounded-tr-none"
                            : "rounded-tl-none"
                          : ""
                      }
                      ${
                        isSent
                          ? "bg-green-500 text-white"
                          : "bg-white border border-gray-200"
                      }`}
                  >
                    {/* Sử dụng hàm renderMessageContent để xử lý nội dung tin nhắn */}
                    {renderMessageContent(message)}
                    
                    <div
                      className={`flex items-center mt-1 text-xs ${
                        isSent ? "text-green-100" : "text-gray-400"
                      } justify-end`}
                    >
                      <span>{formatTime(message.created_at)}</span>
                      {isSent && (
                        <span className="ml-1">
                          {message.read ? (
                            <CheckCircleIcon className="h-3 w-3" />
                          ) : (
                            <CheckIcon className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })
      )}
      <div ref={messageEndRef} />
    </div>
  );
};

export default MessageList;
