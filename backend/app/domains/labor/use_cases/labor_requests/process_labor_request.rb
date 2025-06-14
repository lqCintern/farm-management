module Labor
  module LaborRequests
    class ProcessLaborRequest
      def initialize(request_repository, household_repository, assignment_repository, notification_service)
        @request_repository = request_repository
        @household_repository = household_repository
        @assignment_repository = assignment_repository
        @notification_service = notification_service
      end
      
      def execute(request_id, action, current_user_id)
        # Find request
        request_result = @request_repository.find(request_id)
        return request_result unless request_result[:success]
        
        request = request_result[:request]
        
        result = { success: false, request: request, errors: [], group_status: nil }
        
        case action.to_sym
        when :accept
          result = process_accept(request, current_user_id)
        when :decline
          result = process_decline(request, current_user_id)
        when :cancel
          result = process_cancel(request, current_user_id)
        when :complete
          result = process_complete(request, current_user_id)
        else
          result[:errors] << "Hành động không được hỗ trợ"
        end
        
        # If successful, update group status info
        if result[:success] && request.request_group_id.present?
          group_status = @request_repository.get_group_status(request_id)
          result[:group_status] = group_status[:status] if group_status[:success]
        end
        
        result
      end
      
      private
      
      def process_accept(request, current_user_id)
        # Verify permission - only provider household owner can accept
        household = @household_repository.find(request.providing_household_id)
        unless household[:success] && household[:household].owner_id == current_user_id
          return { success: false, request: request, errors: ["Bạn không có quyền chấp nhận yêu cầu này"] }
        end
        
        # Update request status
        update_result = @request_repository.update(request.id, { status: 'accepted' })
        
        if update_result[:success]
          # Update parent request status if needed
          @request_repository.update_parent_status(request.id)
        end
        
        update_result
      end
      
      def process_decline(request, current_user_id)
        # Verify permission - only provider household owner can decline
        household = @household_repository.find(request.providing_household_id)
        unless household[:success] && household[:household].owner_id == current_user_id
          return { success: false, request: request, errors: ["Bạn không có quyền từ chối yêu cầu này"] }
        end
        
        # Update request status
        update_result = @request_repository.update(request.id, { status: 'declined' })
        
        if update_result[:success]
          # Update parent request status if needed
          @request_repository.update_parent_status(request.id)
        end
        
        update_result
      end
      
      def process_cancel(request, current_user_id)
        # Verify permission - only requesting household owner can cancel
        household = @household_repository.find(request.requesting_household_id)
        unless household[:success] && household[:household].owner_id == current_user_id
          return { success: false, request: request, errors: ["Bạn không có quyền hủy yêu cầu này"] }
        end
        
        # Cancel all associated assignments
        @assignment_repository.cancel_request_assignments(request.id, current_user_id)
        
        # Update request status
        update_result = @request_repository.update(request.id, { status: 'cancelled' })
        
        # If this is a parent request, cancel all child requests
        if update_result[:success] && request.original_request?
          related_requests = @request_repository.find_related_requests(request.id)
          related_requests.each do |related_request|
            @request_repository.update(related_request.id, { status: 'cancelled' })
          end
        end
        
        # Update parent request status if needed
        if update_result[:success] && request.parent_request_id.present?
          @request_repository.update_parent_status(request.id)
        end
        
        update_result
      end
      
      def process_complete(request, current_user_id)
        # Verify permission - only requesting household owner can mark as complete
        household = @household_repository.find(request.requesting_household_id)
        unless household[:success] && household[:household].owner_id == current_user_id
          return { success: false, request: request, errors: ["Bạn không có quyền đánh dấu hoàn thành yêu cầu này"] }
        end
        
        # Check if request has pending assignments
        if @request_repository.has_pending_assignments(request.id)
          return { success: false, request: request, errors: ["Không thể hoàn thành yêu cầu khi còn công việc chưa hoàn thành"] }
        end
        
        # Update request status
        update_result = @request_repository.update(request.id, { status: 'completed' })
        
        # Update parent request status if needed
        if update_result[:success] && request.parent_request_id.present?
          @request_repository.update_parent_status(request.id)
        end
        
        update_result
      end
    end
  end
end