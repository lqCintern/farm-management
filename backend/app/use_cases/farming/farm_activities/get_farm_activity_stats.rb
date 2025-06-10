module Farming
  module FarmActivities
    class GetFarmActivityStats
      def initialize(repository, stats_service)
        @repository = repository
        @stats_service = stats_service
      end

      def execute(user_id, period, year, month, quarter)
        result = @repository.find_all(user_id, {})

        stats = @stats_service.generate_stats(
          result[:entities],
          period,
          year,
          month,
          quarter
        )

        { success: true, statistics: stats }
      end
    end
  end
end
