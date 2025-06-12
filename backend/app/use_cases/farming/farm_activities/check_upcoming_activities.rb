module Farming
  module FarmActivities
    class CheckUpcomingActivities
      def initialize(repository, notification_service)
        @repository = repository
        @notification_service = notification_service
      end

      def execute
        # Kiểm tra hoạt động ngày mai
        upcoming = @repository.find_upcoming_activities

        upcoming.each do |activity|
          @notification_service.activity_reminder(activity, 1)
        end

        # Kiểm tra hoạt động quá hạn
        overdue = @repository.find_overdue_activities

        overdue.each do |activity|
          @notification_service.activity_overdue(activity)
        end

        {
          success: true,
          upcoming_count: upcoming.size,
          overdue_count: overdue.size
        }
      end
    end
  end
end
