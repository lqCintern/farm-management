module Models::Farming
  class TemplateActivityMaterial < Models::ApplicationRecord
    belongs_to :pineapple_activity_template, class_name: "Farming::PineappleActivityTemplate"
    belongs_to :farm_material, class_name: "Farming::FarmMaterial"
    
    validates :quantity, presence: true, numericality: { greater_than: 0 }
    
    # Validation để đảm bảo không trùng lặp vật tư trong cùng template
    validates :farm_material_id, uniqueness: { 
      scope: :pineapple_activity_template_id,
      message: "Vật tư này đã có trong template"
    }
    
    # Validation để đảm bảo farm_material thuộc về user của template
    validate :validate_material_ownership
    
    # Scope để lấy vật tư theo loại
    scope :by_category, ->(category) { joins(:farm_material).where(farm_materials: { category: category }) }
    scope :fertilizers, -> { by_category(:fertilizer) }
    scope :pesticides, -> { by_category(:pesticide) }
    scope :seeds, -> { by_category(:seed) }
    scope :tools, -> { by_category(:tool) }
    scope :others, -> { by_category(:other) }
    
    # Tính tổng số lượng vật tư theo loại
    def self.total_quantity_by_category(template_id, category)
      by_category(category).where(pineapple_activity_template_id: template_id).sum(:quantity)
    end
    
    # Kiểm tra xem template có đủ vật tư trong kho không
    def sufficient_in_inventory?(user_id)
      return false unless farm_material
      
      # Kiểm tra vật tư có thuộc về user không
      return false unless farm_material.user_id == user_id
      
      # Kiểm tra số lượng có đủ không
      farm_material.available_quantity >= quantity
    end
    
    # Lấy thông tin chi tiết vật tư
    def material_info
      return nil unless farm_material
      
      {
        id: farm_material.id,
        name: farm_material.name,
        category: farm_material.category,
        unit: farm_material.unit,
        available_quantity: farm_material.available_quantity,
        total_quantity: farm_material.quantity,
        required_quantity: quantity,
        sufficient: sufficient_in_inventory?(pineapple_activity_template.user_id)
      }
    end
    
    private
    
    def validate_material_ownership
      return unless farm_material && pineapple_activity_template
      
      # Nếu template có user_id (không phải default), thì vật tư phải thuộc về user đó
      if pineapple_activity_template.user_id.present?
        unless farm_material.user_id == pineapple_activity_template.user_id
          errors.add(:farm_material_id, "Vật tư không thuộc về bạn")
        end
      end
    end
  end
end
