module Api
  module V1
    module Labor
      class LaborAssignmentsController < BaseController
        before_action :require_household
        before_action :set_labor_request, only: [:index, :create, :batch_assign]
        before_action :set_labor_assignment, only: [:show, :update, :destroy, :report_completion, 
                                                 :complete, :reject, :missed, :rate_worker, :rate_farmer]

        def index
          assignments = CleanArch.labor_list_request_assignments.execute(@labor_request.id)
          render_success_response(assignments)
        end

        def show
          render_success_response(@labor_assignment)
        end

        def create
          # Chuyển đổi tham số để phù hợp với use case
          assignment_params = labor_assignment_params.to_h

          # Xử lý date_range
          if assignment_params[:date_range].present?
            begin
              work_date = Date.parse(assignment_params[:date_range][:start])
              assignment_params[:work_date] = work_date
            rescue Date::Error => e
              render_error_response("Ngày không hợp lệ: #{e.message}", :unprocessable_entity)
              return
            end
          end

          # Chuyển worker_ids thành worker_id
          if assignment_params[:worker_ids].present? && assignment_params[:worker_ids].is_a?(Array)
            assignment_params[:worker_id] = assignment_params[:worker_ids].first
          end

          # Đảm bảo có home_household_id
          assignment_params[:home_household_id] ||= current_household.id

          result = CleanArch.labor_create_assignment.execute(
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

          result = CleanArch.labor_batch_assign_workers.execute(
            @labor_request,
            worker_ids,
            date_range,
            current_household
          )

          if result[:success]
            render_success_response({
              message: "Đã phân công thành công #{result[:successful]}/#{result[:total]} lượt",
              successful: result[:successful],
              failed: result[:failed],
              errors: result[:errors]
            })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def update
          # Thiết kế theo Clean Architecture không có cập nhật trực tiếp
          # Thay vào đó, sẽ có các action cụ thể cho từng loại cập nhật
          render_error_response("Không hỗ trợ cập nhật trực tiếp. Vui lòng sử dụng các endpoint chuyên biệt.", :method_not_allowed)
        end

        def destroy
          result = CleanArch.labor_delete_assignment.execute(params[:id], current_user)
          
          if result[:success]
            render_success_response({ message: result[:message] })
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def report_completion
          notes = params[:notes] || params.dig(:labor_assignment, :notes)
          
          result = CleanArch.labor_update_assignment_status.execute(
            @labor_assignment,
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

        def complete
          hours_worked = params[:hours_worked] || params.dig(:labor_assignment, :hours_worked)
          notes = params[:notes] || params.dig(:labor_assignment, :notes)
          
          result = CleanArch.labor_update_assignment_status.execute(
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
          result = CleanArch.labor_update_assignment_status.execute(
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
          result = CleanArch.labor_update_assignment_status.execute(
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
          result = CleanArch.labor_rate_assignment.rate_worker(
            params[:id], 
            params[:rating],
            current_user
          )

          if result[:success]
            render_success_response(result[:assignment])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def rate_farmer
          result = CleanArch.labor_rate_assignment.rate_farmer(
            params[:id], 
            params[:rating],
            current_user
          )

          if result[:success]
            render_success_response(result[:assignment])
          else
            render_error_response(result[:errors], :unprocessable_entity)
          end
        end

        def my_assignments
          filters = params.permit(:status, :start_date, :end_date, :upcoming).to_h
          
          assignments = CleanArch.labor_list_worker_assignments.execute(
            current_user.id,
            filters
          )
          
          render_success_response(assignments)
        end

        def check_conflicts
          worker_id = params[:worker_id].to_i
          date = params[:date]
          start_time = Time.parse(params[:start_time])
          end_time = Time.parse(params[:end_time])
          
          result = CleanArch.labor_check_scheduling.check_conflicts(
            worker_id,
            date,
            start_time,
            end_time
          )
          
          render_success_response({
            has_conflict: result[:has_conflict],
            conflicts: result[:conflicts]
          })
        end

        def worker_availability
          worker_id = params[:worker_id].to_i
          start_date = params[:start_date] || Date.today.to_s
          end_date = params[:end_date] || (Date.today + 14.days).to_s
          
          result = CleanArch.labor_check_scheduling.get_worker_availability(
            worker_id,
            start_date,
            end_date
          )
          
          render_success_response(result[:availability])
        end

        def household_assignments
          filters = params.permit(:status, :start_date, :end_date, :upcoming, :request_id).to_h
          
          assignments = CleanArch.labor_list_household_assignments.execute(
            current_household.id,
            filters
          )
          
          render_success_response(assignments)
        end

        def complete_multiple
          assignment_ids = params[:assignment_ids]
          notes = params[:notes]
          
          unless assignment_ids.is_a?(Array) && assignment_ids.any?
            render_error_response("Cần cung cấp danh sách assignment_ids", :bad_request)
            return
          end
          
          results = CleanArch.labor_complete_multiple_assignments.execute(
            assignment_ids,
            { notes: notes },
            current_user
          )
          
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
          @labor_assignment = CleanArch.labor_get_assignment.execute(params[:id])
          unless @labor_assignment
            render_error_response("Không tìm thấy công việc với ID #{params[:id]}", :not_found)
          end
        end

        def labor_assignment_params
          # Cho phép nhiều tham số hơn để tương thích
          params.require(:labor_assignment).permit(
            :worker_id, :home_household_id, :work_date, :start_time, :end_time, :notes,
            :labor_request_id, :request_id, :hours_worked, worker_ids: [],
            date_range: [ :start, :end ]  # Thêm date_range vào danh sách params
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
