# app/models/conversation.rb
class Conversation < ApplicationRecord
  belongs_to :product_listing, class_name: "Marketplace::ProductListing", optional: true
  belongs_to :sender, class_name: "User", foreign_key: "sender_id", primary_key: "user_id"
  belongs_to :receiver, class_name: "User", foreign_key: "receiver_id", primary_key: "user_id"

  has_many :messages, -> { order(created_at: :asc) }, dependent: :destroy

  validates :sender_id, presence: true
  validates :receiver_id, presence: true
  validate :sender_cannot_be_receiver

  # Scope
  scope :for_user, ->(user_id) {
    where("sender_id = :id OR receiver_id = :id", id: user_id)
  }

  # Methods
  def last_message
    messages.order(created_at: :desc).first
  end

  def other_user(current_user_id)
    sender_id == current_user_id ? receiver : sender
  end

  # Phương thức này vẫn giữ nguyên để sử dụng cho các lệnh gọi trực tiếp
  def unread_count(user_id)
    messages.where.not(user_id: user_id).where(read: false).count
  end

  # Phương thức này được sửa đổi để hoạt động trong as_json
  # Mặc định sẽ tìm user_id từ Thread.current hoặc trả về 0
  def unread_count_for_current_user(current_user_id = nil)
    # Nếu có tham số được truyền vào, ưu tiên sử dụng
    user_id = current_user_id

    # Nếu không có tham số, thử lấy từ Thread.current
    if user_id.nil? && Thread.current[:current_user].present?
      user_id = Thread.current[:current_user].user_id
    end
    
    # Nếu vẫn không có user_id, trả về 0 thay vì lỗi
    return 0 unless user_id

    unread_count(user_id)
  end

  private

  def sender_cannot_be_receiver
    if sender_id == receiver_id
      errors.add(:receiver_id, "không thể nhắn tin với chính mình")
    end
  end
end
