module Labor
  module LaborAssignments
    class CompleteMultipleAssignments
      def initialize(repository)
        @repository = repository
        @update_status = UpdateAssignmentStatus.new(repository)
      end
      
      def execute(assignment_ids, params, current_user)
        results = { success: [], failed: [] }
        
        assignment_ids.each do |id|
          assignment_entity = @repository.find(id)
          next unless assignment_entity
          
          result = @update_status.execute(assignment_entity, :completed, params, current_user)
          
          if result[:success]
            results[:success] << id
          else
            results[:failed] << { id: id, errors: result[:errors] }
          end
        end
        
        results[:success_count] = results[:success].length
        results[:failed_count] = results[:failed].length
        results[:total] = assignment_ids.length
        
        results
      end
    end
  end
end