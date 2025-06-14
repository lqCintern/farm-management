module Farming
  module Fields
    class ListFields
      def initialize(repository)
        @repository = repository
      end

      def execute(user_id, filters = {})
        result = @repository.find_all(user_id, filters)
        
        {
          success: true,
          fields: result[:entities],
          records: result[:records]
        }
      end
    end
  end
end
