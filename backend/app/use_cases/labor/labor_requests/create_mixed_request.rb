module Labor
  module LaborRequests
    class CreateMixedRequest
      def initialize(request_repository, household_repository)
        @request_repository = request_repository
        @household_repository = household_repository
      end
      
      def execute(household_id, params, provider_ids = [], options = {})
        # Verify household exists
        household = @household_repository.find(household_id)
        return { success: false, errors: ["Không tìm thấy hộ sản xuất"] } unless household[:success]
        
        # Create group requests
        @request_repository.create_group_requests(
          household_id,
          provider_ids,
          params,
          options
        )
      end
    end
  end
end
