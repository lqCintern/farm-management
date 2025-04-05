class ProductMaterial < ApplicationRecord
    belongs_to :user, foreign_key: :supplier_id
  
    validates :name, presence: true, length: { maximum: 255 }
    validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :stock, presence: true, numericality: { greater_than_or_equal_to: 0 }
  end