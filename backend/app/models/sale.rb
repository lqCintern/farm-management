class Sale < ApplicationRecord
    belongs_to :user, foreign_key: :user_id
    belongs_to :crop_animal, foreign_key: :crop_id

    validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :sale_date, presence: true
end
