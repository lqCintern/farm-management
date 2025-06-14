# app/models/product_image.rb
module Marketplace
  class ProductImage < ApplicationRecord
    self.table_name = "product_images"

    belongs_to :product_listing, class_name: "Marketplace::ProductListing"

    # Sử dụng Active Storage thay vì lưu đường dẫn
    has_one_attached :image

    validates :position, presence: true
    validate :image_content_type

    # Sửa lại phương thức lấy URL - xóa bỏ phần image_path không tồn tại
    def image_url
      if image.attached?
        # Sử dụng cấu hình URL từ ứng dụng
        begin
          Rails.application.routes.url_helpers.rails_blob_url(image, only_path: false)
        rescue => e
          # Log lỗi và trả về nil nếu có vấn đề
          Rails.logger.error("Error generating image URL: #{e.message}")
          nil
        end
      else
        # Trả về nil nếu không có ảnh
        nil
      end
    end

    # Hỗ trợ sắp xếp ảnh theo vị trí
    def move_higher
      higher_item = self.class.where(product_listing_id: product_listing_id)
                              .where("position < ?", position)
                              .order(position: :desc)
                              .first

      return unless higher_item

      current_position = position
      self.update_column(:position, higher_item.position)
      higher_item.update_column(:position, current_position)
    end

    def move_lower
      lower_item = self.class.where(product_listing_id: product_listing_id)
                            .where("position > ?", position)
                            .order(position: :asc)
                            .first

      return unless lower_item

      current_position = position
      self.update_column(:position, lower_item.position)
      lower_item.update_column(:position, current_position)
    end

    private

    def image_content_type
      if image.attached? && !image.content_type.in?(%w[image/jpeg image/png image/jpg])
        errors.add(:image, "must be a JPEG or PNG file")
        image.purge # Xóa file không hợp lệ
      end
    end
  end
end
