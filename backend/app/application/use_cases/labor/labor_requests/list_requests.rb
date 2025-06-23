module UseCases::Labor
  module LaborRequests
    class ListRequests
      def initialize(request_repository)
        @request_repository = request_repository
      end

      def execute(household_id, filters = {})
        @request_repository.find_for_household(household_id, filters)
      end
    end
  end
end
