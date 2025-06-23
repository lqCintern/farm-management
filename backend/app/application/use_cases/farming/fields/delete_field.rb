module UseCases::Farming
  module Fields
    class DeleteField
      def initialize(repository)
        @repository = repository
      end

      def execute(id, user_id)
        @repository.delete(id, user_id)
      end
    end
  end
end
