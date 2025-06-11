module Labor
  module LaborRequests
    class UpdateRequest
      def initialize(request_repository, household_repository)
        @request_repository = request_repository
        @household_repository = household_repository
      end
      
      def execute(id, params, current_user_id)
        # Find request
        request_result = @request_repository.find(id)
        return request_result unless request_result[:success]
        
        request = request_result[:request]
        
        # Check authorization
        household = @household_repository.find(request.requesting_household_id)
        unless household[:success] && household[:household].owner_id == current_user_id
          return { success: false, errors: ["Bạn không có quyền sửa đổi yêu cầu này"] }
        end
        
        # Update request
        @request_repository.update(id, params)
      end
    end
  end
end
