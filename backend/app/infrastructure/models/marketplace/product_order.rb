# app/models/marketplace/product_order.rb
module Models::Marketplace
  class ProductOrder < Models::ApplicationRecord
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
    validates :total_weight, presence: true, numericality: { greater_than: 0 }
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
      Rails.logger.info "=== buyer_cannot_be_seller validation ==="
      Rails.logger.info "buyer_id: #{buyer_id}"
      Rails.logger.info "product_listing.user_id: #{product_listing&.user_id}"
      Rails.logger.info "product_listing.id: #{product_listing&.id}"
      
      if buyer_id == product_listing.user_id
        Rails.logger.error "Validation failed: buyer_id (#{buyer_id}) == seller_id (#{product_listing.user_id})"
        errors.add(:buyer_id, "không thể đặt mua sản phẩm của chính mình")
      else
        Rails.logger.info "Validation passed: buyer_id (#{buyer_id}) != seller_id (#{product_listing.user_id})"
      end
    end

    def check_listing_status
      # Cho phép tạo đơn hàng mới cho sản phẩm đã bán (sold)
      # Chỉ từ chối nếu sản phẩm bị ẩn hoặc draft
      if product_listing.hidden? || product_listing.draft?
        errors.add(:base, "Sản phẩm này không còn khả dụng để đặt mua")
      end
    end

    def update_product_listing_order_count
      product_listing.increment_order_count!
    end

    def update_product_listing_status
      Rails.logger.info "=== update_product_listing_status called ==="
      Rails.logger.info "Order ID: #{id}, Status: #{status}"
      Rails.logger.info "Product Listing ID: #{product_listing.id}"
      Rails.logger.info "Current product_listing.quantity: #{product_listing.quantity}"
      Rails.logger.info "Current product_listing.total_weight: #{product_listing.total_weight}"
      Rails.logger.info "Order quantity: #{quantity}"
      Rails.logger.info "Order total_weight: #{total_weight}"
      
      if status == self.class.statuses[:accepted] || status == self.class.statuses[:completed]
        # Trừ số lượng quả và khối lượng khỏi product_listing
        if product_listing.quantity && quantity
          new_quantity = product_listing.quantity - quantity
          Rails.logger.info "Updating quantity from #{product_listing.quantity} to #{new_quantity}"
          if !product_listing.update(quantity: new_quantity)
            Rails.logger.error "Failed to update quantity: #{product_listing.errors.full_messages.join(', ')}"
          end
        end
        if product_listing.total_weight && total_weight
          new_total_weight = product_listing.total_weight - total_weight
          Rails.logger.info "Updating total_weight from #{product_listing.total_weight} to #{new_total_weight}"
          if !product_listing.update(total_weight: new_total_weight)
            Rails.logger.error "Failed to update total_weight: #{product_listing.errors.full_messages.join(', ')}"
          end
        end
      end
      if status == self.class.statuses[:accepted]
        Rails.logger.info "Updating product_listing status to sold"
        if !product_listing.update(status: :sold)
          Rails.logger.error "Failed to update status to sold: #{product_listing.errors.full_messages.join(', ')}"
        end
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
        create_sale_record
      end
      Rails.logger.info "=== update_product_listing_status completed ==="
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
