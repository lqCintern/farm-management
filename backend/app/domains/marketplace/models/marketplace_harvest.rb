module Marketplace
  class MarketplaceHarvest < ApplicationRecord
    self.table_name = "marketplace_harvests"

    # Quan hệ
    belongs_to :product_listing, class_name: "Marketplace::ProductListing"
    belongs_to :trader, class_name: "User", foreign_key: "trader_id", primary_key: "user_id"
    belongs_to :product_order, class_name: "Marketplace::ProductOrder", optional: true
    has_one_attached :payment_proof_image

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
  end
end
