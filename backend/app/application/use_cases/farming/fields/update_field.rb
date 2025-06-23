module UseCases::Farming
  module Fields
    class UpdateField
      def initialize(repository)
        @repository = repository
      end

      def execute(id, attributes, user_id)
        result = @repository.update(id, attributes, user_id)

        if result.is_a?(Entities::Farming::Field)
          { success: true, field: result }
        else
          result # Return error hash
        end
      end
    end
  end
end
