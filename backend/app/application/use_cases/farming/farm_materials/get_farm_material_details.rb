module UseCases::Farming
  module FarmMaterials
    class GetFarmMaterialDetails
      def initialize(repository)
        @repository = repository
      end

      def execute(id, user_id)
        # Gọi phương thức mới trong repository để lấy thông tin chi tiết
        result = @repository.get_material_details(id, user_id)
        
        if result[:success]
          result
        else
          { success: false, error: result[:error] || "Không tìm thấy thông tin chi tiết vật tư" }
        end
      end
    end
  end
end