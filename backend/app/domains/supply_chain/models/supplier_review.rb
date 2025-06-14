module SupplyChain
  module Models
  class SupplierReview < ApplicationRecord
    self.table_name = "supplier_reviews"

    belongs_to :supply_listing, class_name: "SupplyChain::SupplyListing"
    belongs_to :supply_order, class_name: "SupplyChain::SupplyOrder"
    belongs_to :reviewer, class_name: "User", foreign_key: "reviewer_id", primary_key: "user_id"
    belongs_to :supplier, class_name: "User", foreign_key: "supplier_id", primary_key: "user_id"

    validates :rating, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 1, less_than_or_equal_to: 5 }
    validates :content, length: { maximum: 1000 }

    # Đảm bảo mỗi đơn hàng chỉ được đánh giá một lần
    validates :supply_order_id, uniqueness: true

    # Chỉ những đơn hàng đã hoàn thành mới được đánh giá
    validate :order_must_be_completed

    # Trả về thông tin đánh giá kèm thông tin người đánh giá
    def as_json(options = {})
      review_json = super(options)

      unless options[:skip_associations]
        review_json[:reviewer] = reviewer.as_json(only: [ :user_id, :user_name, :fullname ])
        review_json[:supplier] = supplier.as_json(only: [ :user_id, :user_name, :fullname ])
        review_json[:supply_listing] = supply_listing.as_json(only: [ :id, :name ])
      end

      review_json
    end

    private

    def order_must_be_completed
      unless supply_order.completed?
        errors.add(:supply_order, "chưa được hoàn thành, không thể đánh giá")
      end
    end
  end
  end
end