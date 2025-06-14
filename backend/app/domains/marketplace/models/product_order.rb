# app/models/marketplace/product_order.rb
module Marketplace
  module Models
    class ProductOrder < ApplicationRecord
    self.table_name = "product_orders"

    belongs_to :product_listing, class_name: "Marketplace::ProductListing"
    belongs_to :buyer, class_name: "User", foreign_key: "buyer_id", primary_key: "user_id"

    # Định nghĩa trạng thái bằng enum
    enum :status, {
      pending: 0,
      accepted: 1,
      rejected: 2,
      completed: 3
    }, prefix: true

    # Validation - sửa validation để sử dụng giá trị từ enum
    validates :quantity, presence: true, numericality: { greater_than: 0 }
    validate :buyer_cannot_be_seller
    validate :check_listing_status, on: :create

    # Callbacks
    after_create :update_product_listing_order_count
    after_update :update_product_listing_status, if: :saved_change_to_status?

    # Scope
    scope :for_seller, ->(user_id) {
      joins(:product_listing).where(product_listings: { user_id: user_id })
    }

    # Thêm scope cho từng trạng thái để sử dụng trong controller
    scope :pending_orders, -> { where(status: statuses[:pending]) }
    scope :accepted_orders, -> { where(status: statuses[:accepted]) }
    scope :rejected_orders, -> { where(status: statuses[:rejected]) }
    scope :completed_orders, -> { where(status: statuses[:completed]) }

    # Instance methods
    def seller
      product_listing.user
    end

    def create_notification
      # Thông báo cho người bán về đơn đặt hàng mới
      # Phần này sẽ implement sau khi có notification system
    end

    private

    def buyer_cannot_be_seller
      if buyer_id == product_listing.user_id
        errors.add(:buyer_id, "không thể đặt mua sản phẩm của chính mình")
      end
    end

    def check_listing_status
      unless product_listing.active?
        errors.add(:base, "Sản phẩm này không còn khả dụng để đặt mua")
      end
    end

    def update_product_listing_order_count
      product_listing.increment_order_count!
    end

    def update_product_listing_status
      # Sử dụng các giá trị từ enum thay vì hằng số không tồn tại
      if status == self.class.statuses[:accepted]
        product_listing.update(status: :sold)

        # Từ chối tự động tất cả các đơn hàng khác của sản phẩm này
        product_listing.product_orders
          .where.not(id: id)
          .where(status: self.class.statuses[:pending])
          .each do |order|
            order.update(
              status: self.class.statuses[:rejected],
              rejection_reason: "Đơn hàng đã được bán cho người khác"
            )
          end

        # Có thể tạo transaction để ghi nhận sale
        create_sale_record
      end
    end

    def create_sale_record
      # Nếu có bảng sales, thêm record
      if defined?(::Marketplace::Sale) && product_listing.crop_animal_id.present?
        ::Marketplace::Sale.create(
          user_id: product_listing.user_id,
          crop_id: product_listing.crop_animal_id,
          quantity: quantity,
          price: price,
          sale_date: Time.current
        )
      end
    end
      end
  end
end