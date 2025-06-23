module UseCases::Farming
  module Harvests
    class ListHarvests
      def initialize(repository)
        @repository = repository
      end

      def execute(user_id, filters = {})
        result = @repository.find_all(user_id, filters)

        {
          success: true,
          harvests: result[:entities],
          records: result[:records]
        }
      end
    end
  end
end
