module Farming
  module FarmMaterials
    class DeleteFarmMaterial
      def initialize(repository)
        @repository = repository
      end

      def execute(id, user_id)
        @repository.delete(id, user_id)
      end
    end
  end
end
