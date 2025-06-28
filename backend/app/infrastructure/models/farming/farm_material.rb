module Models::Farming
  class FarmMaterial < Models::ApplicationRecord
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
      # Sử dụng virtual field available_quantity đã được tính toán
      # quantity - reserved_quantity
      self[:available_quantity] || (quantity - (reserved_quantity || 0))
    end

    # Kiểm tra xem có đủ số lượng không
    def has_enough?(amount)
      available_quantity >= amount
    end

    # Reserve vật tư cho hoạt động
    def reserve_quantity(amount)
      return false if available_quantity < amount
      
      update(reserved_quantity: (reserved_quantity || 0) + amount)
    end

    # Commit vật tư (trừ kho thật)
    def commit_quantity(amount)
      return false if quantity < amount
      
      # Trừ quantity và reserved_quantity
      update(
        quantity: quantity - amount,
        reserved_quantity: (reserved_quantity || 0) - amount
      )
    end

    # Hoàn trả vật tư đã reserve
    def release_reserved_quantity(amount)
      current_reserved = reserved_quantity || 0
      return false if current_reserved < amount
      
      update(reserved_quantity: current_reserved - amount)
    end

    # Hoàn trả vật tư vào kho (khi dùng ít hơn planned)
    def return_quantity(amount)
      update(quantity: quantity + amount)
    end
  end
end
