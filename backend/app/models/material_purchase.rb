class MaterialPurchase < ApplicationRecord
    # Quan hệ
    belongs_to :user, foreign_key: :user_id
    belongs_to :product_material, foreign_key: :supply_id

    # Validation
    validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :purchase_date, presence: true
end
