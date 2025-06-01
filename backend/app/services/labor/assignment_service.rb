# app/services/labor/assignment_service.rb
module Labor
  class AssignmentService
    def self.create_assignment(labor_request, params, current_household)
      # Xử lý start_time và end_time để kết hợp với work_date
      work_date = Date.parse(params[:work_date].to_s)
      
      start_time = if params[:start_time].present?
        # Nếu start_time từ frontend là chuỗi giờ:phút
        if params[:start_time].is_a?(String) && params[:start_time].match(/^\d{1,2}:\d{2}(:\d{2})?$/)
          hours, minutes, seconds = params[:start_time].split(':').map(&:to_i)
          seconds ||= 0
          work_date.to_time.change(hour: hours, min: minutes, sec: seconds)
        else
          # Nếu là datetime, chỉ lấy giờ phút và kết hợp với work_date
          time = Time.parse(params[:start_time].to_s)
          work_date.to_time.change(hour: time.hour, min: time.min, sec: time.sec)
        end
      else
        # Sử dụng start_time từ labor_request nếu không có
        req_time = labor_request.start_time
        work_date.to_time.change(hour: req_time.hour, min: req_time.min, sec: req_time.sec)
      end
      
      end_time = if params[:end_time].present?
        # Tương tự xử lý như start_time
        if params[:end_time].is_a?(String) && params[:end_time].match(/^\d{1,2}:\d{2}(:\d{2})?$/)
          hours, minutes, seconds = params[:end_time].split(':').map(&:to_i)
          seconds ||= 0
          work_date.to_time.change(hour: hours, min: minutes, sec: seconds)
        else
          time = Time.parse(params[:end_time].to_s)
          work_date.to_time.change(hour: time.hour, min: time.min, sec: time.sec)
        end
      else
        # Sử dụng end_time từ labor_request nếu không có
        req_time = labor_request.end_time
        work_date.to_time.change(hour: req_time.hour, min: req_time.min, sec: req_time.sec)
      end
      
      assignment = Labor::LaborAssignment.new(
        labor_request: labor_request,
        worker_id: params[:worker_id],
        home_household_id: params[:home_household_id],
        work_date: work_date,
        start_time: start_time,
        end_time: end_time,
        status: :assigned,
        notes: params[:notes]
      )
      
      result = { success: false, assignment: assignment, errors: [] }
    
      # Kiểm tra xem household hiện tại có phải là bên tạo hoặc bên nhận yêu cầu không
      unless labor_request.requesting_household_id == current_household.id || 
             labor_request.providing_household_id == current_household.id
        result[:errors] << "Bạn không có quyền phân công cho yêu cầu này"
        return result
      end
      
      # Nếu là household nhận request, chỉ cho phép phân công workers thuộc household của mình
      if labor_request.providing_household_id == current_household.id
        worker_household = Labor::HouseholdWorker.find_by(worker_id: params[:worker_id])&.household_id
        unless worker_household == current_household.id
          result[:errors] << "Bạn chỉ có thể phân công người lao động thuộc hộ của mình"
          return result
        end
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
    
    def self.batch_assign_workers(labor_request, worker_ids, date_range, current_household)
      result = { success: false, total: 0, successful: 0, failed: 0, errors: [] }
      
      # Cập nhật kiểm tra quyền hạn tương tự như phía trên
      unless labor_request.requesting_household_id == current_household.id || 
             labor_request.providing_household_id == current_household.id
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
            # Kết hợp work_date với giờ từ labor_request
            req_start_time = labor_request.start_time
            req_end_time = labor_request.end_time
            
            start_time = work_date.to_time.change(hour: req_start_time.hour, min: req_start_time.min)
            end_time = work_date.to_time.change(hour: req_end_time.hour, min: req_end_time.min)
            
            assignment = Labor::LaborAssignment.new(
              labor_request: labor_request,
              worker_id: worker_id,
              home_household_id: worker_household,
              work_date: work_date,
              start_time: start_time,
              end_time: end_time,
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
      when :worker_reported
        # Worker chỉ có thể báo cáo công việc của chính mình
        unless assignment.worker_id == current_user.id
          result[:errors] << "Bạn không có quyền báo cáo công việc này"
          return result
        end
        
        assignment.status = :worker_reported
        assignment.notes = params[:notes] if params[:notes].present?
        
      when :completed
        # Chủ nông trại xác nhận hoàn thành
        unless assignment.labor_request.requesting_household.owner_id == current_user.id
          result[:errors] << "Bạn không có quyền xác nhận hoàn thành công việc này"
          return result
        end
        
        assignment.status = :completed
        
        # Tự động tính hours_worked nếu không được cung cấp
        if params[:hours_worked].present?
          assignment.hours_worked = params[:hours_worked].to_f
        elsif assignment.start_time.present? && assignment.end_time.present?
          # Tính số giờ từ start_time và end_time
          hours_diff = ((assignment.end_time - assignment.start_time) / 3600).round(1)
          assignment.hours_worked = hours_diff
        end
        
        # Áp dụng quy tắc tính công: >6 tiếng = 1 công, <6 tiếng = 0.5 công
        if assignment.hours_worked.present?
          assignment.work_units = assignment.hours_worked >= 6 ? 1.0 : 0.5
        end
        
        assignment.notes = params[:notes] if params[:notes].present?
        
      when :missed
        # Chỉ chủ nông trại mới có thể đánh dấu vắng mặt
        unless assignment.labor_request.requesting_household.owner_id == current_user.id
          result[:errors] << "Bạn không có quyền đánh dấu vắng mặt"
          return result
        end
        
        assignment.status = :missed
        assignment.notes = params[:notes] if params[:notes].present?
        
      when :rejected
        # Worker có thể từ chối công việc của mình
        unless assignment.worker_id == current_user.id
          result[:errors] << "Bạn không có quyền từ chối công việc này"
          return result
        end
        
        assignment.status = :rejected
        assignment.notes = params[:notes] if params[:notes].present?
      end
      
      if assignment.save
        result[:success] = true
        
        # Xử lý đổi công chỉ khi hoàn thành hoàn toàn (không phải worker_reported)
        if status.to_sym == :completed && [:exchange, :mixed].include?(assignment.labor_request.request_type.to_sym)
          exchange_result = Labor::ExchangeService.process_completed_assignment(assignment)
          unless exchange_result[:success]
            result[:exchange_errors] = exchange_result[:errors]
          end
        end
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
    
    def self.find_household_assignments(household_id, filters = {})
      # Tìm cả assignments mà household là bên yêu cầu
      query = Labor::LaborAssignment.joins(:labor_request)
                                   .where('labor_requests.requesting_household_id = ?', household_id)
      
      # Filter by request_id
      if filters[:request_id].present?
        query = query.where(labor_request_id: filters[:request_id])
      end
      
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
      
      query.includes(:worker, labor_request: [:requesting_household, :providing_household])
    end
  end
end
