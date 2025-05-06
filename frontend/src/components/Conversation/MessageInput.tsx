import React, { useState } from "react";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/outline";

interface Props {
  onSendMessage: (message: string) => void;
}

const MessageInput: React.FC<Props> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (message.trim()) {
      setIsSending(true);
      try {
        await onSendMessage(message);
        setMessage("");
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3 sticky bottom-0">
      <div className="flex items-center space-x-2">
        <button
          className="text-gray-400 hover:text-gray-600 rounded-full p-2 transition-colors"
          title="Đính kèm file"
        >
          <PaperClipIcon className="h-5 w-5" />
        </button>

        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          className="flex-1 border-0 focus:ring-2 focus:ring-green-500 rounded-full bg-gray-100 py-2 px-4 text-gray-700 placeholder-gray-400 focus:outline-none"
          disabled={isSending}
        />

        <button
          onClick={handleSend}
          disabled={isSending || !message.trim()}
          className={`rounded-full p-2 ${
            message.trim() && !isSending
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          } transition-colors`}
          title="Gửi tin nhắn"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
