class SupplyOrder < ApplicationRecord
  belongs_to :supply_listing
  belongs_to :user, foreign_key: "user_id", primary_key: "user_id"
  has_many :supplier_reviews, dependent: :destroy

  enum :status, { pending: 0, confirmed: 1, shipped: 2, delivered: 3, completed: 4, cancelled: 5, rejected: 6 }

  enum :payment_method, { cod: 0, bank_transfer: 1, ewallet: 2  }

  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :price, presence: true, numericality: { greater_than: 0 }

  scope :buyer_orders, ->(user_id) { where(user_id: user_id) }
  scope :supplier_orders, ->(supplier_id) { joins(:supply_listing).where("supply_listings.user_id = ?", supplier_id) }

  def total_amount
    price * quantity
  end

  def supplier
    supply_listing.user
  end

  def update_order_status(new_status, rejection_reason = nil)
    update(
      status: new_status,
      rejection_reason: rejection_reason
    )

    # Cập nhật số lượng tồn kho nếu hủy đơn hàng đã xác nhận
    if (new_status == "cancelled" || new_status == "rejected") && [ "confirmed", "shipped" ].include?(status_was)
      supply_listing.increment!(:quantity, quantity)
      supply_listing.update(status: :active) if supply_listing.sold_out?
    end
  end
end
