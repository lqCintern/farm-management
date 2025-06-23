module UseCases::Farming
  module Harvests
    class UpdateHarvest
      def initialize(repository)
        @repository = repository
      end

      def execute(id, attributes, user_id)
        result = @repository.update(id, attributes, user_id)

        if result.is_a?(Entities::Farming::Harvest)
          { success: true, harvest: result }
        else
          result # Return error hash
        end
      end
    end
  end
end
