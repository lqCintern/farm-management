# app/services/firebase_service.rb
# require 'firebase_admin'
require "google/cloud/firestore"

class FirebaseService
  def self.initialize_firebase
    return if @initialized

    firebase_credentials = JSON.parse(File.read(ENV["FIREBASE_CREDENTIALS_PATH"]))

    FirebaseAdmin::Messaging.configure(
      credentials: firebase_credentials
    )

    @initialized = true
  end

  def self.save_message(conversation_id, message_data)
    message_ref = FIREBASE_FIRESTORE.col("conversations").doc(conversation_id.to_s).col("messages").add(
      user_id: message_data[:user_id],
      content: message_data[:content],
      created_at: Time.now.utc.iso8601,
      read: false
    )

    # Trả về ID của document vừa tạo trong Firestore
    message_ref.document_id
  end

  def self.mark_message_as_read(conversation_id, message_id)
    # Đánh dấu tin nhắn đã đọc trong Firestore
    FIREBASE_FIRESTORE.col("conversations").doc(conversation_id.to_s).col("messages").doc(message_id).update(
      read: true,
      read_at: Time.now.utc.iso8601
    )
  end

  def self.mark_messages_as_read(conversation_id, user_id)
    # Lấy tất cả tin nhắn chưa đọc
    messages = FIREBASE_FIRESTORE.col("conversations")
                               .doc(conversation_id.to_s)
                               .col("messages")
                               .where("read", "==", false)
                               .where("user_id", "!=", user_id.to_s)
                               .get

    messages.each do |message|
      if message.reference
        message.reference.update(
          { read: true, read_at: Time.now.utc.iso8601 }
        )
      else
        puts "Message reference is nil for message: #{message.data}"
      end
    end
  end

  def self.get_messages(conversation_id, limit = 50)
    messages = FIREBASE_FIRESTORE.col("conversations")
                               .doc(conversation_id.to_s)
                               .col("messages")
                               .order("created_at", :desc)
                               .limit(limit)
                               .get

    messages.map do |message|
      message_data = message.data.dup
      message_data[:id] = message.document_id
      message_data
    end
  end

  def self.get_unread_count(conversation_id, user_id)
    messages = FIREBASE_FIRESTORE.col("conversations")
                               .doc(conversation_id.to_s)
                               .col("messages")
                               .where("read", "==", false)
                               .where("user_id", "!=", user_id.to_s)
                               .get

    messages.count
  end
end
