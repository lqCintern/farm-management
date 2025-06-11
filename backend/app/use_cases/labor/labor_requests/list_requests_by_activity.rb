module Labor
  module LaborRequests
    class ListRequestsByActivity
      def initialize(request_repository)
        @request_repository = request_repository
      end
      
      def execute(household_id, farm_activity_id)
        @request_repository.find_by_farm_activity(household_id, farm_activity_id)
      end
    end
  end
end
