require 'firebase'

class FirebaseMessageService
  def self.setup_firebase
    @firebase ||= Firebase::Client.new(
      ENV.fetch('FIREBASE_DATABASE_URL', 'https://farm-management-4f61c-default-rtdb.asia-southeast1.firebasedatabase.app/'),
      ENV.fetch('FIREBASE_DATABASE_SECRET', nil)
    )
  end
  
  def self.save_message(conversation_id, message_data)
    setup_firebase
    
    # Tạo key cho tin nhắn dựa trên thời gian
    timestamp = Time.now.to_i
    
    # Ghi log để debug
    Rails.logger.info "Saving message to Firebase Realtime DB: conversation_id=#{conversation_id}, content=#{message_data[:content]}"
    
    # Lưu tin nhắn vào Firebase
    response = @firebase.push("conversations/#{conversation_id}/messages", {
      user_id: message_data[:user_id].to_i,
      content: message_data[:content],
      created_at: timestamp,
      read: false
    })
    
    # Kiểm tra kết quả
    if response.success?
      # Trả về ID tin nhắn (key) được Firebase tạo ra
      response.body["name"]
    else
      Rails.logger.error "Firebase error: #{response.body}"
      nil
    end
  end
  
  def self.get_messages(conversation_id, limit = 50)
    setup_firebase
    
    # Tạo query để lấy tin nhắn với limit và sắp xếp
    response = @firebase.get("conversations/#{conversation_id}/messages", {
      format: 'export',
      orderBy: '"created_at"',
      limitToLast: limit.to_i
    })
    
    # Kiểm tra kết quả
    return [] unless response.success? && response.body
    
    # Chuyển từ hash sang array
    messages = []
    response.body.each do |key, value|
      messages << {
        'id' => key,
        'content' => value['content'],
        'user_id' => value['user_id'],
        'created_at' => value['created_at'],
        'read' => value['read'] || false,
        'read_at' => value['read_at']
      }
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
    
    # Lấy tất cả tin nhắn
    messages = get_messages(conversation_id)
    
    # Lọc tin nhắn chưa đọc và không phải do user_id gửi
    unread_messages = messages.select do |msg| 
      !msg['read'] && msg['user_id'].to_s != user_id.to_s
    end
    
    Rails.logger.info "Marking #{unread_messages.length} messages as read for user #{user_id} in conversation #{conversation_id}"
    
    # Đánh dấu từng tin nhắn là đã đọc
    unread_messages.each do |msg|
      mark_message_as_read(conversation_id, msg['id'])
    end
    
    # Trả về số lượng tin nhắn đã đánh dấu
    unread_messages.length
  end

  def self.test_connection
    setup_firebase
    
    test_ref = "test_connection"
    timestamp = Time.now.to_i
    
    # Thử push dữ liệu test
    response = @firebase.set(test_ref, {
      timestamp: timestamp,
      message: "Test connection at #{Time.now}"
    })
    
    # Kiểm tra response
    if response.success?
      {
        success: true,
        message: "Successfully connected to Firebase Realtime Database",
        detail: response.body
      }
    else
      {
        success: false,
        message: "Failed to connect to Firebase Realtime Database",
        error: response.body
      }
    end
  end
end
