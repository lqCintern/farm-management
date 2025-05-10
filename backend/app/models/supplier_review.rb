class SupplierReview < ApplicationRecord
  belongs_to :supply_listing
  belongs_to :supply_order
  belongs_to :reviewer, class_name: 'User', foreign_key: 'reviewer_id', primary_key: 'user_id'
  belongs_to :supplier, class_name: 'User', foreign_key: 'supplier_id', primary_key: 'user_id'
  
  validates :rating, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 }
  validates :content, length: { maximum: 1000 }
  
  # Đảm bảo mỗi đơn hàng chỉ được đánh giá một lần
  validates :supply_order_id, uniqueness: true
  
  # Chỉ những đơn hàng đã hoàn thành mới được đánh giá
  validate :order_must_be_completed
  
  private
  
  def order_must_be_completed
    unless supply_order.completed?
      errors.add(:supply_order, "chưa được hoàn thành, không thể đánh giá")
    end
  end
end
