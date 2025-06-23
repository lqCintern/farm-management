module UseCases::Farming
  module FarmMaterials
    class UpdateFarmMaterial
      def initialize(repository)
        @repository = repository
      end

      def execute(id, attributes, user_id)
        # Đảm bảo quantity là một số
        attributes[:quantity] = attributes[:quantity].to_f if attributes[:quantity].present?

        # Cập nhật last_updated
        attributes[:last_updated] = Time.current

        # Thực hiện cập nhật
        result = @repository.update(id, attributes, user_id)

        if result.is_a?(Entities::Farming::FarmMaterial)
          { success: true, farm_material: result }
        else
          result # Return error hash
        end
      end
    end
  end
end
