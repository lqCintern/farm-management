module Farming
  module Harvests
    class CreateHarvest
      def initialize(repository)
        @repository = repository
      end

      def execute(attributes, user_id)
        result = @repository.create(attributes, user_id)
        
        if result.is_a?(Entities::Farming::Harvest)
          { success: true, harvest: result }
        else
          result # Return error hash
        end
      end
    end
  end
end
