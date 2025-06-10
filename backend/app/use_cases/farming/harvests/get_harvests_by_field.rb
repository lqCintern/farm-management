module Farming
  module Harvests
    class GetHarvestsByField
      def initialize(repository)
        @repository = repository
      end

      def execute(field_id, user_id)
        result = @repository.find_by_field(field_id, user_id)
        
        {
          success: true,
          harvests: result[:entities],
          records: result[:records]
        }
      end
    end
  end
end
