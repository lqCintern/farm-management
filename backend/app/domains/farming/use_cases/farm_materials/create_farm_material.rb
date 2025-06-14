module Farming
  module FarmMaterials
    class CreateFarmMaterial
      def initialize(repository)
        @repository = repository
      end

      def execute(attributes, user_id)
        # Đảm bảo quantity là một số
        attributes[:quantity] = attributes[:quantity].to_f if attributes[:quantity].present?
        
        # Thiết lập last_updated nếu không có
        attributes[:last_updated] ||= Time.current
        
        result = @repository.create(attributes, user_id)
        
        if result.is_a?(Entities::Farming::FarmMaterial)
          { success: true, farm_material: result }
        else
          result # Return error hash
        end
      end
    end
  end
end
