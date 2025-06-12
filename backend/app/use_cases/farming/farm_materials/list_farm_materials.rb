module Farming
  module FarmMaterials
    class ListFarmMaterials
      def initialize(repository)
        @repository = repository
      end

      def execute(user_id, filters = {})
        result = @repository.find_all(user_id, filters)
        
        {
          success: true,
          records: result[:records],
          farm_materials: result[:entities]
        }
      end
    end
  end
end
