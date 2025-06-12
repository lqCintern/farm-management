module Entities
  module Labor
    class WorkerProfile
      attr_accessor :id, :user_id, :skills, :availability,
                    :daily_rate, :hourly_rate
      
      def initialize(attrs = {})
        @id = attrs[:id]
        @user_id = attrs[:user_id]
        @skills = attrs[:skills]
        @availability = attrs[:availability] || 'available'
        @daily_rate = attrs[:daily_rate]
        @hourly_rate = attrs[:hourly_rate]
      end
    end

    class WorkerStatistics
      attr_accessor :profile, :completed_assignments_count, 
                    :total_hours_worked, :households_worked_for,
                    :average_rating
      
      def initialize(attrs = {})
        @profile = attrs[:profile]
        @completed_assignments_count = attrs[:completed_assignments_count] || 0
        @total_hours_worked = attrs[:total_hours_worked] || 0
        @households_worked_for = attrs[:households_worked_for] || 0
        @average_rating = attrs[:average_rating]
      end
    end
  end
end
