module Farming
  module Fields
    class CreateField
      def initialize(repository)
        @repository = repository
      end

      def execute(attributes, user_id)
        result = @repository.create(attributes, user_id)
        
        if result.is_a?(Entities::Farming::Field)
          { success: true, field: result }
        else
          result # Return error hash
        end
      end
    end
  end
end
