# app/models/product_order.rb
class ProductOrder < ApplicationRecord
  belongs_to :product_listing
  belongs_to :buyer, class_name: 'User', foreign_key: 'buyer_id', primary_key: 'user_id'

  # Định nghĩa trạng thái bằng hằng số
  STATUS_PENDING = 0
  STATUS_ACCEPTED = 1
  STATUS_REJECTED = 2
  STATUS_COMPLETED = 3

  STATUS_OPTIONS = {
    pending: STATUS_PENDING,
    accepted: STATUS_ACCEPTED,
    rejected: STATUS_REJECTED,
    completed: STATUS_COMPLETED
  }.freeze

  # Validation
  validates :status, inclusion: { in: STATUS_OPTIONS.values }
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

  scope :for_buyer, ->(buyer_id) { where(buyer_id: buyer_id) }

  # Instance methods
  def seller
    product_listing.user
  end

  def status_name
    STATUS_OPTIONS.key(status).to_s
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
    # Nếu đơn hàng được chấp nhận, chuyển trạng thái listing sang "sold"
    if status == STATUS_ACCEPTED
      product_listing.update(status: :sold)

      # Từ chối tự động tất cả các đơn hàng khác của sản phẩm này
      product_listing.product_orders.where.not(id: id).where(status: STATUS_PENDING).each do |order|
        order.update(
          status: STATUS_REJECTED,
          rejection_reason: "Đơn hàng đã được bán cho người khác"
        )
      end

      # Có thể tạo transaction để ghi nhận sale
      create_sale_record
    end
  end

  def create_sale_record
    # Nếu có bảng sales, thêm record
    if defined?(Sale) && product_listing.crop_animal_id.present?
      Sale.create(
        user_id: product_listing.user_id,
        crop_id: product_listing.crop_animal_id,
        quantity: quantity,
        price: price,
        sale_date: Time.current
      )
    end
  end
end
