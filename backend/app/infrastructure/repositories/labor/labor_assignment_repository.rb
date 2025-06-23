module Repositories
  module Labor
    class LaborAssignmentRepository
      include ::Interfaces::Repositories::Labor::LaborAssignmentRepositoryInterface

      def find(id)
        record = ::Models::Labor::LaborAssignment.find_by(id: id)
        return nil unless record
        map_to_entity(record)
      end

      def find_for_request(request_id)
        records = ::Models::Labor::LaborAssignment
          .where(labor_request_id: request_id)
          .includes(:worker, :home_household)
          .order(work_date: :asc, start_time: :asc)

        records.map { |record| map_to_entity(record) }
      end

      def find_for_worker(worker_id, filters = {})
        query = ::Models::Labor::LaborAssignment.where(worker_id: worker_id)

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

        query
          .includes(labor_request: [ :requesting_household, :providing_household ])
          .map { |record| map_to_entity(record) }
      end

      def find_for_household(household_id, filters = {})
        query = ::Models::Labor::LaborAssignment
          .joins(:labor_request)
          .where("labor_requests.requesting_household_id = ?", household_id)

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

        # Filter by upcoming
        if filters[:upcoming].present? && filters[:upcoming] == true
          query = query.where("work_date >= ?", Date.today)
                      .order(work_date: :asc, start_time: :asc)
        else
          query = query.order(work_date: :desc, start_time: :desc)
        end

        query
          .includes(:worker, labor_request: [ :requesting_household, :providing_household ])
          .map { |record| map_to_entity(record) }
      end

      def create(assignment_entity)
        record = ::Models::Labor::LaborAssignment.new(
          labor_request_id: assignment_entity.labor_request_id,
          worker_id: assignment_entity.worker_id,
          home_household_id: assignment_entity.home_household_id,
          work_date: assignment_entity.work_date,
          start_time: assignment_entity.start_time,
          end_time: assignment_entity.end_time,
          status: assignment_entity.status || "assigned",
          notes: assignment_entity.notes
        )

        if record.save
          [ map_to_entity(record), [] ]
        else
          [ nil, record.errors.full_messages ]
        end
      end

      def update(assignment_entity)
        record = ::Models::Labor::LaborAssignment.find_by(id: assignment_entity.id)
        return [ nil, [ "Không tìm thấy công việc" ] ] unless record

        record.assign_attributes(
          status: assignment_entity.status,
          hours_worked: assignment_entity.hours_worked,
          work_units: assignment_entity.work_units,
          notes: assignment_entity.notes,
          worker_rating: assignment_entity.worker_rating,
          farmer_rating: assignment_entity.farmer_rating,
          exchange_processed: assignment_entity.exchange_processed
        )

        if record.save
          [ map_to_entity(record), [] ]
        else
          [ nil, record.errors.full_messages ]
        end
      end

      def delete(id)
        record = ::Models::Labor::LaborAssignment.find_by(id: id)
        return [ false, [ "Không tìm thấy công việc" ] ] unless record

        if record.destroy
          [ true, [] ]
        else
          [ false, record.errors.full_messages ]
        end
      end

      def check_conflicts(worker_id, date, start_time, end_time)
        # Tìm các assignment cùng ngày
        assignments = ::Models::Labor::LaborAssignment.where(
          worker_id: worker_id,
          work_date: date,
          status: [ :assigned, :accepted, :pending ]
        )

        # Kiểm tra xung đột giờ làm việc
        conflicts = assignments.select do |assignment|
          # Kiểm tra xem các khoảng thời gian có giao nhau không
          (assignment.start_time < end_time) && (assignment.end_time > start_time)
        end

        {
          conflicts: conflicts.map { |record| map_to_entity(record) },
          has_conflict: conflicts.any?
        }
      end

      def get_worker_availability(worker_id, start_date, end_date)
        dates = (start_date.to_date..end_date.to_date).to_a

        # Lấy tất cả assignment trong khoảng thời gian
        assignments = ::Models::Labor::LaborAssignment.where(
          worker_id: worker_id,
          work_date: start_date..end_date,
          status: [ :assigned, :accepted, :pending ]
        ).order(:work_date, :start_time)

        # Map các ngày với thông tin khả dụng
        availability = dates.map do |date|
          day_assignments = assignments.select { |a| a.work_date == date }
          total_hours = day_assignments.sum { |a| (a.end_time - a.start_time) / 3600 }

          {
            date: date,
            assignments_count: day_assignments.size,
            total_hours: total_hours,
            is_fully_booked: total_hours >= 8
          }
        end

        availability
      end

      def rate_worker(id, rating)
        record = ::Models::Labor::LaborAssignment.find_by(id: id)
        return [ false, [ "Không tìm thấy công việc" ] ] unless record

        if record.update(worker_rating: rating)
          [ map_to_entity(record), [] ]
        else
          [ false, record.errors.full_messages ]
        end
      end

      def rate_farmer(id, rating)
        record = ::Models::Labor::LaborAssignment.find_by(id: id)
        return [ false, [ "Không tìm thấy công việc" ] ] unless record

        if record.update(farmer_rating: rating)
          [ map_to_entity(record), [] ]
        else
          [ false, record.errors.full_messages ]
        end
      end

      def batch_create(assignments)
        results = { successful: [], failed: [] }

        ::Labor::LaborAssignment.transaction do
          assignments.each do |assignment_entity|
            record = ::Models::Labor::LaborAssignment.new(
              labor_request_id: assignment_entity.labor_request_id,
              worker_id: assignment_entity.worker_id,
              home_household_id: assignment_entity.home_household_id,
              work_date: assignment_entity.work_date,
              start_time: assignment_entity.start_time,
              end_time: assignment_entity.end_time,
              status: assignment_entity.status || "assigned",
              notes: assignment_entity.notes
            )

            if record.save
              results[:successful] << map_to_entity(record)
            else
              results[:failed] << {
                entity: assignment_entity,
                errors: record.errors.full_messages
              }
            end
          end

          # Rollback nếu không có assignment nào thành công
          raise ActiveRecord::Rollback if results[:successful].empty?
        end

        results
      end

      private

      def map_to_entity(record)
        Entities::Labor::LaborAssignment.new(
          id: record.id,
          labor_request_id: record.labor_request_id,
          worker_id: record.worker_id,
          home_household_id: record.home_household_id,
          work_date: record.work_date,
          start_time: record.start_time,
          end_time: record.end_time,
          status: record.status,
          notes: record.notes,
          hours_worked: record.hours_worked,
          work_units: record.work_units,
          worker_rating: record.worker_rating,
          farmer_rating: record.farmer_rating,
          exchange_processed: record.exchange_processed,
          created_at: record.created_at,
          updated_at: record.updated_at
        )
      end
    end
  end
end
