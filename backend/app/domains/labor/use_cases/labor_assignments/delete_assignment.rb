module Labor
  module LaborAssignments
    class DeleteAssignment
      def initialize(repository)
        @repository = repository
      end
      
      def execute(id, current_user)
        assignment = @repository.find(id)
        return { success: false, errors: ["Không tìm thấy phân công"] } unless assignment
        
        # Kiểm tra quyền xóa
        labor_request = ::Labor::LaborRequest.find_by(id: assignment.labor_request_id)
        unless labor_request && labor_request.requesting_household_id == current_user.household_id
          return { success: false, errors: ["Bạn không có quyền xóa phân công này"] }
        end
        
        success, errors = @repository.delete(id)
        
        if success
          { success: true, message: "Đã xóa phân công lao động thành công" }
        else
          { success: false, errors: errors }
        end
      end
    end
  end
end