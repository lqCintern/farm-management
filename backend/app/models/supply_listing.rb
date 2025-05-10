class SupplyListing < ApplicationRecord
  belongs_to :user, foreign_key: 'user_id', primary_key: 'user_id'
  
  has_many :supply_images, dependent: :destroy
  has_many :supply_orders, dependent: :destroy
  has_many :supplier_reviews, dependent: :destroy
  
  has_one_attached :main_image
  has_many_attached :additional_images
  
  enum :category, { fertilizer: 0, pesticide: 1, seed: 2, equipment: 3, other: 4}
  
  enum :status, { draft: 0, active: 1, inactive: 2, sold_out: 3}
  
  validates :name, presence: true
  validates :price, presence: true, numericality: { greater_than: 0 }
  validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :unit, presence: true
  
  scope :available, -> { where(status: :active).where('quantity > 0') }
  scope :by_category, ->(category) { where(category: category) if category.present? }
  scope :by_province, ->(province) { where(province: province) if province.present? }
  
  def update_stock_after_order(ordered_quantity)
    new_quantity = self.quantity - ordered_quantity
    self.update(
      quantity: new_quantity,
      status: new_quantity <= 0 ? :sold_out : :active
    )
  end
end
