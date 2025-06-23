module UseCases::Farming
  module Harvests
    class GetHarvestsByCrop
      def initialize(repository)
        @repository = repository
      end

      def execute(crop_id, user_id)
        result = @repository.find_by_crop(crop_id, user_id)

        {
          success: true,
          harvests: result[:entities],
          records: result[:records]
        }
      end
    end
  end
end
