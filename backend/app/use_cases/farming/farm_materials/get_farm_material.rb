module Farming
  module FarmMaterials
    class GetFarmMaterial
      def initialize(repository)
        @repository = repository
      end

      def execute(id, user_id)
        farm_material = @repository.find_by_id(id, user_id)
        
        if farm_material
          { success: true, farm_material: farm_material }
        else
          { success: false, error: "Không tìm thấy vật tư" }
        end
      end
    end
  end
end
