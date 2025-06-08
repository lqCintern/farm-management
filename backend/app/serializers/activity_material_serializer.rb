class ActivityMaterialSerializer
  include JSONAPI::Serializer
  
  attributes :id, :planned_quantity, :actual_quantity
  
  # Định nghĩa quan hệ
  belongs_to :farm_activity
  belongs_to :farm_material
  
  # Thêm thuộc tính từ farm_material để tiện truy cập
  attribute :name do |activity_material|
    activity_material.farm_material.name
  end
  
  attribute :unit do |activity_material|
    activity_material.farm_material.unit
  end
  
  attribute :category do |activity_material|
    activity_material.farm_material.category
  end
end
