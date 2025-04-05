class CropAnimal < ApplicationRecord
    # Quan hệ
    has_many :farm_activities, foreign_key: :crop_animal_id, dependent: :destroy
    has_many :sales, foreign_key: :crop_id, dependent: :destroy
    has_many :harvests, foreign_key: :crop_id, dependent: :destroy
  
    # Validation
    validates :type, presence: true
    validates :name, presence: true, length: { maximum: 255 }
    validates :area, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
    validates :start_date, presence: true
    validates :end_date, presence: true
  end