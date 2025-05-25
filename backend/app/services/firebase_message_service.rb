require 'firebase'
require 'open-uri'

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
    timestamp = message_data[:created_at] || Time.now.to_i
    
    # Ghi log để debug
    Rails.logger.info "Saving message to Firebase Realtime DB: conversation_id=#{conversation_id}, content=#{message_data[:content]}"
    
    # Xử lý hình ảnh nếu có
    image_url = nil
    if message_data[:image].present?
      image_url = upload_image(message_data[:image])
      Rails.logger.info "Uploaded image for message: #{image_url}"
    end
    
    # Chuẩn bị dữ liệu tin nhắn
    message_payload = {
      user_id: message_data[:user_id].to_i,
      content: message_data[:content],
      created_at: timestamp,
      read: false
    }
    
    # Thêm URL hình ảnh nếu có
    message_payload[:image_url] = image_url || message_data[:image_url] if image_url.present? || message_data[:image_url].present?
    
    # Thêm type tin nhắn nếu có (text, image, schedule, payment, etc)
    message_payload[:type] = message_data[:type] if message_data[:type].present?
    
    # Thêm thông tin thanh toán nếu có
    if message_data[:payment_info].present?
      message_payload[:payment_info] = message_data[:payment_info]
    end
    
    # Thêm metadata khác nếu có
    if message_data[:metadata].present?
      message_payload[:metadata] = message_data[:metadata]
    end
    
    # Lưu tin nhắn vào Firebase
    response = @firebase.push("conversations/#{conversation_id}/messages", message_payload)
    
    # Cập nhật last_message cho conversation
    if response.success?
      message_id = response.body["name"]
      update_conversation_last_message(conversation_id, message_payload, message_id)
      return message_id
    else
      Rails.logger.error "Firebase error: #{response.body}"
      return nil
    end
  end
  
  # Upload hình ảnh vào Active Storage và trả về URL
  def self.upload_image(image)
    begin
      return image if image.is_a?(String) && image.start_with?('http')
      
      # Xử lý nếu image là ActionDispatch::Http::UploadedFile hoặc tương tự
      if image.respond_to?(:tempfile) && image.respond_to?(:original_filename)
        # Tạo một blob từ file tạm
        blob = ActiveStorage::Blob.create_and_upload!(
          io: image.tempfile,
          filename: image.original_filename,
          content_type: image.content_type || 'image/jpeg'
        )
        
        # Trả về URL
        Rails.application.routes.url_helpers.url_for(blob)
      elsif image.respond_to?(:read) # File hoặc IO object
        # Tạo tên file ngẫu nhiên nếu không có
        filename = "message_image_#{SecureRandom.hex(8)}.jpg"
        
        blob = ActiveStorage::Blob.create_and_upload!(
          io: image,
          filename: filename,
          content_type: 'image/jpeg'
        )
        
        Rails.application.routes.url_helpers.url_for(blob)
      else
        Rails.logger.error "Unsupported image format: #{image.class}"
        nil
      end
    rescue => e
      Rails.logger.error "Error uploading image: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
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
      message = {
        'id' => key,
        'content' => value['content'],
        'user_id' => value['user_id'],
        'created_at' => value['created_at'],
        'read' => value['read'] || false,
        'read_at' => value['read_at']
      }
      
      # Thêm các trường bổ sung
      message['image_url'] = value['image_url'] if value['image_url'].present?
      message['type'] = value['type'] if value['type'].present?
      message['payment_info'] = value['payment_info'] if value['payment_info'].present?
      message['metadata'] = value['metadata'] if value['metadata'].present?
      
      messages << message
    end
    
    # Sắp xếp tin nhắn theo thời gian
    messages.sort_by { |msg| msg['created_at'] }
  end
  
  def self.update_conversation_last_message(conversation_id, message_data, message_id)
    setup_firebase
    
    last_message = {
      content: message_data[:content],
      sender_id: message_data[:user_id],
      created_at: message_data[:created_at],
      message_id: message_id,
      has_image: message_data[:image_url].present?,
      type: message_data[:type] || 'text'
    }
    
    # Cập nhật last_message và last_activity
    @firebase.update("conversations/#{conversation_id}", {
      last_message: last_message,
      last_activity: message_data[:created_at]
    })
    
    # Cập nhật conversation trong database nếu có
    if defined?(Conversation) && Conversation.table_exists?
      conversation = Conversation.find_by(id: conversation_id)
      conversation&.touch(:updated_at)
    end
  end
  
  # Methods khác giữ nguyên
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
