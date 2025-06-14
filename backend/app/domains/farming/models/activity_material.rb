module Farming
  module Models
    class ActivityMaterial < ApplicationRecord
      # Cập nhật associations với namespace mới
      belongs_to :farm_activity, class_name: "Farming::FarmActivity"
      belongs_to :farm_material, class_name: "Farming::FarmMaterial"

      # Validation
      validates :planned_quantity, presence: true, numericality: { greater_than: 0 }
      validates :actual_quantity, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
    end
  end
end
