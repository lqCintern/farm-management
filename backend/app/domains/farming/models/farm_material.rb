module Farming
  module Models
    class FarmMaterial < ApplicationRecord
      # Quan hệ
      belongs_to :user, foreign_key: :user_id
      has_many :activity_materials, class_name: "Farming::ActivityMaterial", dependent: :destroy
      has_many :farm_activities, through: :activity_materials, class_name: "Farming::FarmActivity"

      # Validation
      validates :name, presence: true, length: { maximum: 255 }
      validates :quantity, presence: true, numericality: { greater_than_or_equal_to: 0 }
      validates :unit, presence: true

      # Phân loại vật tư
      enum :category, { fertilizer: 0, pesticide: 1, seed: 2, tool: 3, other: 4 }

      # Scope để lấy vật tư theo loại
      scope :fertilizers, -> { where(category: :fertilizer) }
      scope :pesticides, -> { where(category: :pesticide) }
      scope :seeds, -> { where(category: :seed) }
      scope :tools, -> { where(category: :tool) }

      # Kiểm tra số lượng còn lại
      def available_quantity
        # Tính toán số lượng đã được sử dụng trong các hoạt động chưa hoàn thành
        used_quantity = activity_materials
          .joins(:farm_activity)
          .where.not(farm_activities: { status: "completed" })
          .sum(:planned_quantity)

        # Trừ đi số lượng đã sử dụng từ tổng
        quantity - used_quantity
      end

      # Kiểm tra xem có đủ số lượng không
      def has_enough?(amount)
        available_quantity >= amount
      end
    end
  end
end
