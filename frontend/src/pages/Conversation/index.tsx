import React, { useState, useEffect } from "react";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "@/services/conversationService";
import ConversationList from "@/components/Conversation/ConversationList";
import MessageList from "@/components/Conversation/MessageList";
import MessageInput from "@/components/Conversation/MessageInput";
import {
  ArrowLeftIcon,
  PhoneIcon,
  InformationCircleIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

interface Conversation {
  id: number;
  product_listing: {
    title: string;
    product_images?: { image_url: string }[];
  };
  sender: { user_id: number; fullname: string };
  receiver: { user_id: number; fullname: string };
  unread_count: number;
  last_message?: {
    content: string;
    created_at: string;
  };
}

interface Message {
  id: string;
  content: string;
  user_id: number;
  created_at: string;
  read?: boolean;
  read_at?: string;
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
    return 4; // Fallback user ID nếu không lấy được từ localStorage
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
            product_listing: conv.product_listing,
            sender: conv.sender,
            receiver: conv.receiver,
            unread_count: conv.unread_count,
            last_message: conv.last_message,
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

  const handleSendMessage = async (message: string) => {
    if (!selectedConversationId) return;

    try {
      const data = await sendMessage(selectedConversationId, message);

      // Cập nhật danh sách tin nhắn
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: data.message_id,
          content: message,
          user_id: currentUserId,
          created_at: new Date().toISOString(),
          read: false,
        },
      ]);

      // Cập nhật danh sách hội thoại với tin nhắn mới nhất
      setConversations((prevConversations) =>
        prevConversations.map((conv) =>
          conv.id === selectedConversationId
            ? {
                ...conv,
                last_message: {
                  content: message,
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

                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden mr-3">
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

                <div className="flex space-x-2">
                  <button className="text-gray-500 hover:text-gray-700 p-1">
                    <PhoneIcon className="h-5 w-5" />
                  </button>
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
    </div>
  );
};

export default ConversationPage;
