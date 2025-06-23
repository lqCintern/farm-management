module UseCases::Labor
  module LaborAssignments
    class BatchAssignWorkers
      def initialize(repository)
        @repository = repository
      end

      def execute(labor_request, worker_ids, date_range, current_household)
        result = { success: false, total: 0, successful: 0, failed: 0, errors: [], assignments: [] }

        # Validate permissions
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
        assignments_to_create = []

        worker_ids.each do |worker_id|
          worker_household = ::Models::Labor::HouseholdWorker.find_by(worker_id: worker_id)&.household_id

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

            assignment_entity = Entities::Labor::LaborAssignment.new(
              labor_request_id: labor_request.id,
              worker_id: worker_id,
              home_household_id: worker_household,
              work_date: work_date,
              start_time: start_time,
              end_time: end_time,
              status: "assigned"
            )

            # Check availability
            conflicts = @repository.check_conflicts(
              worker_id,
              work_date,
              start_time,
              end_time
            )

            if conflicts[:has_conflict]
              result[:errors] << "Worker #{worker_id} đã có lịch làm việc vào ngày #{work_date}"
              result[:failed] += 1
              next
            end

            assignments_to_create << assignment_entity
          end
        end

        # Batch create assignments
        if assignments_to_create.any?
          batch_result = @repository.batch_create(assignments_to_create)

          result[:successful] = batch_result[:successful].length
          result[:failed] += (assignments_to_create.length - batch_result[:successful].length)
          result[:assignments] = batch_result[:successful]

          if batch_result[:failed].any?
            batch_result[:failed].each do |failed|
              worker_id = failed[:entity].worker_id
              work_date = failed[:entity].work_date
              errors = failed[:errors].join(", ")
              result[:errors] << "Không thể phân công worker #{worker_id} vào ngày #{work_date}: #{errors}"
            end
          end

          # Update worker profiles for today's assignments
          batch_result[:successful].each do |assignment|
            if assignment.work_date == Date.today
              worker_profile = ::Models::Labor::WorkerProfile.find_by(user_id: assignment.worker_id)
              worker_profile&.update(availability: :busy)
            end
          end
        end

        result[:success] = result[:successful] > 0
        result
      end
    end
  end
end
