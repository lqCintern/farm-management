class Harvest < ApplicationRecord
    # Quan hệ
    belongs_to :user, foreign_key: :user_id
    belongs_to :crop_animal, foreign_key: :crop_id

    # Validation
    validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
    validates :harvest_date, presence: true
end
