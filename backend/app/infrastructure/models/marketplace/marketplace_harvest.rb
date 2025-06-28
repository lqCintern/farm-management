module Models::Marketplace
  class MarketplaceHarvest < Models::ApplicationRecord
    self.table_name = "marketplace_harvests"

    # Quan hệ
    belongs_to :product_listing, class_name: "Marketplace::ProductListing"
    belongs_to :trader, class_name: "User", foreign_key: "trader_id", primary_key: "user_id"
    belongs_to :product_order, class_name: "Marketplace::ProductOrder", optional: true
    belongs_to :farm_activity, class_name: "Farming::FarmActivity", optional: true
    has_one_attached :payment_proof_image

    # Callback tạo FarmActivity khi tạo harvest
    after_create :create_farm_activity, unless: :farm_activity_id?
    after_update :sync_activity_status, if: :saved_change_to_status?

    # Enum cho trạng thái
    enum :status, {
      scheduled: 0,   # Đã lên lịch
      harvesting: 1,  # Đang thu hoạch
      completed: 2,   # Đã hoàn thành
      cancelled: 3    # Đã hủy
    }

    # Validation
    validates :scheduled_date, presence: true
    validates :location, presence: true
    validates :trader_id, presence: true
    validates :product_listing_id, presence: true

    # Lấy thông tin farmer từ product_listing
    def farmer
      @farmer ||= User.find_by(user_id: product_listing.user_id)
    end

    # Kiểm tra quyền truy cập
    def can_be_managed_by?(user)
      product_listing.user_id == user.user_id || trader_id == user.user_id
    end

    # Lấy URL của hình ảnh thanh toán
    def payment_proof_url
      if payment_proof_image.attached?
        Rails.application.routes.url_helpers.url_for(payment_proof_image)
      else
        nil
      end
    end

    # Gửi thông báo khi lịch thu hoạch được tạo/cập nhật
    def send_notification_message(user_id, action_type = :created)
      # Tìm cuộc trò chuyện
      conversation = find_conversation
      return unless conversation

      # Xác định nội dung tin nhắn
      case action_type
      when :created
        content = "Đã lên lịch thu hoạch cho sản phẩm #{product_listing.title} vào ngày #{scheduled_date.strftime('%d/%m/%Y %H:%M')}. Địa điểm: #{location}"
        message_type = "schedule"
      when :updated
        content = "Đã cập nhật lịch thu hoạch sang ngày #{scheduled_date.strftime('%d/%m/%Y %H:%M')}. Địa điểm: #{location}"
        message_type = "schedule_update"
      when :status_changed
        content = "Trạng thái thu hoạch đã thay đổi thành: #{status}"
        message_type = "status_update"
      when :payment_completed
        content = "Đã hoàn thành thanh toán #{final_price} đồng cho sản phẩm #{product_listing.title}"
        message_type = "payment"
      end

      # Gửi tin nhắn thông báo
      FirebaseMessageService.save_message(conversation.id, {
        user_id: user_id,
        content: content,
        type: message_type,
        created_at: Time.now.to_i * 1000
      })
    end

    private

    def create_farm_activity
      return unless product_listing&.crop_animal_id && product_listing&.pineapple_crop&.field_id

      # Map MarketplaceHarvest status to FarmActivity status
      activity_status = case status
      when "scheduled"
        "pending"
      when "harvesting"
        "in_progress"
      when "completed"
        "completed"
      when "cancelled"
        "cancelled"
      else
        "pending"
      end

      # Tạo hoạt động thu hoạch với các thuộc tính cần thiết
      activity = ::Models::Farming::FarmActivity.new(
        activity_type: "harvesting", # Sử dụng enum value đúng
        description: "Thu hoạch #{product_listing.title} cho thương lái #{trader&.fullname || trader_id}",
        frequency: "once",
        status: activity_status,
        start_date: scheduled_date.to_date,
        end_date: scheduled_date.to_date,
        user_id: product_listing.user_id, # farmer
        field_id: product_listing.pineapple_crop.field_id,
        crop_animal_id: product_listing.crop_animal_id
      )

      # Bỏ qua validation quy trình và kiểm tra trùng lặp cho hoạt động marketplace
      activity.skip_similar_check = true
      
      # Thêm thuộc tính để bỏ qua validation quy trình nếu có
      if activity.respond_to?(:skip_process_validation=)
        activity.skip_process_validation = true
      end

      if activity.save
        update_column(:farm_activity_id, activity.id)
        Rails.logger.info "Created farm activity #{activity.id} for marketplace harvest #{id}"
      else
        Rails.logger.error "Failed to create farm activity for marketplace harvest #{id}: #{activity.errors.full_messages.join(', ')}"
      end
    end

    def find_conversation
      farmer_id = product_listing.user_id

      ::Conversation.find_by(
        product_listing_id: product_listing_id,
        sender_id: trader_id,
        receiver_id: farmer_id
      ) || ::Conversation.find_by(
        product_listing_id: product_listing_id,
        sender_id: farmer_id,
        receiver_id: trader_id
      )
    end

    def sync_activity_status
      return unless farm_activity
      
      case status
      when "scheduled"
        farm_activity.update(status: "pending")
      when "harvesting"
        farm_activity.update(status: "in_progress")
      when "completed"
        farm_activity.update(status: "completed")
      when "cancelled"
        farm_activity.update(status: "cancelled")
      end
      
      Rails.logger.info "Synced marketplace harvest #{id} status to #{status}, farm activity #{farm_activity.id} status to #{farm_activity.status}"
    end
  end
end
