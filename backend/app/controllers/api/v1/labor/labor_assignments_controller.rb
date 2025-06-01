# app/controllers/api/v1/labor/labor_assignments_controller.rb
module Api
  module V1
    module Labor
      class LaborAssignmentsController < BaseController
        before_action :require_household
        before_action :set_labor_request, only: [:index, :create, :batch_assign]
        before_action :set_labor_assignment, only: [:show, :update, :destroy, :report_completion, :complete, :reject, :missed, :rate_worker, :rate_farmer]
        
        def index
          @assignments = @labor_request.assignments
                                     .includes(:worker, :home_household)
                                     .order(work_date: :asc, created_at: :asc)
          render_success_response(@assignments)
        end
        
        def show
          render_success_response(@labor_assignment)
        end
        
        def create
          # Chuyển đổi tham số để phù hợp với AssignmentService
          assignment_params = labor_assignment_params.to_h
          
          # Chuyển worker_ids thành worker_id
          if assignment_params[:worker_ids].present? && assignment_params[:worker_ids].is_a?(Array)
            assignment_params[:worker_id] = assignment_params[:worker_ids].first
          end
          
          # Đảm bảo có home_household_id
          assignment_params[:home_household_id] ||= current_household.id
          
          result = ::Labor::AssignmentService.create_assignment(
            @labor_request,
            assignment_params,
            current_household
          )
          
          if result[:success]
            render_success_response(result[:assignment], :created)
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        def batch_assign
          worker_ids = params[:worker_ids]
          date_range = parse_date_range(params[:start_date], params[:end_date])
          
          if worker_ids.blank? || date_range.blank?
            render_error_response("Thiếu worker_ids hoặc khoảng thời gian không hợp lệ", :bad_request)
            return
          end
          
          result = ::Labor::AssignmentService.batch_assign_workers(
            @labor_request,
            worker_ids,
            date_range,
            current_household
          )
          
          if result[:success]
            render_success_response({
              message: "Đã phân công thành công #{result[:successful]}/#{result[:total]} lượt",
              failed: result[:failed],
              errors: result[:errors]
            })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        def update
          result = ::Labor::AssignmentService.update_assignment(
            @labor_assignment,
            labor_assignment_params.to_h,
            current_household
          )
          
          if result[:success]
            render_success_response(result[:assignment])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        def destroy
          if @labor_assignment.labor_request.requesting_household_id != current_household.id
            render_error_response("Bạn không có quyền xóa phân công này", :forbidden)
            return
          end
          
          if @labor_assignment.destroy
            render_success_response({ message: "Đã xóa phân công lao động thành công" })
          else
            render_error_response(@labor_assignment.errors.full_messages, :unprocessable_entity)
          end
        end
        
        # Thêm action mới cho worker báo cáo hoàn thành
        def report_completion
          notes = params[:notes] || params.dig(:labor_assignment, :notes)
          
          result = ::Labor::AssignmentService.update_assignment_status(
            @labor_assignment,  # Đảm bảo @labor_assignment không phải nil
            :worker_reported,
            { notes: notes },
            current_user
          )
          
          if result[:success]
            render_success_response(result[:assignment])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        # Cập nhật action complete để chỉ farmer mới gọi được
        def complete
          hours_worked = params[:hours_worked] || params.dig(:labor_assignment, :hours_worked)
          notes = params[:notes] || params.dig(:labor_assignment, :notes)
          
          result = ::Labor::AssignmentService.update_assignment_status(
            @labor_assignment,
            :completed,
            { 
              notes: notes, 
              hours_worked: hours_worked 
            },
            current_user
          )
          
          if result[:success]
            render_success_response(result[:assignment])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        def reject
          result = ::Labor::AssignmentService.update_assignment_status(
            @labor_assignment,
            :rejected,
            params.permit(:notes),
            current_user
          )
          
          if result[:success]
            render_success_response(result[:assignment])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        def missed
          result = ::Labor::AssignmentService.update_assignment_status(
            @labor_assignment,
            :missed,
            params.permit(:notes),
            current_user
          )
          
          if result[:success]
            render_success_response(result[:assignment])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        def rate_worker
          if @labor_assignment.labor_request.requesting_household_id != current_household.id
            render_error_response("Bạn không có quyền đánh giá worker này", :forbidden)
            return
          end
          
          if @labor_assignment.rate_worker!(params[:rating])
            render_success_response(@labor_assignment)
          else
            render_error_response(@labor_assignment.errors.full_messages, :unprocessable_entity)
          end
        end
        
        def rate_farmer
          if @labor_assignment.worker_id != current_user.id
            render_error_response("Bạn không có quyền đánh giá farmer này", :forbidden)
            return
          end
          
          if @labor_assignment.rate_farmer!(params[:rating])
            render_success_response(@labor_assignment)
          else
            render_error_response(@labor_assignment.errors.full_messages, :unprocessable_entity)
          end
        end
        
        def my_assignments
          filters = params.permit(:status, :start_date, :end_date, :upcoming).to_h
          
          @assignments = ::Labor::AssignmentService.find_worker_assignments(
            current_user.id,
            filters
          )
          
          render_success_response(@assignments)
        end
        
        # Thêm endpoint kiểm tra xung đột lịch trình
        def check_conflicts
          worker_id = params[:worker_id].to_i
          date = params[:date]
          start_time = Time.parse(params[:start_time])
          end_time = Time.parse(params[:end_time])
          
          result = ::Labor::WorkerService.check_schedule_conflicts(
            worker_id,
            date,
            start_time,
            end_time
          )
          
          render_success_response({
            has_conflict: result[:has_conflict],
            conflicts: result[:conflicts].map(&:as_json)
          })
        end
        
        # Thêm endpoint lấy thống kê phân công
        def stats
          period = params[:period] || :month # week, month, quarter
          
          stats = ::Labor::AssignmentService.generate_assignment_stats(
            current_household.id,
            period.to_sym
          )
          
          render_success_response(stats)
        end
        
        # Thêm endpoint dự báo khả dụng của người lao động
        def worker_availability
          worker_id = params[:worker_id].to_i
          start_date = params[:start_date] || Date.today.to_s
          end_date = params[:end_date] || (Date.today + 14.days).to_s
          
          result = ::Labor::WorkerService.get_availability_forecast(
            worker_id,
            start_date,
            end_date
          )
          
          if result[:success]
            render_success_response(result[:availability])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end
        
        # Endpoint lấy danh sách assignments của household
        def household_assignments
          filters = params.permit(:status, :start_date, :end_date, :upcoming, :request_id).to_h
          
          @assignments = ::Labor::AssignmentService.find_household_assignments(
            current_household.id,
            filters
          )
          
          render_success_response(@assignments)
        end
        
        # Thêm endpoint để hoàn thành nhiều assignments cùng lúc
        def complete_multiple
          assignment_ids = params[:assignment_ids]
          notes = params[:notes]
          
          unless assignment_ids.is_a?(Array) && assignment_ids.any?
            render_error_response("Cần cung cấp danh sách assignment_ids", :bad_request)
            return
          end
          
          results = { success: [], failed: [] }
          
          assignment_ids.each do |id|
            assignment = ::Labor::LaborAssignment.find_by(id: id)
            next unless assignment
            
            result = ::Labor::AssignmentService.update_assignment_status(
              assignment,
              :completed,
              { notes: notes },
              current_user
            )
            
            if result[:success]
              results[:success] << id
            else
              results[:failed] << { id: id, errors: result[:errors] }
            end
          end
          
          render_success_response(results)
        end
        
        private
        
        def set_labor_request
          # Tìm labor_request_id từ URL hoặc từ body request 
          request_id = params[:labor_request_id] || 
                       params[:request_id] || 
                       params[:labor_assignment]&.dig(:labor_request_id) ||
                       params[:labor_assignment]&.dig(:request_id)
          
          if request_id.blank?
            render_error_response("Không tìm thấy labor_request_id", :bad_request)
            return
          end
          
          @labor_request = ::Labor::LaborRequest.find(request_id)
        rescue ActiveRecord::RecordNotFound
          render_error_response("Không tìm thấy yêu cầu lao động", :not_found)
        end
        
        def set_labor_assignment
          @labor_assignment = ::Labor::LaborAssignment.find_by(id: params[:id])
          unless @labor_assignment
            render_error_response("Không tìm thấy công việc với ID #{params[:id]}", :not_found)
          end
        end
        
        def labor_assignment_params
          # Cho phép nhiều tham số hơn để tương thích
          params.require(:labor_assignment).permit(
            :worker_id, :home_household_id, :work_date, :start_time, :end_time, :notes,
            :labor_request_id, :request_id, :hours_worked, worker_ids: []
          )
        end
        
        def parse_date_range(start_date, end_date)
          return [] if start_date.blank?
          
          start_date = Date.parse(start_date)
          end_date = end_date.present? ? Date.parse(end_date) : start_date
          
          (start_date..end_date).to_a
        end
      end
    end
  end
end
