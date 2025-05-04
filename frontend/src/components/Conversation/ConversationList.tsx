import React from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

interface Conversation {
  id: number;
  product_listing: {
    title: string;
    product_images?: { image_url: string }[];
  };
  receiver: { fullname: string };
  unread_count: number;
  last_message?: {
    content: string;
    created_at: string;
  };
}

interface Props {
  conversations: Conversation[];
  onSelectConversation: (id: number) => void;
  selectedId?: number | null;
}

const ConversationList: React.FC<Props> = ({
  conversations,
  onSelectConversation,
  selectedId,
}) => {
  const formatTime = (dateString?: string) => {
    if (!dateString) return "";

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
      return date.toLocaleDateString([], { day: "2-digit", month: "2-digit" });
    }
  };

  return (
    <div className="h-full flex flex-col border-r border-gray-200 bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-green-500" />
          Hội thoại
        </h2>
      </div>

      {conversations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-gray-400 text-center">Không có hội thoại nào.</p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto divide-y divide-gray-200">
          {conversations.map((conversation) => (
            <li
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedId === conversation.id ? "bg-gray-100" : ""
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full overflow-hidden">
                  {conversation.product_listing.product_images?.[0]
                    ?.image_url ? (
                    <img
                      src={
                        conversation.product_listing.product_images[0].image_url
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

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.product_listing.title}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.last_message?.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 truncate">
                    {conversation.receiver.fullname}
                  </p>

                  {conversation.last_message && (
                    <p className="mt-1 text-xs text-gray-500 truncate">
                      {conversation.last_message.content}
                    </p>
                  )}
                </div>

                {conversation.unread_count > 0 && (
                  <div className="flex-shrink-0 ml-2">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-xs font-medium text-white">
                      {conversation.unread_count}
                    </span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ConversationList;
