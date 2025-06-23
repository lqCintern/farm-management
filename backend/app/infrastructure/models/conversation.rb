module Models
  class Conversation < Models::ApplicationRecord
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

    def unread_count(user_id = nil)
      return 0 unless user_id
      messages.where.not(user_id: user_id).where(read: false).count
    end

    def unread_count_for_current_user(current_user_id)
      unread_count(current_user_id)
    end

    private

    def sender_cannot_be_receiver
      if sender_id == receiver_id
        errors.add(:receiver_id, "không thể nhắn tin với chính mình")
      end
    end
  end
end
