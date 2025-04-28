# app/models/product_image.rb
class ProductImage < ApplicationRecord
  belongs_to :product_listing
  
  # Sử dụng Active Storage thay vì lưu đường dẫn
  has_one_attached :image
  
  validates :position, presence: true
  validate :image_content_type
  
  # Hỗ trợ lấy URL đầy đủ của ảnh
  def image_url
  if image.attached?
    Rails.application.routes.default_url_options[:host] = "http://localhost:3000"
    Rails.application.routes.url_helpers.url_for(image)
  end
end
  
  # Hỗ trợ sắp xếp ảnh theo vị trí
  def move_higher
    higher_item = ProductImage.where(product_listing_id: product_listing_id)
                              .where('position < ?', position)
                              .order(position: :desc)
                              .first
    
    return unless higher_item
    
    current_position = position
    self.update_column(:position, higher_item.position)
    higher_item.update_column(:position, current_position)
  end
  
  def move_lower
    lower_item = ProductImage.where(product_listing_id: product_listing_id)
                            .where('position > ?', position)
                            .order(position: :asc)
                            .first
    
    return unless lower_item
    
    current_position = position
    self.update_column(:position, lower_item.position)
    lower_item.update_column(:position, current_position)
  end
  
  private
  
  def image_content_type
    if image.attached? && !image.content_type.in?(%w(image/jpeg image/png image/jpg))
      errors.add(:image, 'must be a JPEG or PNG file')
      image.purge # Xóa file không hợp lệ
    end
  end
end
