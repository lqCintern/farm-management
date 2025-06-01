class ActivityMaterial < ApplicationRecord
  # Quan hệ
  belongs_to :farm_activity
  belongs_to :farm_material

  # Validation
  validates :planned_quantity, presence: true, numericality: { greater_than: 0 }
  validates :actual_quantity, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
end
