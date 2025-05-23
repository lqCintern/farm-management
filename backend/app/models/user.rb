class User < ApplicationRecord
    has_secure_password

    has_many :farm_activities, foreign_key: :user_id, dependent: :destroy
    has_many :farm_materials, foreign_key: :user_id, dependent: :destroy
    has_many :product_materials, foreign_key: :supplier_id, dependent: :destroy
    has_many :transactions, foreign_key: :user_id, dependent: :destroy
    has_many :sales, foreign_key: :user_id, dependent: :destroy
    has_many :materials_purchases, foreign_key: :user_id, dependent: :destroy
    has_many :harvests, foreign_key: :user_id, dependent: :destroy
    has_one :member, foreign_key: :user_id, dependent: :destroy
    has_one :cooperative, foreign_key: :leader_id, dependent: :destroy
    has_many :crop_animals, dependent: :destroy
    has_many :fields, dependent: :destroy
    has_many :pineapple_crops, dependent: :destroy
    has_many :pineapple_activity_templates, dependent: :destroy

    validates :user_name, presence: true, length: { maximum: 255 }
    validates :email, presence: true, uniqueness: true, length: { maximum: 255 }
    validates :password, presence: true, length: { minimum: 6 }, if: :password_required?
    validates :phone, presence: true, length: { maximum: 255 }
    self.primary_key = "user_id"

    # Thêm relations cho tính năng bán nông sản
    has_many :product_listings, foreign_key: :user_id, dependent: :destroy
    has_many :product_orders, foreign_key: 'buyer_id', primary_key: 'user_id'
    has_many :sent_conversations, class_name: 'Conversation', foreign_key: 'sender_id', primary_key: 'user_id'
    has_many :received_conversations, class_name: 'Conversation', foreign_key: 'receiver_id', primary_key: 'user_id'

    # Cập nhật định nghĩa enum user_type
    enum :user_type, { admin: 0, farmer: 1, supplier: 2, trader: 3 }

    def conversations
        Conversation.where("sender_id = :id OR receiver_id = :id", id: user_id)
    end

    def unread_messages_count
        Message.joins(:conversation)
            .where("conversations.sender_id = :id OR conversations.receiver_id = :id", id: user_id)
            .where.not(user_id: user_id)
            .where(read: false)
            .count
    end

    def active_for_authentication?
        super && status.zero? # 0 là active
    end

    # Thêm các mối quan hệ với chức năng mua bán vật tư
    has_many :supply_listings, foreign_key: 'user_id', primary_key: 'user_id', dependent: :destroy
    has_many :supply_orders, foreign_key: 'user_id', primary_key: 'user_id', dependent: :destroy
    has_many :supplier_reviews_received, class_name: 'SupplierReview', foreign_key: 'supplier_id', primary_key: 'user_id'
    has_many :supplier_reviews_given, class_name: 'SupplierReview', foreign_key: 'reviewer_id', primary_key: 'user_id'

    # Lấy trung bình đánh giá của nhà cung cấp
    def average_rating
        supplier_reviews_received.average(:rating) || 0
    end

    # Lấy các đơn hàng cần xác nhận (dành cho nhà cung cấp)
    def pending_supply_orders
        SupplyOrder.supplier_orders(user_id).pending
    end

    # Lấy các đơn hàng đang xử lý (dành cho người mua)
    def processing_orders
        supply_orders.where(status: [:pending, :confirmed, :shipped])
    end

    private

    def password_required?
        new_record? || password.present?
    end
end
