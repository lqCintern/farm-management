# app/services/labor/assignment_service.rb
module Labor
  class AssignmentService
    def self.create_assignment(labor_request, params, requesting_household)
      assignment = Labor::LaborAssignment.new(
        labor_request: labor_request,
        worker_id: params[:worker_id],
        home_household_id: params[:home_household_id],
        work_date: params[:work_date],
        start_time: params[:start_time] || labor_request.start_time,
        end_time: params[:end_time] || labor_request.end_time,
        status: :assigned,
        notes: params[:notes]
      )
      
      result = { success: false, assignment: assignment, errors: [] }
      
      # Validate permissions
      unless labor_request.requesting_household_id == requesting_household.id
        result[:errors] << "Bạn không có quyền phân công cho yêu cầu này"
        return result
      end
      
      # Validate dates
      unless labor_request.start_date <= assignment.work_date && labor_request.end_date >= assignment.work_date
        result[:errors] << "Ngày làm việc phải nằm trong khoảng thời gian của yêu cầu"
        return result
      end
      
      # Check availability
      existing = Labor::LaborAssignment.where(
        worker_id: assignment.worker_id, 
        work_date: assignment.work_date
      ).where.not(id: assignment.id)
      
      if existing.exists?
        result[:errors] << "Worker đã có lịch làm việc khác vào ngày này"
        return result
      end
      
      if assignment.save
        # Update worker profile if today
        if assignment.work_date == Date.today
          worker_profile = Labor::WorkerProfile.find_by(user_id: assignment.worker_id)
          worker_profile&.update(availability: :busy)
        end
        
        result[:success] = true
      else
        result[:errors] = assignment.errors.full_messages
      end
      
      result
    end
    
    def self.batch_assign_workers(labor_request, worker_ids, date_range, requesting_household)
      result = { 
        success: false, 
        total: 0,
        successful: 0,
        failed: 0,
        errors: []
      }
      
      # Validate permissions
      unless labor_request.requesting_household_id == requesting_household.id
        result[:errors] << "Bạn không có quyền phân công cho yêu cầu này"
        return result
      end
      
      # Validate dates
      unless date_range.all? { |date| labor_request.start_date <= date && labor_request.end_date >= date }
        result[:errors] << "Có ngày làm việc nằm ngoài khoảng thời gian của yêu cầu"
        return result
      end
      
      result[:total] = worker_ids.length * date_range.length
      
      Labor::LaborAssignment.transaction do
        worker_ids.each do |worker_id|
          worker_household = Labor::HouseholdWorker.find_by(worker_id: worker_id)&.household_id
          
          unless worker_household
            result[:errors] << "Worker #{worker_id} không thuộc về hộ sản xuất nào"
            result[:failed] += date_range.length
            next
          end
          
          date_range.each do |work_date|
            assignment = Labor::LaborAssignment.new(
              labor_request: labor_request,
              worker_id: worker_id,
              home_household_id: worker_household,
              work_date: work_date,
              start_time: labor_request.start_time,
              end_time: labor_request.end_time,
              status: :assigned
            )
            
            # Check availability
            existing = Labor::LaborAssignment.where(
              worker_id: worker_id, 
              work_date: work_date
            )
            
            if existing.exists?
              result[:errors] << "Worker #{worker_id} đã có lịch làm việc vào ngày #{work_date}"
              result[:failed] += 1
              next
            end
            
            if assignment.save
              result[:successful] += 1
              
              # Update worker profile if today
              if work_date == Date.today
                worker_profile = Labor::WorkerProfile.find_by(user_id: worker_id)
                worker_profile&.update(availability: :busy)
              end
            else
              result[:errors] << "Không thể phân công worker #{worker_id} vào ngày #{work_date}: #{assignment.errors.full_messages.join(', ')}"
              result[:failed] += 1
            end
          end
        end
        
        # Rollback nếu tất cả đều thất bại
        if result[:successful] == 0
          raise ActiveRecord::Rollback
        end
      end
      
      result[:success] = result[:successful] > 0
      result
    end
    
    def self.update_assignment_status(assignment, status, params, current_user)
      result = { success: false, assignment: assignment, errors: [] }
      
      case status.to_sym
      when :completed
        # Validate permissions (only requesting farmer can complete)
        unless assignment.labor_request.requesting_household.owner_id == current_user.id
          result[:errors] << "Bạn không có quyền hoàn thành công việc này"
          return result
        end
        
        assignment.status = :completed
        assignment.hours_worked = params[:hours_worked] if params[:hours_worked].present?
        assignment.notes = params[:notes] if params[:notes].present?
        
      when :rejected
        # Validate permissions (both worker and requesting farmer can reject)
        unless assignment.worker_id == current_user.id || 
               assignment.labor_request.requesting_household.owner_id == current_user.id
          result[:errors] << "Bạn không có quyền từ chối công việc này"
          return result
        end
        
        assignment.status = :rejected
        assignment.notes = params[:notes] if params[:notes].present?
        
      when :missed
        # Validate permissions (only requesting farmer can mark as missed)
        unless assignment.labor_request.requesting_household.owner_id == current_user.id
          result[:errors] << "Bạn không có quyền đánh dấu công việc bị bỏ lỡ"
          return result
        end
        
        assignment.status = :missed
        assignment.notes = params[:notes] if params[:notes].present?
        
      else
        result[:errors] << "Trạng thái không hợp lệ"
        return result
      end
      
      if assignment.save
        # Process exchange transaction if completed
        if status.to_sym == :completed && assignment.hours_worked.present?
          exchange_result = Labor::ExchangeService.process_completed_assignment(assignment)
          
          if exchange_result[:success]
            result[:exchange_transaction] = exchange_result[:transaction]
          else
            result[:exchange_errors] = exchange_result[:errors]
          end
        end
        
        # Free up worker availability if rejected or missed and was today
        if [:rejected, :missed].include?(status.to_sym) && assignment.work_date == Date.today
          worker_profile = Labor::WorkerProfile.find_by(user_id: assignment.worker_id)
          worker_profile&.update(availability: :available)
        end
        
        result[:success] = true
      else
        result[:errors] = assignment.errors.full_messages
      end
      
      result
    end
    
    def self.find_worker_assignments(worker_id, filters = {})
      query = Labor::LaborAssignment.where(worker_id: worker_id)
      
      # Filter by status
      if filters[:status].present?
        query = query.where(status: filters[:status])
      end
      
      # Filter by date range
      if filters[:start_date].present? && filters[:end_date].present?
        query = query.where(work_date: filters[:start_date]..filters[:end_date])
      elsif filters[:start_date].present?
        query = query.where("work_date >= ?", filters[:start_date])
      elsif filters[:end_date].present?
        query = query.where("work_date <= ?", filters[:end_date])
      end
      
      # Filter by time of day
      if filters[:upcoming].present? && filters[:upcoming] == true
        query = query.where("work_date >= ?", Date.today)
                    .order(work_date: :asc, start_time: :asc)
      else
        query = query.order(work_date: :desc, start_time: :desc)
      end
      
      query.includes(labor_request: [:requesting_household, :providing_household])
    end
  end
end