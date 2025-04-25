class FarmActivity < ApplicationRecord

  belongs_to :user
  belongs_to :crop_animal, foreign_key: :crop_animal_id
  has_many :activity_materials, dependent: :destroy
  has_many :farm_materials, through: :activity_materials
  
  # Lịch trình lặp lại
  belongs_to :parent_activity, class_name: "FarmActivity", optional: true
  has_many :child_activities, class_name: "FarmActivity", foreign_key: :parent_activity_id, dependent: :destroy
  
  # Enum định nghĩa
  enum :status, { pending: 0, completed: 1, cancelled: 2 }, prefix: true
enum :frequency, { once: 0, daily: 1, weekly: 2, monthly: 3 }, prefix: true
  
  # Validation
  validates :activity_type, presence: true
  validates :description, length: { maximum: 255 }
  validates :frequency, presence: true
  validates :status, presence: true
  validates :start_date, presence: true
  validates :end_date, presence: true
  
end
