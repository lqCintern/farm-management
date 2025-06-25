module Models::Farming
  class TemplateActivityMaterial < Models::ApplicationRecord
    belongs_to :pineapple_activity_template, class_name: "Farming::PineappleActivityTemplate"
    belongs_to :farm_material, class_name: "Farming::FarmMaterial"
    
    validates :quantity, presence: true, numericality: { greater_than: 0 }
  end
end
