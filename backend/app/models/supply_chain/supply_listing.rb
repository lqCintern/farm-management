module SupplyChain
  class SupplyListing < ApplicationRecord
    self.table_name = "supply_listings"

    belongs_to :user, foreign_key: "user_id", primary_key: "user_id"

    has_many :supply_images, class_name: "SupplyChain::SupplyImage", dependent: :destroy
    has_many :supply_orders, class_name: "SupplyChain::SupplyOrder", dependent: :destroy
    has_many :supplier_reviews, class_name: "SupplyChain::SupplierReview", dependent: :destroy

    has_one_attached :main_image
    has_many_attached :additional_images

    enum :category, { fertilizer: 0, pesticide: 1, seed: 2, equipment: 3, other: 4 }

    enum :status, { draft: 0, active: 1, inactive: 2, sold_out: 3 }

    validates :name, presence: true
    validates :price, presence: true, numericality: { greater_than: 0 }
    validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :unit, presence: true

    scope :available, -> { where(status: :active).where("quantity > 0") }
    scope :by_category, ->(category) { where(category: category) if category.present? }
    scope :by_province, ->(province) { where(province: province) if province.present? }

    # Thêm các trường quản lý số lượng
    after_initialize :set_default_quantities, if: :new_record?

    # Số lượng có sẵn để đặt hàng = quantity - pending_quantity
    def available_quantity
      quantity - (pending_quantity || 0)
    end

    def update_stock_after_order(ordered_quantity)
      new_quantity = self.quantity - ordered_quantity
      self.update(
        quantity: new_quantity,
        status: new_quantity <= 0 ? :sold_out : :active
      )
    end

    # Lấy URL cho main_image
    def main_image_url
      if main_image.attached?
        begin
          Rails.application.routes.url_helpers.rails_blob_url(main_image, only_path: false)
        rescue => e
          Rails.logger.error("Error generating main image URL: #{e.message}")
          nil
        end
      else
        nil
      end
    end

    # Lấy URL cho additional_images
    def additional_image_urls
      if additional_images.attached?
        additional_images.map do |image|
          begin
            Rails.application.routes.url_helpers.rails_blob_url(image, only_path: false)
          rescue => e
            Rails.logger.error("Error generating additional image URL: #{e.message}")
            nil
          end
        end.compact
      else
        []
      end
    end

    # Override as_json để bao gồm URLs
    def as_json(options = {})
      super(options).merge(
        main_image_url: main_image_url,
        additional_image_urls: additional_image_urls,
        supplier_name: user&.fullname || user&.user_name,
        average_rating: supplier_reviews.average(:rating)&.round(1) || 0,
        reviews_count: supplier_reviews.count
      )
    end

    private

    def set_default_quantities
      self.pending_quantity ||= 0
      self.sold_quantity ||= 0
    end
  end
end
