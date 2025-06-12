module Farming
  module Harvests
    class GetHarvestStats
      def initialize(repository)
        @repository = repository
      end

      def execute(user_id)
        @repository.get_statistics(user_id)
      end
    end
  end
end
