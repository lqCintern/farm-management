module Repositories
  module Labor
    class WorkerProfileRepository
      include ::Interfaces::Repositories::Labor::WorkerProfileRepositoryInterface

      def find(id)
        record = ::Models::Labor::WorkerProfile.find_by(id: id)
        return nil unless record
        map_to_entity(record)
      end

      def find_by_user_id(user_id)
        record = ::Models::Labor::WorkerProfile.find_by(user_id: user_id)
        return nil unless record
        map_to_entity(record)
      end

      def find_available_workers(criteria = {})
        query = ::Models::Labor::WorkerProfile.where(availability: :available)
                                   .joins(:user)

        # Lọc theo kỹ năng
        if criteria[:skills].present?
          skills_array = criteria[:skills].is_a?(Array) ? criteria[:skills] : [ criteria[:skills] ]
          skills_array.each do |skill|
            query = query.where("labor_worker_profiles.skills LIKE ?", "%#{skill}%")
          end
        end

        # Lọc theo mức giá
        if criteria[:max_daily_rate].present?
          query = query.where("labor_worker_profiles.daily_rate <= ?", criteria[:max_daily_rate])
        end

        if criteria[:max_hourly_rate].present?
          query = query.where("labor_worker_profiles.hourly_rate <= ?", criteria[:max_hourly_rate])
        end

        # Lọc theo hộ sản xuất
        if criteria[:exclude_household_id].present?
          worker_ids = ::Models::Labor::HouseholdWorker.where(household_id: criteria[:exclude_household_id])
                                           .pluck(:worker_id)
          query = query.where.not(user_id: worker_ids) if worker_ids.any?
        end

        query.includes(:user).map { |record| map_to_entity(record) }
      end

      def create(worker_profile_entity)
        record = ::Models::Labor::WorkerProfile.find_by(user_id: worker_profile_entity.user_id)

        if record
          # Update existing record
          record.assign_attributes(
            skills: worker_profile_entity.skills || record.skills,
            daily_rate: worker_profile_entity.daily_rate || record.daily_rate,
            hourly_rate: worker_profile_entity.hourly_rate || record.hourly_rate,
            availability: worker_profile_entity.availability || record.availability
          )

          if record.save
            { success: true, profile: map_to_entity(record), action: :updated }
          else
            { success: false, errors: record.errors.full_messages }
          end
        else
          # Create new record
          record = ::Models::Labor::WorkerProfile.new(
            user_id: worker_profile_entity.user_id,
            skills: worker_profile_entity.skills,
            daily_rate: worker_profile_entity.daily_rate,
            hourly_rate: worker_profile_entity.hourly_rate,
            availability: worker_profile_entity.availability || :available
          )

          if record.save
            { success: true, profile: map_to_entity(record), action: :created }
          else
            { success: false, errors: record.errors.full_messages }
          end
        end
      end

      def update(worker_profile_entity)
        record = ::Models::Labor::WorkerProfile.find_by(user_id: worker_profile_entity.user_id)
        return [ nil, [ "Không tìm thấy hồ sơ người lao động" ] ] unless record

        record.assign_attributes(
          skills: worker_profile_entity.skills || record.skills,
          daily_rate: worker_profile_entity.daily_rate || record.daily_rate,
          hourly_rate: worker_profile_entity.hourly_rate || record.hourly_rate,
          availability: worker_profile_entity.availability || record.availability
        )

        if record.save
          [ map_to_entity(record), [] ]
        else
          [ nil, record.errors.full_messages ]
        end
      end

      def get_statistics(user_id)
        profile = ::Models::Labor::WorkerProfile.find_by(user_id: user_id)
        return nil unless profile

        completed_assignments = ::Models::Labor::LaborAssignment.where(worker_id: user_id, status: :completed)

        total_hours = completed_assignments.sum(:hours_worked)

        total_households_worked = ::Models::Labor::LaborAssignment.joins(:labor_request)
                                .where(worker_id: user_id)
                                .select("DISTINCT labor_requests.requesting_household_id")
                                .count

        average_rating = completed_assignments.where.not(worker_rating: nil).average(:worker_rating)

        Entities::Labor::WorkerStatistics.new(
          profile: map_to_entity(profile),
          completed_assignments_count: completed_assignments.count,
          total_hours_worked: total_hours,
          households_worked_for: total_households_worked,
          average_rating: average_rating
        )
      end

      def check_schedule_conflicts(worker_id, date, start_time, end_time)
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

        { conflicts: conflicts, has_conflict: conflicts.any? }
      end

      def get_availability_forecast(worker_id, start_date, end_date)
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

        { success: true, availability: availability }
      end

      private

      def map_to_entity(record)
        Entities::Labor::WorkerProfile.new(
          id: record.id,
          user_id: record.user_id,
          skills: record.skills,
          availability: record.availability,
          daily_rate: record.daily_rate,
          hourly_rate: record.hourly_rate
        )
      end
    end
  end
end
