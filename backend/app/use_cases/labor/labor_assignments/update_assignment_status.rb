module Labor
  module LaborAssignments
    class UpdateAssignmentStatus
      def initialize(repository)
        @repository = repository
      end
      
      def execute(assignment_entity, status, params, current_user)
        result = { success: false, assignment: assignment_entity, errors: [] }
        
        labor_request = ::Labor::LaborRequest.find_by(id: assignment_entity.labor_request_id)
        return result.merge(errors: ["Không tìm thấy yêu cầu lao động"]) unless labor_request
        
        # Validate permissions based on status
        case status.to_sym
        when :worker_reported
          # Worker chỉ có thể báo cáo công việc của chính mình
          unless assignment_entity.worker_id == current_user.id
            result[:errors] << "Bạn không có quyền báo cáo công việc này"
            return result
          end
          
          assignment_entity.status = 'worker_reported'
          assignment_entity.notes = params[:notes] if params[:notes].present?
          
        when :completed
          # Chủ nông trại xác nhận hoàn thành
          requesting_household = ::Labor::FarmHousehold.find_by(id: labor_request.requesting_household_id)
          unless requesting_household && requesting_household.owner_id == current_user.id
            result[:errors] << "Bạn không có quyền xác nhận hoàn thành công việc này"
            return result
          end
          
          assignment_entity.status = 'completed'
          
          # Tự động tính hours_worked nếu không được cung cấp
          if params[:hours_worked].present?
            assignment_entity.hours_worked = params[:hours_worked].to_f
          elsif assignment_entity.start_time.present? && assignment_entity.end_time.present?
            # Tính số giờ từ start_time và end_time
            hours_diff = ((assignment_entity.end_time - assignment_entity.start_time) / 3600).round(1)
            assignment_entity.hours_worked = hours_diff
          end
          
          # Áp dụng quy tắc tính công: >6 tiếng = 1 công, <6 tiếng = 0.5 công
          if assignment_entity.hours_worked.present?
            assignment_entity.work_units = assignment_entity.hours_worked >= 6 ? 1.0 : 0.5
          end
          
          assignment_entity.notes = params[:notes] if params[:notes].present?
          
        when :missed
          # Chỉ chủ nông trại mới có thể đánh dấu vắng mặt
          requesting_household = ::Labor::FarmHousehold.find_by(id: labor_request.requesting_household_id)
          unless requesting_household && requesting_household.owner_id == current_user.id
            result[:errors] << "Bạn không có quyền đánh dấu vắng mặt"
            return result
          end
          
          assignment_entity.status = 'missed'
          assignment_entity.notes = params[:notes] if params[:notes].present?
          
        when :rejected
          # Worker có thể từ chối công việc của mình
          unless assignment_entity.worker_id == current_user.id
            result[:errors] << "Bạn không có quyền từ chối công việc này"
            return result
          end
          
          assignment_entity.status = 'rejected'
          assignment_entity.notes = params[:notes] if params[:notes].present?
        end
        
        updated_assignment, errors = @repository.update(assignment_entity)
        
        if updated_assignment
          result[:success] = true
          result[:assignment] = updated_assignment
          
          # Xử lý đổi công chỉ khi hoàn thành hoàn toàn (không phải worker_reported)
          if status.to_sym == :completed && ['exchange', 'mixed'].include?(labor_request.request_type)
            # Process labor exchange
            labor_exchange = ::Labor::LaborExchange.find_or_create_between(
              updated_assignment.home_household_id,
              labor_request.requesting_household_id
            )
            
            work_units = updated_assignment.work_units || 
                       (updated_assignment.hours_worked && updated_assignment.hours_worked >= 6 ? 1.0 : 0.5)
            
            exchange_transaction = labor_exchange.add_transaction(
              updated_assignment.id,
              work_units
            )
            
            unless exchange_transaction
              result[:exchange_errors] = ["Không thể tạo giao dịch đổi công"]
            end
            
            # Đánh dấu đã xử lý để tránh trùng lặp
            updated_assignment.exchange_processed = true
            @repository.update(updated_assignment)
          end
        else
          result[:errors] = errors
        end
        
        result
      end
    end
  end
end