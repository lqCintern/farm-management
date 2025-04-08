class FarmActivity < ApplicationRecord
    # Quan hệ
    belongs_to :crop_animal, foreign_key: :crop_animal_id

    # Validation
    validates :activity_type, presence: true
    validates :description, length: { maximum: 255 }
    validates :frequency, presence: true
    validates :status, presence: true
    validates :start_date, presence: true
    validates :end_date, presence: true
end
