module Farming
  module PineappleCrops
    class GetStatistics
      def initialize(pineapple_crop_repository)
        @pineapple_crop_repository = pineapple_crop_repository
      end
      
      def execute(user_id:)
        statistics = @pineapple_crop_repository.get_statistics(user_id)
        { success: true, statistics: statistics }
      end
    end
  end
end
