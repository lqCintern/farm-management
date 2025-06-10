class FarmMaterialSerializer
  include JSONAPI::Serializer

  attributes :id, :name, :material_id, :quantity, :last_updated, :created_at, :updated_at,
             :unit, :category

  # Định nghĩa quan hệ
  has_many :activity_materials
end
