class FarmMaterial < ApplicationRecord
  # Quan hệ
  belongs_to :user, foreign_key: :user_id
  has_many :activity_materials
  has_many :farm_activities, through: :activity_materials
  
  # Validation
  validates :name, presence: true, length: { maximum: 255 }
  validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :unit, presence: true
  
  # Phân loại vật tư
  enum :category, { fertilizer: 0, pesticide: 1, seed: 2, tool: 3, other: 4 }

end
