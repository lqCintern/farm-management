# app/services/firebase_service.rb
require 'firebase_admin'

class FirebaseService
  def self.initialize_firebase
    return if @initialized
    
    # Khởi tạo Firebase Admin SDK 
    firebase_credentials = JSON.parse(File.read(ENV['FIREBASE_CREDENTIALS_PATH']))
    
    FirebaseAdmin::Messaging.configure(
      credentials: firebase_credentials
    )
    
    @initialized = true
  end
  
  def self.save_message(conversation_id, message_data)
    initialize_firebase
    
    # Tạo reference đến collection messages trong Firestore
    firestore = FirebaseAdmin::Firestore.client
    
    # Lưu tin nhắn vào Firestore
    message_ref = firestore.col("conversations").doc(conversation_id.to_s).col("messages").add(
      user_id: message_data[:user_id],
      content: message_data[:content],
      created_at: Time.now.utc.iso8601,
      read: false
    )
    
    # Trả về ID của document vừa tạo trong Firestore
    message_ref.document_id
  end
  
  def self.mark_message_as_read(conversation_id, message_id)
    initialize_firebase
    
    # Đánh dấu tin nhắn đã đọc trong Firestore
    firestore = FirebaseAdmin::Firestore.client
    firestore.col("conversations").doc(conversation_id.to_s).col("messages").doc(message_id).update(
      read: true,
      read_at: Time.now.utc.iso8601
    )
  end
  
  def self.get_messages(conversation_id, limit = 50)
    initialize_firebase
    
    # Lấy tin nhắn từ Firestore
    firestore = FirebaseAdmin::Firestore.client
    messages = firestore.col("conversations").doc(conversation_id.to_s).col("messages")
                       .order("created_at", "desc")
                       .limit(limit)
                       .get
    
    # Chuyển đổi dữ liệu từ Firestore sang hash
    messages.map(&:data)
  end
end