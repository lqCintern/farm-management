module UseCases::Labor
  module LaborAssignments
    class CreateAssignment
      def initialize(repository)
        @repository = repository
      end

      def execute(labor_request, params, current_household)
        # Xử lý start_time và end_time để kết hợp với work_date
        work_date = Date.parse(params[:work_date].to_s)

        start_time = parse_time(params[:start_time], work_date, labor_request.start_time)
        end_time = parse_time(params[:end_time], work_date, labor_request.end_time)

        assignment_entity = Entities::Labor::LaborAssignment.new(
          labor_request_id: labor_request.id,
          worker_id: params[:worker_id],
          home_household_id: params[:home_household_id],
          work_date: work_date,
          start_time: start_time,
          end_time: end_time,
          status: "assigned",
          notes: params[:notes]
        )

        result = { success: false, assignment: nil, errors: [] }

        # Kiểm tra quyền hạn
        unless labor_request.requesting_household_id == current_household.id ||
               labor_request.providing_household_id == current_household.id
          result[:errors] << "Bạn không có quyền phân công cho yêu cầu này"
          return result
        end

        # Nếu là household nhận request, chỉ cho phép phân công workers thuộc household của mình
        if labor_request.providing_household_id == current_household.id
          worker_household = ::Models::Labor::HouseholdWorker.find_by(worker_id: params[:worker_id])&.household_id
          unless worker_household == current_household.id
            result[:errors] << "Bạn chỉ có thể phân công người lao động thuộc hộ của mình"
            return result
          end
        end

        # Validate dates
        unless labor_request.start_date <= assignment_entity.work_date && labor_request.end_date >= assignment_entity.work_date
          result[:errors] << "Ngày làm việc phải nằm trong khoảng thời gian của yêu cầu"
          return result
        end

        # Check availability
        conflicts = @repository.check_conflicts(
          assignment_entity.worker_id,
          assignment_entity.work_date,
          assignment_entity.start_time,
          assignment_entity.end_time
        )

        if conflicts[:has_conflict]
          result[:errors] << "Worker đã có lịch làm việc khác vào ngày này"
          result[:conflicts] = conflicts[:conflicts]
          return result
        end

        assignment, errors = @repository.create(assignment_entity)

        if assignment
          # Update worker profile if today
          if assignment.work_date == Date.today
            worker_profile = ::Models::Labor::WorkerProfile.find_by(user_id: assignment.worker_id)
            worker_profile&.update(availability: :busy)
          end

          result[:success] = true
          result[:assignment] = assignment
        else
          result[:errors] = errors
        end

        result
      end

      private

      def parse_time(time_param, work_date, default_time)
        if time_param.present?
          # Nếu start_time từ frontend là chuỗi giờ:phút
          if time_param.is_a?(String) && time_param.match(/^\d{1,2}:\d{2}(:\d{2})?$/)
            hours, minutes, seconds = time_param.split(":").map(&:to_i)
            seconds ||= 0
            work_date.to_time.change(hour: hours, min: minutes, sec: seconds)
          else
            # Nếu là datetime, chỉ lấy giờ phút và kết hợp với work_date
            time = Time.parse(time_param.to_s)
            work_date.to_time.change(hour: time.hour, min: time.min, sec: time.sec)
          end
        else
          # Sử dụng default_time (từ labor_request)
          work_date.to_time.change(hour: default_time.hour, min: default_time.min, sec: default_time.sec)
        end
      end
    end
  end
end
