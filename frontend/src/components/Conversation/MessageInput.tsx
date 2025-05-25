import React, { useState } from "react";
import { PaperAirplaneIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { XCircleIcon } from "@heroicons/react/24/solid";

interface MessageInputProps {
  onSendMessage: (message: string, image?: File) => Promise<any>;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage }) => {
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Kiểm tra nếu không có tin nhắn và không có hình ảnh
    if ((!message.trim() && !imageFile) || sending) return;

    try {
      setSending(true);
      await onSendMessage(message, imageFile || undefined);
      setMessage("");
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    // Tạo preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="border-t border-gray-200 p-3 bg-white">
      {imagePreview && (
        <div className="relative mb-2 inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-32 max-w-32 rounded border border-gray-300"
          />
          <button
            type="button"
            className="absolute top-0 right-0 p-1 bg-white rounded-full shadow-md"
            onClick={removeImage}
          >
            <XCircleIcon className="h-5 w-5 text-red-500" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center">
        <label className="cursor-pointer mr-2 text-gray-500 hover:text-gray-700">
          <PhotoIcon className="h-6 w-6" />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
        </label>

        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-blue-500"
        />

        <button
          type="submit"
          className="ml-2 bg-green-500 text-white rounded-full p-2 hover:bg-green-600 disabled:opacity-50"
          disabled={(!message.trim() && !imageFile) || sending}
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
