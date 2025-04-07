class FarmMaterial < ApplicationRecord
    belongs_to :user, foreign_key: :user_id

    validates :name, presence: true, length: { maximum: 255 }
    validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
end
