module Farming
  module PineappleActivityTemplates
    class ListPineappleActivityTemplates
      def initialize(repository)
        @repository = repository
      end

      def execute(user_id, filters = {})
        result = @repository.find_all(user_id, filters)
        
        {
          success: true,
          templates: result[:entities]
        }
      end
    end
  end
end
