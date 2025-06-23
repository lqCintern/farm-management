module UseCases::Labor
  module LaborRequests
    class DeleteRequest
      def initialize(request_repository, household_repository, assignment_repository)
        @request_repository = request_repository
        @household_repository = household_repository
        @assignment_repository = assignment_repository
      end

      def execute(id, current_user_id)
        # Find request
        request_result = @request_repository.find(id)
        return request_result unless request_result[:success]

        request = request_result[:request]

        # Check authorization
        household = @household_repository.find(request.requesting_household_id)
        unless household[:success] && household[:household].owner_id == current_user_id
          return { success: false, errors: [ "Bạn không có quyền xóa yêu cầu này" ] }
        end

        # Check if request has associated assignments
        if @assignment_repository.has_active_assignments(id)
          return { success: false, errors: [ "Không thể xóa yêu cầu đã có phân công lao động" ] }
        end

        # Delete request
        @request_repository.delete(id)
      end
    end
  end
end
