import React, { useEffect, useRef } from "react";
import {
  CheckIcon,
  CheckCircleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";

interface Message {
  id: string;
  content: string;
  user_id: number;
  created_at: string;
  read?: boolean;
  read_at?: string;
}

interface Props {
  messages: Message[];
  currentUserId: number;
  senderInfo?: { user_id: number; fullname: string };
  receiverInfo?: { user_id: number; fullname: string };
}

const MessageList: React.FC<Props> = ({
  messages,
  currentUserId,
  senderInfo,
  receiverInfo,
}) => {
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sortedMessages = [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

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
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.userId === message.user_id) {
        lastGroup.messages.push(message);
      } else {
        groups.push({ userId: message.user_id, messages: [message] });
      }
    });

    return groups;
  };

  const messageGroups = groupMessages(sortedMessages);

  const getUserName = (userId: number) => {
    if (senderInfo && senderInfo.user_id === userId) return senderInfo.fullname;
    if (receiverInfo && receiverInfo.user_id === userId)
      return receiverInfo.fullname;
    return userId === currentUserId ? "Bạn" : "Người khác";
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-400 text-center">
            Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
          </p>
        </div>
      ) : (
        messageGroups.map((group, groupIndex) => {
          const isSent = group.userId === currentUserId;
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
                    <p className="text-sm">{message.content}</p>
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
