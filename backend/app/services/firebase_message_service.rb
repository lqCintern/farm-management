require 'firebase'

class FirebaseMessageService
  def self.setup_firebase
    @firebase ||= Firebase::Client.new(
      ENV.fetch('FIREBASE_DATABASE_URL', 'https://your-firebase-project-id.firebaseio.com'),
      ENV.fetch('FIREBASE_DATABASE_SECRET', nil)
    )
  end
  
  def self.save_message(conversation_id, message_data)
    setup_firebase
    
    # Tạo key cho tin nhắn dựa trên thời gian
    timestamp = Time.now.to_i
    
    # Lưu tin nhắn vào Firebase
    response = @firebase.push("conversations/#{conversation_id}/messages", {
      user_id: message_data[:user_id],
      content: message_data[:content],
      created_at: timestamp,
      read: false
    })
    
    # Đồng thời cập nhật thông tin conversation
    @firebase.update("conversations/#{conversation_id}", {
      last_message: message_data[:content],
      last_message_at: timestamp,
      last_message_user_id: message_data[:user_id]
    })
    
    # Trả về firebase ID
    response.body["name"]
  end
  
  def self.get_messages(conversation_id, limit = 50)
    setup_firebase
    
    # Lấy tin nhắn từ Firebase, sắp xếp theo thời gian tạo
    response = @firebase.get("conversations/#{conversation_id}/messages", {
      orderBy: '"created_at"',
      limitToLast: limit
    })
    
    return [] unless response.success?
    
    # Chuyển đổi dữ liệu trả về thành mảng
    messages = []
    response.body.each do |key, value|
      messages << value.merge('id' => key)
    end
    
    # Sắp xếp tin nhắn theo thời gian
    messages.sort_by { |msg| msg['created_at'] }
  end
  
  def self.mark_message_as_read(conversation_id, message_id)
    setup_firebase
    
    # Đánh dấu tin nhắn là đã đọc
    @firebase.update("conversations/#{conversation_id}/messages/#{message_id}", {
      read: true,
      read_at: Time.now.to_i
    })
  end
  
  def self.mark_all_as_read(conversation_id, user_id)
    setup_firebase
    
    # Lấy tất cả tin nhắn chưa đọc gửi đến user_id
    response = @firebase.get("conversations/#{conversation_id}/messages", {
      orderBy: '"read"',
      equalTo: false
    })
    
    return unless response.success?
    
    # Đánh dấu tất cả tin nhắn là đã đọc
    response.body.each do |key, value|
      # Chỉ đánh dấu tin nhắn không phải do user_id gửi
      if value['user_id'] != user_id
        mark_message_as_read(conversation_id, key)
      end
    end
  end
end