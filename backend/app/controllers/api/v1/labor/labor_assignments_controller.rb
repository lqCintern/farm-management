# app/controllers/api/v1/labor/labor_assignments_controller.rb
module Api
  module V1
    module Labor
      class LaborAssignmentsController < BaseController
        before_action :require_household
        before_action :set_labor_request, only: [:index, :create, :batch_assign]
        before_action :set_labor_assignment, only: [:show, :update, :destroy, :complete, :reject, :missed, :rate_worker, :rate_farmer]
        
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
          result = ::Labor::AssignmentService.create_assignment(
            @labor_request,
            labor_assignment_params.to_h,
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
        
        def complete
          result = ::Labor::AssignmentService.update_assignment_status(
            @labor_assignment,
            :completed,
            params.permit(:hours_worked, :notes),
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
        
        private
        
        def set_labor_request
          @labor_request = ::Labor::LaborRequest.find(params[:labor_request_id])
        end
        
        def set_labor_assignment
          @labor_assignment = ::Labor::LaborAssignment.find(params[:id])
        end
        
        def labor_assignment_params
          params.require(:labor_assignment).permit(:worker_id, :home_household_id, :work_date, :start_time, :end_time, :notes)
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
