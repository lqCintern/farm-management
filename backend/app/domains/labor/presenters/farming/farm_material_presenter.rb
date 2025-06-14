module Farming
  class FarmMaterialPresenter
    def self.as_json(farm_material)
      return {} unless farm_material
      
      {
        id: farm_material.id,
        name: farm_material.name,
        material_id: farm_material.material_id,
        quantity: farm_material.quantity,
        unit: farm_material.unit,
        category: farm_material.category,
        last_updated: farm_material.last_updated,
        created_at: farm_material.created_at,
        updated_at: farm_material.updated_at,
        available_quantity: farm_material.available_quantity
      }
    end
    
    def self.collection_as_json(farm_materials, pagination = nil)
      result = {
        materials: farm_materials.map { |material| as_json(material) }
      }
      
      if pagination
        result[:pagination] = {
          current_page: pagination.page,
          next_page: pagination.next,
          prev_page: pagination.prev,
          total_pages: pagination.pages,
          total_items: pagination.count
        }
      end
      
      result
    end
  end
end
