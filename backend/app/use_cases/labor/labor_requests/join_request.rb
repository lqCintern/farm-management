module Labor
  module LaborRequests
    class JoinRequest
      def initialize(request_repository, household_repository)
        @request_repository = request_repository
        @household_repository = household_repository
      end
      
      def execute(request_id, household_id, current_user_id)
        # Find request
        request_result = @request_repository.find(request_id)
        return request_result unless request_result[:success]
        
        request = request_result[:request]
        
        # Verify household ownership
        household = @household_repository.find(household_id)
        unless household[:success] && household[:household].owner_id == current_user_id
          return { success: false, errors: ["Bạn không có quyền tham gia thay mặt hộ sản xuất này"] }
        end
        
        # Check if this household can join the request
        can_join, error = @request_repository.can_household_join_request(request_id, household_id)
        unless can_join
          return { success: false, errors: [error] }
        end
        
        # Determine parent request
        parent_id = request.parent_request_id || request.id
        parent_result = @request_repository.find(parent_id)
        return parent_result unless parent_result[:success]
        
        parent = parent_result[:request]
        
        # Create child request
        child_params = {
          title: parent.title,
          description: parent.description,
          request_type: parent.request_type,
          requesting_household_id: parent.requesting_household_id,
          providing_household_id: household_id,
          start_date: parent.start_date,
          end_date: parent.end_date,
          start_time: parent.start_time,
          end_time: parent.end_time,
          workers_needed: parent.workers_needed,
          parent_request_id: parent.id,
          request_group_id: parent.request_group_id,
          farm_activity_id: parent.farm_activity_id,
          rate: parent.rate,
          status: 'pending'
        }
        
        @request_repository.create(child_params)
      end
    end
  end
end