module Labor
  module LaborAssignments
    class RateAssignment
      def initialize(repository)
        @repository = repository
      end
      
      def rate_worker(assignment_id, rating, current_user)
        assignment_entity = @repository.find(assignment_id)
        result = { success: false, assignment: nil, errors: [] }
        
        return result.merge(errors: ["Không tìm thấy công việc"]) unless assignment_entity
        
        # Kiểm tra quyền hạn
        labor_request = ::Labor::LaborRequest.find_by(id: assignment_entity.labor_request_id)
        requesting_household = ::Labor::FarmHousehold.find_by(id: labor_request&.requesting_household_id)
        
        unless requesting_household && requesting_household.owner_id == current_user.id
          return result.merge(errors: ["Bạn không có quyền đánh giá worker này"])
        end
        
        # Thực hiện đánh giá
        updated_assignment, errors = @repository.rate_worker(assignment_id, rating)
        
        if updated_assignment
          result[:success] = true
          result[:assignment] = updated_assignment
        else
          result[:errors] = errors
        end
        
        result
      end
      
      def rate_farmer(assignment_id, rating, current_user)
        assignment_entity = @repository.find(assignment_id)
        result = { success: false, assignment: nil, errors: [] }
        
        return result.merge(errors: ["Không tìm thấy công việc"]) unless assignment_entity
        
        # Kiểm tra quyền hạn
        unless assignment_entity.worker_id == current_user.id
          return result.merge(errors: ["Bạn không có quyền đánh giá farmer này"])
        end
        
        # Thực hiện đánh giá
        updated_assignment, errors = @repository.rate_farmer(assignment_id, rating)
        
        if updated_assignment
          result[:success] = true
          result[:assignment] = updated_assignment
        else
          result[:errors] = errors
        end
        
        result
      end
    end
  end
end