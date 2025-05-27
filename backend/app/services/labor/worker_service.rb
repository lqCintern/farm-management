# app/services/labor/worker_service.rb
module Labor
  class WorkerService
    def self.create_or_update_profile(user, params)
      profile = Labor::WorkerProfile.find_by(user_id: user.id)
      
      if profile
        # Update
        profile.assign_attributes(
          skills: params[:skills] || profile.skills,
          daily_rate: params[:daily_rate] || profile.daily_rate,
          hourly_rate: params[:hourly_rate] || profile.hourly_rate,
          availability: params[:availability] || profile.availability
        )
        
        if profile.save
          { success: true, profile: profile, action: :updated }
        else
          { success: false, profile: profile, errors: profile.errors.full_messages }
        end
      else
        # Create
        profile = Labor::WorkerProfile.new(
          user_id: user.id,
          skills: params[:skills],
          daily_rate: params[:daily_rate],
          hourly_rate: params[:hourly_rate],
          availability: params[:availability] || :available
        )
        
        if profile.save
          { success: true, profile: profile, action: :created }
        else
          { success: false, profile: profile, errors: profile.errors.full_messages }
        end
      end
    end
    
    def self.find_available_workers(criteria = {})
      query = Labor::WorkerProfile.where(availability: :available)
                               .joins(:user)
      
      # Lọc theo kỹ năng
      if criteria[:skills].present?
        skills_array = criteria[:skills].is_a?(Array) ? criteria[:skills] : [criteria[:skills]]
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
        worker_ids = Labor::HouseholdWorker.where(household_id: criteria[:exclude_household_id])
                                         .pluck(:worker_id)
        query = query.where.not(user_id: worker_ids) if worker_ids.any?
      end
      
      query.includes(:user)
    end
    
    def self.worker_statistics(worker_user)
      profile = Labor::WorkerProfile.find_by(user_id: worker_user.id)
      return nil unless profile
      
      completed_assignments = Labor::LaborAssignment.where(worker_id: worker_user.id, status: :completed)
      
      total_hours = completed_assignments.sum(:hours_worked)
      
      total_households_worked = Labor::LaborAssignment.joins(:labor_request)
                              .where(worker_id: worker_user.id)
                              .select("DISTINCT labor_requests.requesting_household_id")
                              .count
      
      average_rating = completed_assignments.where.not(worker_rating: nil).average(:worker_rating)
      
      {
        profile: profile,
        completed_assignments_count: completed_assignments.count,
        total_hours_worked: total_hours,
        households_worked_for: total_households_worked,
        average_rating: average_rating
      }
    end
  end
end