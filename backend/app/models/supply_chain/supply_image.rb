module SupplyChain
  class SupplyImage < ApplicationRecord
    self.table_name = 'supply_images'
    
    belongs_to :supply_listing, class_name: "SupplyChain::SupplyListing"

    # Sử dụng Active Storage thay vì lưu đường dẫn
    has_one_attached :image

    validates :position, presence: true
    validate :image_content_type

    # Hỗ trợ lấy URL đầy đủ của ảnh - sửa lại để không set host trong method
    def image_url
      if image.attached?
        begin
          Rails.application.routes.url_helpers.rails_blob_url(image, only_path: false)
        rescue => e
          Rails.logger.error("Error generating image URL: #{e.message}")
          nil
        end
      else
        nil
      end
    end

    # Hỗ trợ sắp xếp ảnh theo vị trí - sửa tham chiếu class
    def move_higher
      higher_item = self.class.where(supply_listing_id: supply_listing_id)
                              .where("position < ?", position)
                              .order(position: :desc)
                              .first

      return unless higher_item

      current_position = position
      self.update_column(:position, higher_item.position)
      higher_item.update_column(:position, current_position)
    end

    def move_lower
      lower_item = self.class.where(supply_listing_id: supply_listing_id)
                            .where("position > ?", position)
                            .order(position: :asc)
                            .first

      return unless lower_item

      current_position = position
      self.update_column(:position, lower_item.position)
      lower_item.update_column(:position, current_position)
    end

    # Scope để sắp xếp theo vị trí
    scope :sorted, -> { order(position: :asc) }

    private

    def image_content_type
      if image.attached? && !image.content_type.in?(%w[image/jpeg image/png image/jpg])
        errors.add(:image, "phải là file JPEG hoặc PNG")
        image.purge # Xóa file không hợp lệ
      end
    end
  end
end
