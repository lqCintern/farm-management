module Marketplace
  module Models
    class ProductListing < ApplicationRecord
    self.table_name = "product_listings"

    # Associations
    belongs_to :user, primary_key: :user_id
    belongs_to :pineapple_crop, foreign_key: :crop_animal_id, optional: true, class_name: "Farming::PineappleCrop"
    has_many :product_images, -> { order(position: :asc) }, class_name: "Marketplace::ProductImage", dependent: :destroy
    has_many :product_orders, class_name: "Marketplace::ProductOrder", dependent: :destroy
    has_many :conversations, class_name: "::Conversation", dependent: :nullify
    
    accepts_nested_attributes_for :product_images, allow_destroy: true, reject_if: :all_blank

    # Validations
    validates :title, presence: true
    validates :product_type, presence: true
    validates :quantity, numericality: { greater_than: 0 }, allow_nil: true
    validates :average_size, numericality: { greater_than: 0 }, allow_nil: true
    validates :price_expectation, numericality: { greater_than: 0 }, allow_nil: true
    validate :validate_harvest_dates

    # Chuyển từ hằng số và STATUSES hash sang enum
    enum :status, {
      draft: 0,
      active: 1, 
      sold: 2,
      hidden: 3
    }
    
    scope :published, -> { active }
    
    # Các scope khác giữ nguyên
    scope :by_product_type, ->(type) { where(product_type: type) if type.present? }
    scope :by_location, ->(province) { where(province: province) if province.present? }
    scope :by_price_range, ->(min, max) {
      where("price_expectation >= ? AND price_expectation <= ?", min, max) if min.present? && max.present?
    }
    scope :ready_to_harvest, -> {
      where("harvest_start_date <= ? AND harvest_end_date >= ?", Date.today, Date.today)
    }
    scope :for_user, ->(user_id) { where(user_id: user_id) }

    attr_accessor :min_size, :max_size

    # Callbacks
    before_create :set_default_title

    # Database-specific operations
    def increment_view_count!
      update_column(:view_count, view_count + 1)
    end

    def increment_message_count!
      update_column(:message_count, message_count + 1)
    end

    def increment_order_count!
      update_column(:order_count, order_count + 1)
    end

    def has_been_ordered?
      product_orders.where.not(status: :rejected).exists?
    end

    # Không cần phương thức status_name nữa vì có thể sử dụng status trực tiếp
    # Giữ lại để tương thích ngược
    def status_name
      status.to_sym
    end

    def seller_name
      user&.fullname || user&.user_name
    end

    private

    def validate_harvest_dates
      return if harvest_start_date.nil? || harvest_end_date.nil?

      if harvest_end_date < harvest_start_date
        errors.add(:harvest_end_date, "phải sau ngày bắt đầu thu hoạch")
      end
    end

    def set_default_title
      return if title.present?

      title_parts = []
      title_parts << "Dứa #{product_type} sẵn thu"
      title_parts << "- #{quantity} quả" if quantity.present?
      title_parts << "tại #{province}" if province.present?

      self.title = title_parts.join(" ")
    end
      end
  end
end